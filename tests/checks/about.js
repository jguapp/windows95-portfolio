const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } })
  const missing = []
  page.on("response", (r) => { if (r.status() >= 400 && /\.(png|jpe?g)$/.test(r.url())) missing.push(r.url()) })

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await page.waitForSelector("#win95-popup", { timeout: 90000 })
  await page.getByLabel("Close").first().click()
  await page.waitForTimeout(600)
  await page.locator('[data-id="about-me"]').dblclick()
  await page.waitForTimeout(2000)
  await page.locator("#window-about-me").getByLabel("Maximize").click().catch(() => {})
  await page.waitForTimeout(1200)

  const w = page.locator("#window-about-me")
  const text = await w.innerText()

  ok("graduating 2027", /Baruch College '27/.test(text) && !/'26/.test(text))
  ok("last updated August 16", /August 16, 2026/.test(text), (text.match(/Last Update:\s*\n?(.*)/) || [])[1] || "")
  ok("looking for new grad roles", /New Grad Opportunities/.test(text) && !/Internship Opportunities/.test(text))
  ok("the about text is current", /Liberty Mutual/.test(text) && /2027/.test(text))

  // Labels line up, including the personal info group.
  const rows = await w.evaluate((el) =>
    [...el.querySelectorAll("tr")].map((tr) => {
      const c = tr.children
      if (c.length !== 2) return null
      return { label: c[0].textContent.trim().slice(0, 18), valueLeft: Math.round(c[1].getBoundingClientRect().left) }
    }).filter(Boolean),
  )
  const lefts = [...new Set(rows.map((r) => r.valueLeft))]
  ok("every value shares one left edge", lefts.length === 1, `${lefts.join(", ")} from ${rows.length} rows`)

  // The headshot, the new ad and the upscaled header.
  const shots = await w.evaluate((el) =>
    [...el.querySelectorAll("img")].map((i) => ({
      src: i.getAttribute("src").split("/").pop(),
      natural: `${i.naturalWidth}x${i.naturalHeight}`,
      drawn: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`,
    })),
  )
  const head = shots.find((s) => s.src.includes("headshot"))
  ok("the profile uses the cropped headshot", !!head, head ? `${head.natural} shown at ${head.drawn}` : "not found")

  const ad = shots.find((s) => s.src.includes("skyscraper"))
  ok("the advert is the new one", !!ad, ad ? `${ad.natural} shown at ${ad.drawn}` : "not found")
  if (ad) {
    const [dw, dh] = ad.drawn.split("x").map(Number)
    const panel = await w.locator("img[src*='skyscraper']").evaluate((i) => {
      const p = i.parentElement.getBoundingClientRect()
      return { w: Math.round(p.width), h: Math.round(p.height) }
    })
    ok("it fills its panel", dw >= panel.w - 2 && dh >= panel.h - 2, `ad ${dw}x${dh} in panel ${panel.w}x${panel.h}`)
  }

  const header = shots.find((s) => s.src.includes("thefacebook-header"))
  ok("the cover art is upscaled", header && header.natural === "2400x240", header ? header.natural : "not found")

  // The nav box is sized from the displayed bitmap width, so its right
  // offset as a fraction of that width must hold at every window size.
  const offsetAt = async () => {
    const nav = await w.locator("a", { hasText: "logout" }).first().boundingBox()
    const headerBox = await w.locator("img[src*='thefacebook-header']").boundingBox()
    const bitmapW = Math.max(headerBox.width, 1300)
    return Math.round(((headerBox.x + headerBox.width - (nav.x + nav.width)) / bitmapW) * 1000)
  }
  const toggleSize = async () => {
    const restore = w.getByLabel("Restore")
    if (await restore.count()) await restore.click()
    else await w.getByLabel("Maximize").click()
    await page.waitForTimeout(600)
  }
  const firstOffset = await offsetAt()
  await toggleSize()
  const secondOffset = await offsetAt()
  await toggleSize()
  ok("the nav tracks the wordmark at both sizes", Math.abs(firstOffset - secondOffset) <= 6, `${firstOffset} vs ${secondOffset} per-mille`)

  // The wordmark and the nav row must not touch.
  const headerGap = await w.evaluate((el) => {
    const img = el.querySelector('img[src*="thefacebook-header"]')
    const nav = [...el.querySelectorAll("a")].find((a) => a.textContent.trim() === "logout")
    if (!img || !nav) return -1
    return Math.round(nav.getBoundingClientRect().top - img.getBoundingClientRect().bottom)
  })
  ok("the wordmark clears the nav row", headerGap >= 2, `${headerGap}px`)

  ok("no missing artwork", missing.length === 0, missing.join(",") || "none")
  await browser.close()
})()
