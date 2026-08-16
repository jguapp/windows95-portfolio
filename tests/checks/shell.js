const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))

  const boot = async () => {
    await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
    await p.waitForSelector("#win95-popup", { timeout: 90000 })
  }

  await boot()
  await p.evaluate(() => localStorage.clear())
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })

  // ---- #63: the popup asks about persistence, not the welcome screen -------
  const label = await p.locator("[data-persist-toggle]").innerText()
  ok("#63 the footer asks about remembering changes", label.includes("emember my files"), label.slice(0, 60))
  ok("#63 the old show-this-screen ask is gone", !label.includes("Welcome Screen"))
  const checked = await p.locator("[data-persist-toggle] span.text-black").count()
  ok("#67 the box defaults to unchecked", checked === 0)
  // Opt in for the rest of the run.
  await p.locator("[data-persist-toggle] div").first().click()
  await p.waitForTimeout(200)
  ok("#67 checking it stores the flag", (await p.evaluate(() => localStorage.getItem("win95:persist"))) === "1")

  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(500)

  // ---- #59: explicit Windows Standard on a fresh boot ----------------------
  const vars = await p.evaluate(() => ({
    highlight: document.documentElement.style.getPropertyValue("--win95-highlight-color"),
    face: document.documentElement.style.getPropertyValue("--win95-window-color"),
  }))
  ok("#59 the scheme variables are set explicitly", vars.highlight === "#000080" && vars.face === "#c0c0c0", JSON.stringify(vars))

  // ---- #61: the clock ------------------------------------------------------
  const clock = await p.evaluate(() => {
    const mid = (r) => (r.top + r.bottom) / 2
    const c = document.getElementById("clock")
    const cs = getComputedStyle(c)
    return {
      fs: cs.fontSize,
      clockMid: mid(c.getBoundingClientRect()),
      trayMid: mid(document.getElementById("right-section").getBoundingClientRect()),
    }
  })
  ok("#61 the clock is 13px", clock.fs === "13px", clock.fs)
  ok("#61 and centred in the tray", Math.abs(clock.clockMid - clock.trayMid) < 1, `${clock.clockMid} vs ${clock.trayMid}`)

  // ---- #62: the real icons are served --------------------------------------
  for (const icon of ["charmap-32", "charmap-16", "cdplayer-32", "phone-32", "hyperterm-32", "defrag-32"]) {
    const status = await p.evaluate(async (name) => (await fetch(`/images/win95/${name}.png`)).status, icon)
    ok(`#62 ${icon}.png serves`, status === 200, `HTTP ${status}`)
  }

  // ---- #60: 2K and 4K ------------------------------------------------------
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(300)
  const options = await p.locator("[data-resolution-option]").count()
  ok("#60 six modes in the picker", options === 6, `${options}`)
  await p.locator('[data-resolution-option="3840"]').click()
  await p.waitForTimeout(400)
  const zoom = await p.evaluate(() => Number(document.getElementById("shell-root").style.zoom))
  ok("#60 4K shrinks the shell below 1x", zoom > 0.3 && zoom < 0.4, `zoom ${zoom} (1400/3840=0.365)`)
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(600)
  const zoomAfter = await p.evaluate(() => Number(document.getElementById("shell-root").style.zoom))
  ok("#60 it survives a reload", zoomAfter > 0.3 && zoomAfter < 0.4, `zoom ${zoomAfter}`)
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(200)
  await p.locator('[data-resolution-option="native"]').click()
  await p.waitForTimeout(300)

  // ---- #63: unchecking stops and clears -----------------------------------
  // Save a file first so there is something to clear.
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "notepad" } })))
  await p.waitForSelector("#window-notepad", { timeout: 15000 })
  await p.locator("#window-notepad textarea").fill("ephemeral qzv")
  await p.locator("#window-notepad").getByText("File", { exact: true }).click()
  await p.getByText("Save As...", { exact: true }).click()
  await p.waitForTimeout(300)
  await p.locator("#window-notepad input").first().fill("Ephemeral.txt")
  await p.locator("#window-notepad").getByText("Save", { exact: true }).last().click()
  await p.waitForTimeout(400)
  ok("#63 the file was saved while enabled", (await p.evaluate(() => localStorage.getItem("win95:fs:v2"))) !== null)

  // Reopen the welcome popup by reloading, then uncheck.
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.locator("[data-persist-toggle] div").first().click()
  await p.waitForTimeout(300)
  const state = await p.evaluate(() => ({
    flag: localStorage.getItem("win95:persist"),
    fs: localStorage.getItem("win95:fs:v2"),
    items: localStorage.getItem("win95:desktop-items:v1"),
  }))
  ok("#63 unchecking flips the flag", state.flag === "0", String(state.flag))
  ok("#63 and clears the saved work", state.fs === null && state.items === null)

  // New work does not survive a reload while disabled.
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "notepad" } })))
  await p.waitForSelector("#window-notepad", { timeout: 15000 })
  await p.locator("#window-notepad textarea").fill("gone tomorrow qzv")
  await p.locator("#window-notepad").getByText("File", { exact: true }).click()
  await p.getByText("Save As...", { exact: true }).click()
  await p.waitForTimeout(300)
  await p.locator("#window-notepad input").first().fill("Gone.txt")
  await p.locator("#window-notepad").getByText("Save", { exact: true }).last().click()
  await p.waitForTimeout(400)
  ok("#63 nothing is written while disabled", (await p.evaluate(() => localStorage.getItem("win95:fs:v2"))) === null)

  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  // Re-enable from the popup for whoever visits next.
  await p.locator("[data-persist-toggle] div").first().click()
  await p.waitForTimeout(300)
  ok("#63 rechecking re-enables", (await p.evaluate(() => localStorage.getItem("win95:persist"))) === "1")
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "find-files" } })))
  await p.waitForSelector("[data-find]", { timeout: 15000 })
  await p.locator("[data-find-named]").fill("Gone")
  await p.locator("[data-find-now]").click()
  await p.waitForTimeout(400)
  ok("#63 the disabled-session file was forgotten", (await p.locator("[data-find-hit]").count()) === 0)

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
