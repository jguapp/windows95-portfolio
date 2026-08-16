/**
 * Plays ADVENTURE.EXE from the DOS prompt to the win line (issue #100).
 *
 * The walkthrough exercises all four locks, first refused and then passed:
 * the dark basement, the keycard stairwell, the brass manager's office and
 * the coded server room. It ends by shipping the gold master, checks the
 * prompt returns to DOS, and starts a second fresh game.
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
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "msdos" } })))
  await p.waitForTimeout(800)

  const box = p.locator("#window-msdos")
  const input = box.locator("input")
  const type = async (cmd) => {
    await input.fill(cmd)
    await input.press("Enter")
    await p.waitForTimeout(90)
  }
  const text = () => box.innerText()

  await type("ADVENTURE")
  ok("the game opens in the lobby", /MICROSERF SYSTEMS/.test(await text()))

  // Locks refuse before their keys.
  await type("D")
  ok("the basement is dark without a light", /Pitch black/.test(await text()))
  await type("U")
  ok("the stairwell wants a keycard", /card reader/.test(await text()))

  // Closet: light and grounds.
  await type("W")
  await type("TAKE FLASHLIGHT")
  await type("TAKE TIN")
  await type("E")

  // Printer hides a quarter; meeting room has the mug.
  await type("N")
  await type("W")
  ok("the manager's door is brass-locked", /brass keyhole/.test(await text()))
  await type("E")
  await type("X PRINTER")
  await type("TAKE QUARTER")
  await type("W")
  await type("N")
  await type("TAKE MUG")
  await type("S")
  await type("S")

  // Break room: brew, and spend the quarter for the fun of it.
  await type("E")
  await type("BREW")
  ok("the pot brews with tin and mug", /refactor a man/.test(await text()))
  await type("USE QUARTER ON VENDING")
  await type("TAKE PRETZELS")
  await type("W")

  // Coffee wakes Dave; Dave surrenders the keycard.
  await type("N")
  await type("GIVE COFFEE TO PROGRAMMER")
  ok("Dave hands over the keycard", /KEYCARD/.test(await text()))

  // Basement by flashlight: the brass key.
  await type("S")
  await type("D")
  ok("the flashlight opens the basement", /furnace breathes/i.test(await text()))
  await type("TAKE KEY")
  await type("U")

  // Manager's office: the source in the desk.
  await type("N")
  await type("W")
  ok("the brass key turns", /waited years/.test(await text()))
  await type("X DESK")
  await type("TAKE SOURCE")
  await type("E")
  await type("S")

  // Upstairs: the register teaches the code, the build machine sings.
  await type("U")
  await type("N")
  ok("the keypad refuses without the code", /keypad/i.test(await text()))
  await type("E")
  await type("X REGISTER")
  ok("the register shows 0x1995", /0x1995/.test(await text()))
  await type("W")
  await type("N")
  ok("1995 opens the server room", /agrees/.test(await text()))
  await type("USE SOURCE ON BUILD")
  ok("the build yields the gold master", /THE GOLD MASTER/.test(await text()))

  // Down and ship it.
  await type("S")
  await type("D")
  await type("D")
  await type("E")
  await type("USE GOLD ON DUPLICATOR")
  ok("the game is won", /You have shipped WINDOWS 95/.test(await text()))
  ok("the win counts its moves", /in \d+ moves/.test(await text()))

  // The prompt is DOS again, and a new game starts fresh.
  await type("VER")
  ok("QUIT-by-victory returns the prompt to DOS", /Version 4\.00\.950/.test(await text()))
  await type("ADVENTURE")
  await type("I")
  ok("a new game starts with empty pockets", /nothing but responsibility/.test(await text()))
  await type("QUIT")
  ok("QUIT hands the prompt back", /Somebody else will ship it/.test(await text()))

  ok("no page errors during the adventure", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
