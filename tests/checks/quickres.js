const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.evaluate(() => localStorage.removeItem("win95-resolution"))
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)

  // ---- The tray popup ------------------------------------------------------
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(300)
  ok("tray click opens the picker", (await p.locator("[data-resolution-panel]").count()) === 1)
  const options = await p.locator("[data-resolution-option]").count()
  ok("it lists the six modes", options === 6, `${options} options`)
  const checked = await p.locator("[data-resolution-panel]").innerText()
  ok("the active mode is marked", checked.includes("✓"), "")

  // Outside click closes it.
  await p.locator("#desktop").click({ position: { x: 600, y: 300 } })
  await p.waitForTimeout(300)
  ok("outside click dismisses it", (await p.locator("[data-resolution-panel]").count()) === 0)

  // ---- Picking one zooms the shell and persists ---------------------------
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(200)
  await p.locator('[data-resolution-option="800"]').click()
  await p.waitForTimeout(400)
  const zoom = await p.evaluate(() => document.getElementById("shell-root").style.zoom)
  ok("800x600 zooms the shell", Number(zoom) > 1.5, `zoom ${zoom} (1400/800=1.75)`)
  ok("the picker closed on pick", (await p.locator("[data-resolution-panel]").count()) === 0)

  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(600)
  const zoomAfter = await p.evaluate(() => document.getElementById("shell-root").style.zoom)
  ok("the resolution survives a reload", Number(zoomAfter) > 1.5, `zoom ${zoomAfter}`)

  await p.locator("#resolution-button").click()
  await p.waitForTimeout(300)
  const marked = await p.locator("[data-resolution-panel]").innerText()
  ok("the mark follows the stored mode", marked.indexOf("✓") >= 0 && marked.includes("800 by 600"), "")
  await p.locator('[data-resolution-option="native"]').click()
  await p.waitForTimeout(300)

  // ---- Display Properties settings tab shows a list, no slider ------------
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(200)
  await p.locator("[data-resolution-settings]").click()
  await p.waitForTimeout(700)
  ok("the menu routes to Display Properties", (await p.getByText("Desktop area:").count()) >= 1)
  ok("no slider remains", (await p.locator("[data-resolution-slider]").count()) === 0)
  const tabOptions = await p.locator(".win95-type [data-resolution-option], [data-resolution-option]").count()
  ok("the tab offers the list instead", tabOptions >= 4, `${tabOptions} options`)
  await p.locator('[data-resolution-option="1024"]').last().click()
  await p.waitForTimeout(400)
  const zoom3 = await p.evaluate(() => document.getElementById("shell-root").style.zoom)
  ok("picking in the tab applies too", Number(zoom3) > 1.05, `zoom ${zoom3} (1400/1024=1.37)`)

  // Back to native for whoever runs next.
  await p.locator('[data-resolution-option="native"]').last().click()
  await p.waitForTimeout(300)

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
