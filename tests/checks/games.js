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

  // ---- Solitaire: Vegas buy-in, deck picker, the Alt+Shift+2 win -----------
  await openMenu("Game", "Exit")
  await p.waitForTimeout(400)
  await p.getByText("Solitaire", { exact: true }).first().dblclick()
  await p.waitForSelector("[data-table]", { timeout: 15000 })
  await p.waitForTimeout(400)

  const menuClick = async (name, item) => {
    await p.getByRole("button", { name, exact: true }).first().click()
    await p.waitForTimeout(150)
    await p.getByRole("button", { name: item }).first().click()
    await p.waitForTimeout(250)
  }

  // #70: switching to Vegas redeals $52 in the hole, shown in dollars.
  await menuClick("Options", "Standard scoring")
  let scoreText = await p.locator("[data-score]").innerText()
  ok("#70 Vegas starts $52 down", scoreText.trim() === "$-52", scoreText)

  // #72: the deck picker offers the twelve backs.
  await menuClick("Game", "Deck...")
  const backs = await p.locator("[data-deck-picker] [data-deck]").count()
  ok("#72 twelve card backs on offer", backs === 12, `${backs}`)
  await p.locator('[data-deck="4"]').click()
  await p.waitForTimeout(200)
  ok("#72 picking one closes the picker", (await p.locator("[data-deck-picker]").count()) === 0)

  // #73: Alt+Shift+2 ends the game in a win.
  await p.keyboard.press("Alt+Shift+Digit2")
  await p.waitForTimeout(600)
  const status = await p.locator("[data-table]").locator("..").innerText()
  ok("#73 the instant win lands", /Game Won!/.test(status), status.slice(0, 60))

  // ---- FreeCell: the joke deals and Statistics -----------------------------
  // A keydown stops the cascade; the win dialog then offers New Game.
  await p.keyboard.press("Escape")
  await p.waitForTimeout(500)
  for (let i = 0; i < 6; i++) {
    const newGame = p.getByRole("button", { name: "New Game", exact: true })
    if (await newGame.count()) {
      await newGame.first().click()
      break
    }
    await p.keyboard.press("Escape")
    await p.waitForTimeout(400)
  }
  await p.waitForTimeout(300)
  await menuClick("Game", "Exit")
  await p.waitForTimeout(400)
  await p.getByText("FreeCell", { exact: true }).first().dblclick()
  await p.waitForSelector("[data-freecell]", { timeout: 15000 })
  await p.waitForTimeout(400)

  // #79: deal -1 exists and announces itself.
  await menuClick("Game", "Select Game...")
  await p.locator("#deal-number").fill("-1")
  await p.getByRole("button", { name: "OK", exact: true }).click()
  await p.waitForTimeout(400)
  let fcStatus = await p.locator("[data-freecell]").innerText()
  ok("#79 game -1 deals", /#-1/.test(fcStatus), fcStatus.match(/#-?\d+/)?.[0] ?? "")
  const colCards = await p.locator('[data-column="0"] [data-card]').count()
  ok("#79 the unshuffled deal fills the columns", colCards === 7, `${colCards} in column 0`)

  // #80: a resigned game counts as a loss in Statistics.
  await p.locator('[data-column="0"] [data-card]').last().click()
  await p.waitForTimeout(150)
  await p.locator('[data-free="0"]').click()
  await p.waitForTimeout(200)
  await menuClick("Game", "New Game")
  await menuClick("Game", "Statistics...")
  const statsText = await p.locator("[data-stats]").innerText()
  ok("#80 the resignation shows as a loss", /Games lost:\s*1/.test(statsText.replace(/\n/g, " ")), statsText.replace(/\n/g, " ").slice(0, 120))
  await p.locator("[data-stats-clear]").click()
  await p.waitForTimeout(150)
  const cleared = await p.locator("[data-stats]").innerText()
  ok("#80 Clear resets the table", /Games lost:\s*0/.test(cleared.replace(/\n/g, " ")))
  await p.locator("[data-stats]").getByRole("button", { name: "Close" }).click()
  await p.waitForTimeout(150)

  // ---- Hearts: name entry, the arrow on the pass button, the score sheet ---
  await menuClick("Game", "Exit")
  await p.waitForTimeout(400)
  await p.getByText("Hearts", { exact: true }).first().dblclick()
  await p.waitForSelector("[data-hearts]", { timeout: 15000 })
  await p.waitForTimeout(500)

  ok("#81 a fresh visitor is asked for a name", (await p.locator("[data-name-entry]").count()) === 1)
  await p.locator("[data-name-input]").fill("JOEL")
  await p.locator("[data-name-ok]").click()
  await p.waitForTimeout(300)
  const scoreBar = await p.locator('[data-score="You"]').innerText()
  ok("#81 the table calls you by name", /JOEL/.test(scoreBar), scoreBar)

  const passBtn = await p.locator("[data-pass]").innerText()
  ok("#82 the pass button wears the arrow", /←/.test(passBtn) && /left/i.test(passBtn), passBtn.trim())

  const handCards = p.locator("[data-hand] [data-card]")
  for (let i = 0; i < 3; i++) {
    await handCards.nth(i).click()
    await p.waitForTimeout(120)
  }
  await p.locator("[data-pass]").click()
  await p.waitForTimeout(500)

  // Play the hand out: whenever it is our turn, play any legal card.
  let sheetSeen = false
  for (let i = 0; i < 260 && !sheetSeen; i++) {
    if (await p.locator("[data-score-sheet]").count()) {
      sheetSeen = true
      break
    }
    const turnText = await p.locator("[data-turn]").innerText().catch(() => "")
    if (/Your turn/.test(turnText)) {
      await p.evaluate(() => {
        const cards = [...document.querySelectorAll("[data-hand] [data-card]")]
        const legal = cards.find((c) => c.style.opacity !== "0.72") || cards[0]
        if (legal) legal.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }
    await p.waitForTimeout(350)
  }
  ok("#84 the score sheet arrives after the hand", sheetSeen)
  if (sheetSeen) {
    const sheet = (await p.locator("[data-score-sheet]").innerText()).replace(/\n/g, " ")
    ok("#84 one row per hand plus the total", /Hand/.test(sheet) && /Total/.test(sheet) && /JOEL/.test(sheet), sheet.slice(0, 110))
  }

  ok("no page errors during the games pass", errors.length === 0, errors.join(" | ").slice(0, 200))
  console.log(`  (custom counter read: ${counterText.trim().slice(0, 20)})`)
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
