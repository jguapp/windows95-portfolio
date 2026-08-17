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

  // ---- #93 remainder: hourglass, F1 Help, the mixer, Documents -------------
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "calculator" } })))
  const busyNow = await p.evaluate(() => document.body.classList.contains("win95-busy"))
  await p.waitForTimeout(900)
  const busyAfter = await p.evaluate(() => document.body.classList.contains("win95-busy"))
  ok("#11 launches show the hourglass and clear it", busyNow && !busyAfter)

  await p.keyboard.press("F1")
  await p.waitForTimeout(300)
  ok("#13 F1 opens Windows Help", (await p.locator("[data-help-window]").count()) === 1)
  await p.locator("[data-help-window]").getByRole("button", { name: "Close", exact: true }).click()
  await p.waitForTimeout(200)

  await p.locator("#sound-button").dblclick()
  await p.waitForTimeout(300)
  ok("#27 double-click opens the four-channel mixer", (await p.locator("[data-mixer-channel]").count()) === 4)
  // The open windows cover the desktop, so dismiss through the panel's own
  // close button rather than hunting for bare desktop.
  await p.locator("[data-mixer-panel]").getByLabel("Close Volume Control").click()
  await p.waitForTimeout(200)
  ok("#27 closing puts it away", (await p.locator("[data-mixer-panel]").count()) === 0)

  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "explorer" } })))
  await p.waitForTimeout(700)
  await p.locator("#window-explorer").getByText("My Documents", { exact: true }).last().dblclick()
  await p.waitForTimeout(500)
  await p.locator("#window-explorer").getByText("Readme.txt", { exact: true }).last().dblclick()
  await p.waitForTimeout(600)
  await p.locator("#start-button").click()
  await p.waitForTimeout(400)
  await p.locator("#start-menu li", { hasText: "ocuments" }).first().hover()
  await p.waitForTimeout(800)
  const docsMenu = await p.locator("[data-documents-menu]").innerText().catch(() => "")
  ok("#33 opened documents reach the Documents menu", docsMenu.includes("Readme.txt"), docsMenu.replace(/\n/g, ", ").slice(0, 80))
  ok("#33 programs stay out of it", !docsMenu.includes(".exe"))
  await p.keyboard.press("Escape")

  // ---- #94: the clipboard, Copy of naming, Properties, wallpaper, appwiz ---
  // Earlier steps leave the Start menu open and several windows stacked on
  // the desk, and whichever is on top eats the clicks below. Clear the desk
  // by id, then bring up a single Explorer.
  const clearDesk = () =>
    p.evaluate(() => {
      for (const el of document.querySelectorAll("[id^='window-']")) {
        const id = el.id.replace(/^window-/, "")
        window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id } }))
      }
    })
  await p.locator("#start-button").click()
  await p.waitForTimeout(300)
  await clearDesk()
  await p.waitForTimeout(400)
  await p.evaluate(() => {
    window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "explorer" } }))
  })
  await p.waitForSelector("#window-explorer", { timeout: 15000 })
  await p.waitForTimeout(400)
  const ex = p.locator("#window-explorer")
  await ex.locator("[data-status]").click()
  await p.waitForTimeout(200)
  // Land in My Documents, wherever the earlier steps left the view.
  if (!(await ex.getByText("Readme.txt", { exact: true }).count())) {
    await ex.getByText("My Documents", { exact: true }).last().dblclick()
    await p.waitForTimeout(400)
  }
  const exMenu = async (bar, item) => {
    await ex.getByRole("button", { name: bar, exact: true }).click()
    await p.waitForTimeout(150)
    await ex.locator(`[data-menu-item="${item}"]`).click()
    await p.waitForTimeout(300)
  }
  await ex.getByText("Readme.txt", { exact: true }).last().click()
  await exMenu("File", "Properties")
  const sheet = (await p.locator("[data-file-properties]").innerText().catch(() => "")).replace(/\n/g, " ")
  ok("#158 the Properties sheet reports the file", /Readme.txt Properties/.test(sheet) && /bytes/.test(sheet), sheet.slice(0, 70))
  await p.locator("[data-file-properties]").getByRole("button", { name: "OK" }).click()
  await p.waitForTimeout(200)

  await ex.getByText("Readme.txt", { exact: true }).last().click()
  await exMenu("Edit", "Copy")
  await exMenu("Edit", "Paste")
  ok("#43 a colliding paste becomes Copy of", /Copy of Readme.txt/.test(await ex.innerText()))
  await exMenu("Edit", "Paste")
  ok("#43 and then Copy (2) of", /Copy \(2\) of Readme.txt/.test(await ex.innerText()))

  // Display Properties sits below the window layer, so clear the windows off
  // the desk before driving it.
  await clearDesk()
  await p.waitForTimeout(300)
  await p.evaluate(() =>
    window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "background" } })),
  )
  await p.waitForTimeout(600)
  const wpBefore = await p.locator("[data-wallpaper-select]").inputValue()
  await p.locator("[data-wallpaper-random]").click()
  await p.waitForTimeout(300)
  ok("#23 Surprise Me changes the wallpaper", (await p.locator("[data-wallpaper-select]").inputValue()) !== wpBefore)
  const tinyPng =
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2NkYGD4z0AEYBxVSFNFjIyM/4nxNQBHbgMBQZFMbwAAAABJRU5ErkJggg=="
  await p.locator("[data-wallpaper-file]").setInputFiles({
    name: "mine.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPng, "base64"),
  })
  await p.waitForTimeout(600)
  const bg = await p.evaluate(() => document.getElementById("desktop").style.backgroundImage)
  ok("#24 an uploaded bitmap becomes the wallpaper", bg.includes("data:image/"))
  await p.keyboard.press("Escape")
  await p.getByRole("button", { name: "OK", exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(300)

  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "add-remove" } })))
  await p.waitForSelector("[data-add-remove]", { timeout: 15000 })
  ok("#170 Add/Remove lists the installed software", (await p.locator("[data-program]").count()) === 12)
  await p.locator('[data-program="Microsoft Paint"]').click()
  await p.locator("[data-add-remove-btn]").click()
  await p.waitForTimeout(400)
  const refusal = await p.locator("[data-messagebox]").innerText().catch(() => "")
  ok("#170 removal is politely refused", /cannot remove/i.test(refusal), refusal.replace(/\n/g, " ").slice(0, 60))
  await p.locator("[data-ok]").click()

  // ---- Accessories: every entry must open a real window --------------------
  // The cascade once rendered STUB_PROGRAMS, so a program built for real
  // dropped out of the menu silently. This walks the folder itself.
  await p.evaluate(() => {
    for (const id of ["cdplayer", "phonedialer", "scandisk", "defrag"]) {
      window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id } }))
    }
  })
  await p.waitForTimeout(300)

  const openAccessories = async () => {
    // The menu does not close itself when an entry is clicked, so toggling
    // blindly would shut it rather than open it.
    if ((await p.locator("#start-menu").count()) === 0) {
      await p.locator("#start-button").click()
      await p.waitForTimeout(250)
    }
    await p.locator("#start-menu li", { hasText: "rograms" }).first().hover()
    await p.waitForSelector("#start-menu li >> text=Accessories", { timeout: 10000 })
    await p.locator("#start-menu li", { hasText: "Accessories" }).last().hover()
    await p.waitForSelector("[data-accessories]", { timeout: 10000 })
  }

  await openAccessories()
  const listed = await p.locator("[data-accessory]").evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-accessory")),
  )
  const expected = [
    "cdplayer",
    "charmap",
    "defrag",
    "hyperterm",
    "mediaplayer",
    "phonedialer",
    "scandisk",
    "soundrec",
    "wordpad",
  ]
  ok("Accessories lists all nine programs", expected.every((id) => listed.includes(id)), listed.join(", "))

  // The four that graduated from stubs must open their real windows, not
  // the stub frame and not the fallback.
  const real = [
    ["cdplayer", "[data-cdplayer]"],
    ["phonedialer", "[data-dialer]"],
    ["scandisk", "[data-scandisk]"],
    ["defrag", "[data-defrag]"],
  ]
  for (const [id, selector] of real) {
    await openAccessories()
    await p.locator(`[data-accessory="${id}"]`).click()
    await p.waitForTimeout(800)
    const opened = await p.locator(selector).count()
    const stub = await p.locator(`[data-stub="${id}"]`).count()
    const missing = await p.getByText("Content not available").count()
    ok(`Accessories opens ${id} for real`, opened > 0 && stub === 0 && missing === 0, `${opened} real, ${stub} stub`)
  }

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
