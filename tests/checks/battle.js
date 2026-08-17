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
  await p.waitForTimeout(500)

  for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) {
    await p.keyboard.press(k)
    await p.waitForTimeout(60)
  }
  await p.waitForSelector("[data-gameboy]", { timeout: 15000 })

  // Balls are an intro-only sight: catch them before the menu arrives.
  let ballsDuringIntro = 0
  for (let i = 0; i < 20 && ballsDuringIntro === 0; i++) {
    ballsDuringIntro = await p.locator("[data-gameboy] [data-ball]").count()
    if (!ballsDuringIntro) await p.waitForTimeout(100)
  }
  ok("balls show during the opening", ballsDuringIntro === 12, `${ballsDuringIntro}`)
  const introText = await p.evaluate(() => [...document.querySelectorAll("[data-gameboy] text")].map((t) => t.textContent).join(" "))
  ok("the rival opens the fight", introText.includes("RIVAL"), introText.slice(0, 60))

  const onMenu = () =>
    p.evaluate(() => [...document.querySelectorAll("[data-gameboy] text")].some((t) => t.textContent.includes("What will")))
  const waitMenu = async (ms = 12000) => {
    for (let i = 0; i < ms / 200; i++) {
      if (await onMenu()) return true
      await p.waitForTimeout(200)
    }
    return false
  }

  ok("the opening clears to the menu", await waitMenu())
  await p.evaluate(() => document.fonts.ready)
  const ballsAfter = await p.locator("[data-gameboy] [data-ball]").count()
  ok("and the balls leave when the fight is on", ballsAfter === 0, `${ballsAfter}`)

  const measure = (label) =>
    p.evaluate(() => {
      const out = []
      document.querySelectorAll("[data-gameboy] text").forEach((t) => {
        const bb = t.getBBox()
        out.push({ text: t.textContent.trim(), right: bb.x + bb.width, bottom: bb.y + bb.height })
      })
      return out
    }).then((nodes) => {
      const clipped = nodes.filter((n) => n.right > 160.5 || n.bottom > 144.5)
      ok(`${label}: all text inside the frame`, clipped.length === 0,
        clipped.map((c) => `"${c.text}" r=${c.right.toFixed(1)} b=${c.bottom.toFixed(1)}`).join("; ").slice(0, 160))
      return nodes
    })

  const menuNodes = await measure("menu phase")
  ok("levels sit under the names", menuNodes.some((n) => /^:L\d+$/.test(n.text)), menuNodes.map((n) => n.text).slice(0, 6).join(","))

  // The back sprite: the player group's cells differ from the foe's front.
  const backCells = await p.evaluate(() => {
    const groups = [...document.querySelectorAll("[data-gameboy] g[transform*='scale(1)']")]
    const of = (frag) => groups.find((g) => (g.getAttribute("transform") || "").includes(frag))
    const back = of("translate(10 46)")
    const front = of("translate(96 6)")
    return back && front ? { back: back.childElementCount, front: front.childElementCount } : "missing"
  })
  ok("the player sprite is a distinct back view", typeof backCells === "object" && backCells.back > 20 && backCells.back !== backCells.front, JSON.stringify(backCells))

  // The fight list clears the border.
  await p.keyboard.press("Enter")
  await p.waitForTimeout(300)
  const fightTop = await p.evaluate(() => {
    const first = [...document.querySelectorAll("[data-gameboy] text")].find((t) => t.getAttribute("y") === "112")
    return first ? first.getBBox().y : -1
  })
  ok("first move clears the box border", fightTop > 106, `glyph top ${fightTop.toFixed(1)}`)
  const fightText = await p.evaluate(() => [...document.querySelectorAll("[data-gameboy] text")].map((t) => t.textContent).join("|"))
  ok("the panel shows the move's type", fightText.includes("TYPE/"), fightText.slice(-60))
  await measure("fight phase")

  // One exchange so the player takes damage, then wait for the menu.
  await p.keyboard.press("Enter")
  await p.waitForTimeout(500)
  await measure("message exchange")
  ok("the exchange returns to the menu", await waitMenu())

  // ---- The party screen ----------------------------------------------------
  /*
    The exchange before this runs on a random move, so it lasts a different
    number of milliseconds every time, and a keypress that lands while the
    animation is still playing is ignored on purpose. Waiting on the screen
    itself, and pressing again if it has not arrived, tests the behaviour
    rather than the timing.
  */
  const openParty = async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await p.keyboard.press("ArrowDown")
      await p.waitForTimeout(80)
      await p.keyboard.press("Enter")
      try {
        await p.waitForSelector("[data-party]", { timeout: 1200 })
        return true
      } catch {
        // Still busy with the last exchange; let it finish and try again.
        await p.waitForTimeout(600)
      }
    }
    return false
  }
  ok("PKMN opens the full party screen", await openParty())
  const partySprites = await p.locator("[data-party] g[transform*='scale(0.275)']").count()
  ok("with a mini sprite per creature", partySprites === 6, `${partySprites}`)
  const party = await measure("party screen")
  ok("six gauges on the list", party.filter((n) => n.text.includes("/")).length >= 6)

  await p.keyboard.press("Enter") // the one already out
  await p.waitForTimeout(300)
  const noteText = await p.evaluate(() =>
    [...document.querySelectorAll("[data-party] text")].map((t) => t.textContent).join(" "),
  )
  ok("choosing the active one is refused in place", noteText.includes("is already out!"), noteText.slice(-60))
  await measure("party refusal note")

  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("Enter")
  await p.waitForTimeout(600)
  ok("switching closes the party screen", (await p.locator("[data-party]").count()) === 0)
  ok("the free foe turn returns to the menu", await waitMenu())

  // ---- Status moves and the type chart ------------------------------------
  // Polls the message box during an exchange and accumulates what it said.
  const watch = async (ms) => {
    const seen = new Set()
    for (let i = 0; i < ms / 150; i++) {
      const t = await p.evaluate(() => [...document.querySelectorAll("[data-gameboy] text")].map((x) => x.textContent).join(" "))
      seen.add(t)
      if (await onMenu()) break
      await p.waitForTimeout(150)
    }
    return [...seen].join(" | ")
  }

  // PIXELPUP's YIP (100 accuracy) lowers the foe's attack, every time.
  await p.keyboard.press("Enter")
  await p.waitForTimeout(250)
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("Enter")
  const yipLog = await watch(9000)
  ok("a status move moves a stage", yipLog.includes("ATTACK fell!"), yipLog.slice(-120))
  ok("status exchange returns to the menu", await waitMenu())

  // SCANLINE is METAL against a CHAOS foe: super effective, bar a 5% miss.
  let sawSuper = false
  for (let round = 0; round < 3 && !sawSuper; round++) {
    await p.keyboard.press("Enter")
    await p.waitForTimeout(250)
    for (let d = 0; d < 3; d++) await p.keyboard.press("ArrowDown")
    await p.keyboard.press("Enter")
    const log = await watch(11000)
    sawSuper = log.includes("super effective")
    await waitMenu()
  }
  ok("the type chart announces itself", sawSuper)

  // ---- The item menu -------------------------------------------------------
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("Enter")
  await p.waitForTimeout(400)
  ok("ITEM opens the bag", (await p.locator("[data-items]").count()) === 1)
  const itemsText = await p.evaluate(() =>
    [...document.querySelectorAll("[data-items] text")].map((t) => t.textContent).join("|"),
  )
  ok("the bag holds the packed items", itemsText.includes("POTION") && itemsText.includes("x3") && itemsText.includes("FULL RESTORE") && itemsText.includes("CANCEL"), itemsText.slice(0, 90))
  await measure("item menu")

  await p.keyboard.press("Enter") // POTION
  await p.waitForTimeout(500)
  const afterUse = await p.evaluate(() => ({
    bagOpen: document.querySelectorAll("[data-items]").length,
    text: [...document.querySelectorAll("[data-gameboy] text")].map((t) => t.textContent).join("|"),
  }))
  const consumed = afterUse.bagOpen === 0 && afterUse.text.includes("used POTION!")
  const refused = afterUse.bagOpen === 1 && afterUse.text.includes("won't have any")
  ok("POTION heals, or is refused at full HP", consumed || refused, afterUse.text.slice(0, 80))

  if (consumed) {
    ok("the item spends the turn", await waitMenu())
    // Reopening the bag has the same problem the party screen had: the turn
    // that just ran lasted an unpredictable time, and a keypress landing
    // during it is ignored by design. Ask until it opens.
    let recount = ""
    for (let attempt = 0; attempt < 6 && !recount; attempt++) {
      await p.keyboard.press("ArrowDown")
      await p.keyboard.press("ArrowDown")
      await p.keyboard.press("Enter")
      try {
        await p.waitForSelector("[data-items]", { timeout: 1200 })
        recount = await p.evaluate(() =>
          [...document.querySelectorAll("[data-items] text")].map((t) => t.textContent).join("|"),
        )
      } catch {
        await p.waitForTimeout(600)
      }
    }
    ok("the bag counts down", recount.includes("x2"), recount.slice(0, 60))
  } else {
    ok("the item spends the turn", true, "skipped: refused at full HP")
    ok("the bag counts down", true, "skipped: refused at full HP")
  }
  // CANCEL exits the bag.
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("ArrowDown")
  await p.keyboard.press("Enter")
  await p.waitForTimeout(300)
  ok("CANCEL leaves the bag", (await p.locator("[data-items]").count()) === 0)

  await p.keyboard.press("Escape")
  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
