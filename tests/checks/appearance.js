const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.evaluate(() => localStorage.removeItem("win95-color-scheme"))
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)

  const colors = () =>
    p.evaluate(() => {
      const header = document.querySelector(".window-header")
      const face = document.querySelector(".bg-\\[\\#c0c0c0\\]")
      const taskbar = document.getElementById("taskbar")
      return {
        header: header ? getComputedStyle(header).backgroundColor : "none",
        face: face ? getComputedStyle(face).backgroundColor : "none",
        taskbarTop: getComputedStyle(taskbar).backgroundImage,
      }
    })

  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "calculator" } })))
  await p.waitForSelector(".window-header", { timeout: 15000 })
  const before = await colors()
  ok("Windows Standard is the hard-coded original", before.header === "rgb(0, 0, 128)" && before.face === "rgb(192, 192, 192)" && before.taskbarTop.includes("rgb(192, 192, 192)"), JSON.stringify(before))

  // Rose, from the Appearance tab.
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "appearance" } })))
  await p.waitForTimeout(600)
  const schemeSelect = p.locator("select", { has: p.locator('option[value="rose"]') })
  await schemeSelect.selectOption("rose")
  await p.waitForTimeout(400)
  const rose = await colors()
  ok("Rose recolors the title bars", rose.header === "rgb(192, 64, 96)", rose.header)
  ok("and the window faces", rose.face === "rgb(255, 192, 208)", rose.face)
  ok("and the taskbar gradient", rose.taskbarTop.includes("rgb(255, 192, 208)"), rose.taskbarTop.slice(0, 60))

  // Close the dialog, reload: the scheme survives.
  await p.keyboard.press("Escape")
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(600)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "calculator" } })))
  await p.waitForSelector(".window-header", { timeout: 15000 })
  const reloaded = await colors()
  ok("the scheme survives a reload", reloaded.header === "rgb(192, 64, 96)" && reloaded.face === "rgb(255, 192, 208)", JSON.stringify(reloaded))

  // And Windows Standard puts everything back.
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "appearance" } })))
  await p.waitForTimeout(600)
  await p.locator("select", { has: p.locator('option[value="rose"]') }).selectOption("windows-standard")
  await p.waitForTimeout(400)
  const back = await colors()
  ok("Windows Standard restores the original", back.header === "rgb(0, 0, 128)" && back.face === "rgb(192, 192, 192)", JSON.stringify(back))
  await p.evaluate(() => localStorage.removeItem("win95-color-scheme"))

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
