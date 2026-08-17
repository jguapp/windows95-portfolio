const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  const area = { current: "boot" }
  p.on("pageerror", (e) => errors.push(`[${area.current}] pageerror: ${e.message.slice(0, 140)}`))
  /*
    Internet Explorer frames the Internet Archive, and a 1996 page pulled
    out of the archive is full of requests that fail: images that no longer
    exist, hosts that no longer answer. None of that is this desktop's code
    misbehaving, so anything raised from inside that frame is left out of a
    sweep whose job is to catch our own mistakes.
  */
  const foreign = (m) => {
    // The URL lives in the message's location; its text is only ever the
    // browser's generic "Failed to load resource" line.
    const url = m.location?.()?.url ?? ""
    return url.includes("web.archive.org") || url.includes("magazine-ad")
  }
  p.on("console", (m) => {
    if (m.type() === "error" && !foreign(m)) {
      errors.push(`[${area.current}] console: ${m.text().slice(0, 140)}`)
    }
  })
  p.on("response", (r) => {
    // An archived page's own failing subresources are the archive's business.
    const inFrame = r.frame() !== p.mainFrame()
    // magazine-ad.png is a drop-in slot; its 404 is the slot, not a fault.
    if (
      r.status() >= 400 &&
      !inFrame &&
      !r.url().includes("web.archive.org") &&
      !r.url().includes("magazine-ad") &&
      !r.url().includes("_next/webpack-hmr")
    )
      errors.push(`[${area.current}] HTTP ${r.status()} ${r.url().slice(-70)}`)
  })

  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(600)

  const windows = [
    "about-me", "resume", "projects", "contact", "gallery", "games", "paint", "calculator",
    "guestbook", "notepad", "msdos", "explorer", "recycle-bin", "find-files", "sound-properties",
    "patch-notes", "internet-explorer", "wordpad", "charmap", "mediaplayer", "soundrec",
    "cdplayer", "phonedialer", "hyperterm", "scandisk", "defrag", "add-remove",
  ]
  for (const id of windows) {
    area.current = id
    await p.evaluate((w) => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: w } })), id)
    await p.waitForTimeout(700)
    await p.evaluate((w) => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: w } })), id)
    await p.waitForTimeout(200)
    // Some windows don't listen for windowAction; close via the button if still open.
    const still = await p.locator(`#window-${id}`).count()
    if (still) {
      await p.locator(`#window-${id}`).getByLabel("Close").click().catch(() => {})
      await p.waitForTimeout(200)
    }
  }

  // Each game.
  area.current = "games-folder"
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "games" } })))
  await p.waitForTimeout(600)
  for (const game of ["Solitaire", "Minesweeper", "FreeCell", "Hearts", "Reversi", "Chess", "Tetris", "Pong"]) {
    area.current = `game-${game}`
    const icon = p.locator("#window-games").getByText(game, { exact: true }).first()
    if (await icon.count()) {
      await icon.dblclick().catch(() => {})
      await p.waitForTimeout(900)
      // Close the game window (it may replace or stack).
      const closes = p.locator(".window").last().getByLabel("Close")
      await closes.click().catch(() => {})
      await p.waitForTimeout(250)
    }
  }
  await p.locator("#window-games").getByLabel("Close").click().catch(() => {})

  // IE with the built-in home page.
  area.current = "ie-joel95"
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "internet-explorer" } })))
  await p.waitForTimeout(600)
  await p.locator("[data-ie-address]").fill("www.joel95.net")
  await p.keyboard.press("Enter")
  await p.waitForTimeout(900)
  await p.locator("#window-internet-explorer").getByLabel("Close").click().catch(() => {})

  // Shell chrome: start menu cascades, tray popups, dialogs.
  area.current = "start-menu"
  await p.locator("#start-button").click()
  await p.waitForTimeout(300)
  await p.getByText("rograms").hover()
  await p.waitForTimeout(300)
  await p.getByText("Accessories").hover()
  await p.waitForTimeout(400)
  await p.keyboard.press("Escape")
  await p.locator("#desktop").click({ position: { x: 700, y: 400 } })

  area.current = "tray"
  await p.locator("#resolution-button").click()
  await p.waitForTimeout(250)
  await p.locator("#desktop").click({ position: { x: 700, y: 400 } })
  await p.locator("#sound-button").click()
  await p.waitForTimeout(250)
  await p.locator("#desktop").click({ position: { x: 700, y: 400 } })
  await p.locator("#clock").click()
  await p.waitForTimeout(500)
  await p.keyboard.press("Escape")
  await p.getByRole("button", { name: /OK|Cancel|Close/ }).first().click().catch(() => {})
  await p.waitForTimeout(300)

  area.current = "display-properties"
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "background" } })))
  await p.waitForTimeout(500)
  for (const tab of ["Appearance", "Settings"]) {
    await p.getByText(tab, { exact: true }).first().click().catch(() => {})
    await p.waitForTimeout(300)
  }
  await p.keyboard.press("Escape")
  await p.waitForTimeout(300)

  area.current = "run-dialog"
  await p.keyboard.press("Control+Alt+r")
  await p.waitForTimeout(400)
  await p.keyboard.press("Escape")

  area.current = "battle"
  for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) {
    await p.keyboard.press(k)
    await p.waitForTimeout(50)
  }
  await p.waitForSelector("[data-gameboy]", { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(2800)
  await p.keyboard.press("Escape")
  await p.waitForTimeout(300)

  // The dialogs that only open from a key or a double click.
  area.current = "f1-help"
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "notepad" } })))
  await p.waitForTimeout(600)
  await p.keyboard.press("F1")
  await p.waitForTimeout(700)
  // The help window is a modal overlay; its own button is what dismisses it.
  await p.getByLabel("Close Help").click().catch(() => {})
  await p.waitForTimeout(300)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "notepad" } })))
  await p.waitForTimeout(300)

  area.current = "documents-menu"
  await p.locator("#start-button").click().catch(() => {})
  await p.waitForTimeout(250)
  await p.locator("#start-menu li", { hasText: "ocuments" }).first().hover().catch(() => {})
  await p.waitForTimeout(700)
  await p.keyboard.press("Escape")
  await p.waitForTimeout(300)

  area.current = "404"
  await p.goto("http://localhost:3000/no-such-thing", { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(800)

  // The 404 page returning status 404 is the contract working, and the
  // browser's own 'Failed to load resource' line for it is unavoidable.
  const real = errors.filter((e) => !e.includes('favicon') && !(e.startsWith('[404]') && e.includes('404')))
  ok("no console errors anywhere on the desk", real.length === 0, "")

  // ---- #152 and #153: the shipping meta ------------------------------------
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(1200)
  const sitemap = await p.evaluate(async () => (await fetch("/sitemap.xml")).text())
  ok("#153 the sitemap serves the site", sitemap.includes("builtbyjoel.dev"))
  const robotsTxt = await p.evaluate(async () => (await fetch("/robots.txt")).text())
  ok("#153 robots.txt points at the sitemap", robotsTxt.includes("sitemap.xml"))
  const meta = await p.evaluate(() => ({
    description: document.querySelector('meta[name="description"]')?.content ?? "",
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
  }))
  ok("#153 description and canonical are declared", meta.description.length > 60 && meta.canonical.includes("builtbyjoel"))
  const pixelFace = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-press-start"))
  ok("#152 the pixel faces are self-hosted", pixelFace.trim().length > 0, pixelFace.trim().slice(0, 30))
  if (real.length) {
    const seen = new Set()
    for (const e of real) {
      const key = e.slice(0, 100)
      if (!seen.has(key)) {
        seen.add(key)
        console.log("   ", e)
      }
    }
  }
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
