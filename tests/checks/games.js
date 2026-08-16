/**
 * Behaviour checks for the games window (issue #96).
 *
 * Currently covers the Minesweeper pass: the Custom Field dialog and its
 * clamping, the Fastest Mine Sweepers dialog with Reset Scores, the xyzzy
 * pixel, and Flowers mode.
 */
const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))

  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)

  // ---- Open Minesweeper through the Games folder ---------------------------
  await p.getByText("Games", { exact: true }).first().dblclick()
  await p.waitForTimeout(600)
  await p.getByText("Minesweeper", { exact: true }).first().dblclick()
  await p.waitForSelector("[data-minesweeper]", { timeout: 15000 })
  const ms = p.locator("[data-minesweeper]")

  const openMenu = async (name, item) => {
    await ms.getByRole("button", { name, exact: true }).click()
    await p.waitForTimeout(150)
    await ms.getByRole("button", { name: item }).click()
    await p.waitForTimeout(200)
  }

  // ---- #74: Custom Field ---------------------------------------------------
  await openMenu("Game", "Custom...")
  ok("#74 the Custom Field dialog opens", (await p.locator("[data-custom-field]").count()) === 1)
  await p.locator('[data-custom="rows"]').fill("12")
  await p.locator('[data-custom="cols"]').fill("14")
  await p.locator('[data-custom="mines"]').fill("30")
  await p.locator("[data-custom-ok]").click()
  await p.waitForTimeout(400)
  let cells = await ms.locator("[data-cell]").count()
  ok("#74 a 12x14 board deals 168 cells", cells === 168, `${cells}`)
  let mines = await ms.locator('[data-counter="mines"]').getAttribute("aria-label")
  ok("#74 the mine counter reads the custom count", mines === "mines")
  const counterText = await ms.locator('[data-counter="mines"]').innerText()

  // Absurd input clamps instead of erroring, as the original did.
  await openMenu("Game", "Custom...")
  await p.locator('[data-custom="rows"]').fill("99")
  await p.locator('[data-custom="cols"]').fill("99")
  await p.locator('[data-custom="mines"]').fill("9999")
  await p.locator("[data-custom-ok]").click()
  await p.waitForTimeout(400)
  cells = await ms.locator("[data-cell]").count()
  ok("#74 99x99x9999 clamps to 24x30x667", cells === 24 * 30, `${cells} cells`)

  // ---- #75: Fastest Mine Sweepers ------------------------------------------
  await openMenu("Game", "Best Times...")
  const dlg = p.locator("[data-best-times]")
  ok("#75 the Best Times dialog opens", (await dlg.count()) === 1)
  const text = await dlg.innerText()
  ok("#75 empty slate reads 999 seconds by Anonymous", (text.match(/999 seconds/g) || []).length === 3 && text.includes("Anonymous"), text.replace(/\n/g, " ").slice(0, 90))
  ok("#75 all three level names show", text.includes("Beginner") && text.includes("Intermediate") && text.includes("Expert"))
  ok("#75 Reset Scores is offered", (await p.locator("[data-reset-scores]").count()) === 1)
  await p.locator("[data-reset-scores]").click()
  await dlg.getByRole("button", { name: "OK" }).click()
  await p.waitForTimeout(200)

  // ---- #76 xyzzy and #176 Flowers, on a beginner board ---------------------
  await openMenu("Game", "Beginner")
  await openMenu("Game", "Flowers")
  await p.keyboard.type("xyzzy")
  await p.keyboard.press("Shift+Enter")

  // First click places the mines; corners of a 9x9 tend to open a region.
  await ms.locator('[data-cell="4-4"]').click()
  await p.waitForTimeout(1200)

  // Hover unrevealed cells until the corner pixel reports a mine.
  let mineCell = null
  let sawWhite = false
  for (let r = 0; r < 9 && !mineCell; r++) {
    for (let c = 0; c < 9 && !mineCell; c++) {
      await ms.locator(`[data-cell="${r}-${c}"]`).hover()
      const px = p.locator("[data-xyzzy]")
      if ((await px.count()) === 0) continue
      const color = await px.evaluate((el) => el.style.backgroundColor)
      if (color === "rgb(255, 255, 255)") sawWhite = true
      if (color === "rgb(0, 0, 0)") mineCell = `${r}-${c}`
    }
  }
  ok("#76 the xyzzy pixel shows white over safe squares", sawWhite)
  ok("#76 and black over a mine", mineCell !== null, mineCell ?? "none found")

  // ---- #176: stepping on it in Flowers mode reveals flowers ----------------
  if (mineCell) {
    await ms.locator(`[data-cell="${mineCell}"]`).click()
    await p.waitForTimeout(900)
    const flowersShown = await ms.locator("[data-flower]").count()
    const minesShown = await ms.locator("[data-mine]").count()
    ok("#176 mines draw as flowers", flowersShown === 10 && minesShown === 0, `${flowersShown} flowers, ${minesShown} mines`)
    ok("the dead face still appears", (await ms.locator('[data-face="dead"]').count()) === 1)
  }

  ok("no page errors during the games pass", errors.length === 0, errors.join(" | ").slice(0, 200))
  console.log(`  (custom counter read: ${counterText.trim().slice(0, 20)})`)
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
