/**
 * Behaviour checks for the apps-and-eggs pass (issue #97).
 *
 * CD Player, Phone Dialer, ScanDisk, Defrag, the IE Favorites menu and
 * History sidebar, the mail Spam folder and auto-reply, and VIRUS.EXE.
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

  const openApp = async (id, selector) => {
    await p.evaluate((appId) => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: appId } })), id)
    await p.waitForSelector(selector, { timeout: 15000 })
    await p.waitForTimeout(300)
  }
  const closeAll = () =>
    p.evaluate(() => {
      for (const el of document.querySelectorAll("[id^='window-']")) {
        const id = el.id.replace(/^window-/, "")
        window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id } }))
      }
    })

  // ---- #103: CD Player ----------------------------------------------------
  await openApp("cdplayer", "[data-cdplayer]")
  const rows = await p.locator("[data-cd-row]").count()
  ok("#103 the disc holds fifteen tracks", rows === 15, String(rows))
  await p.locator('[data-cd-row="4"]').click()
  await p.waitForTimeout(200)
  ok("#103 picking a track moves the display", (await p.locator("[data-cd-track]").innerText()) === "[04]")
  await p.locator("[data-cd-play]").click()
  await p.waitForTimeout(1600)
  const time = await p.locator("[data-cd-time]").innerText()
  ok("#103 the transport counts seconds", time !== "00:00", time)
  await p.locator("[data-cd-stop]").click()
  await closeAll()

  // ---- #163: Phone Dialer -------------------------------------------------
  await openApp("phonedialer", "[data-dialer]")
  await p.locator('[data-key="5"]').click()
  await p.locator('[data-key="0"]').click()
  ok("#163 the keypad types", (await p.locator("[data-dialer-number]").inputValue()) === "50")
  await p.locator("[data-speed-dial]").click()
  await p.waitForTimeout(200)
  ok("#163 the speed dial fills the number", (await p.locator("[data-dialer-number]").inputValue()).includes("212"))
  await p.locator("[data-dial]").click()
  await p.waitForTimeout(1200)
  ok("#163 dialling reports progress", /Dialling|Ringing/.test(await p.locator("[data-dialer-status]").innerText()))
  await closeAll()

  // ---- #165: ScanDisk finds its one lost cluster --------------------------
  await openApp("scandisk", "[data-scandisk]")
  await p.locator("[data-scandisk-start]").click()
  await p.waitForTimeout(2600)
  const scanLine = await p.locator("[data-scandisk-line]").innerText()
  ok("#165 ScanDisk finds one lost cluster", /1 lost cluster/.test(scanLine), scanLine.slice(0, 60))
  await p.locator("[data-scandisk-fix]").click()
  await p.waitForTimeout(300)
  ok("#165 converting it writes a CHK file", /FILE0000\.CHK/.test(await p.locator("[data-scandisk-line]").innerText()))
  await closeAll()

  // ---- #166: Defrag moves real blocks ------------------------------------
  await openApp("defrag", "[data-defrag]")
  const blocks = await p.locator("[data-defrag-map] > div").count()
  ok("#166 the map is drawn", blocks === 312, String(blocks))
  const usedBefore = await p.locator('[data-block="used"]').count()
  await p.locator("[data-defrag-start]").click()
  await p.waitForTimeout(2500)
  const moved = await p.locator('[data-block="moved"]').count()
  ok("#166 blocks compact toward the front", moved > 0, `${moved} moved of ${usedBefore} used`)
  await closeAll()

  // ---- #105 and #106: IE Favorites and History ----------------------------
  await openApp("internet-explorer", "[data-ie]")
  await p.locator("[data-ie-favorites]").click()
  await p.waitForTimeout(250)
  const favs = await p.locator("[data-favorite]").count()
  ok("#105 the Favorites menu lists its links", favs === 5, String(favs))
  await p.locator('[data-favorite="http://www.joel95.net/"]').click()
  await p.waitForTimeout(900)
  ok("#105 picking one navigates", /joel95/.test(await p.locator("[data-ie] input").inputValue()))
  await p.locator("[data-ie-history]").click()
  await p.waitForTimeout(300)
  const entries = await p.locator("[data-history-entry]").count()
  ok("#106 History lists where you have been", entries > 0, `${entries} entries`)
  await closeAll()

  // ---- #116 and #115: the Spam folder and the auto-reply ------------------
  await openApp("contact", "[data-mail], #window-contact")
  const mail = p.locator("#window-contact")
  await mail.getByText("Spam", { exact: true }).first().click()
  await p.waitForTimeout(400)
  const spamText = await mail.innerText()
  ok("#116 the Spam folder holds the junk", /MAKE MONEY FAST/.test(spamText), (spamText.match(/MAKE[^\n]*/) || [""])[0])
  ok("#116 including the chain letter", /DO NOT DELETE THIS/.test(spamText))

  // ---- #132: VIRUS.EXE rattles the assistant ------------------------------
  await closeAll()
  await openApp("msdos", "#window-msdos input")
  const dos = p.locator("#window-msdos input")
  await dos.fill("VIRUS")
  await dos.press("Enter")
  await p.waitForTimeout(700)
  const dosText = await p.locator("#window-msdos").innerText()
  ok("#132 VIRUS.EXE runs its bluff", /Definitely Not A Virus/.test(dosText) && /Nothing happened/.test(dosText))
  const clippy = p.locator("[data-clippy]")
  ok("#132 it summons the assistant", (await clippy.count()) === 1)
  const shaking = await clippy.evaluate((el) => el.className.includes("anim-clippy-panic"))
  ok("#132 who is visibly rattled", shaking)
  const tip = await p.locator("[data-clippy-tip]").innerText().catch(() => "")
  ok("#132 and says so", /virus/i.test(tip), tip.slice(0, 60))

  ok("no page errors during the apps pass", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
