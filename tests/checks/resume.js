/**
 * The resume's toolbar, and Winamp's playlist lengths.
 *
 * The font controls are the point here. globals.css carries
 * `* { font-family: ... !important }`, which outranks an ordinary inline
 * style, so the picker set a face the page then ignored and the buttons
 * looked broken while behaving exactly as written. These assert the
 * document really changes, which is the only way that stays fixed.
 */
const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))

  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "resume" } })))
  await p.waitForSelector("#window-resume [data-page]", { timeout: 20000 })
  await p.waitForTimeout(1200)

  const win = p.locator("#window-resume")
  const styleOf = () =>
    p.evaluate(() => {
      const el = document.querySelector('#window-resume [contenteditable="true"]')
      const cs = getComputedStyle(el)
      return { family: cs.fontFamily.split(",")[0].replace(/"/g, ""), size: cs.fontSize }
    })

  /*
    The window moves by its own title bar. window.tsx draws no header for
    the resume, because Word's bar is part of Word, so that bar has to be
    the drag handle: without it the window could not be moved at all.
  */
  const box = await win.boundingBox()
  await p.mouse.move(box.x + 150, box.y + 10)
  await p.mouse.down()
  await p.mouse.move(box.x + 260, box.y + 95, { steps: 12 })
  await p.mouse.up()
  await p.waitForTimeout(400)
  const moved = await win.boundingBox()
  ok(
    "the window drags by Word's own title bar",
    Math.abs(moved.x - box.x) > 80 && Math.abs(moved.y - box.y) > 60,
    `dx ${Math.round(moved.x - box.x)}, dy ${Math.round(moved.y - box.y)}`,
  )

  const before = await styleOf()
  ok("it opens in the desktop's own face", before.family === "MS Sans Serif", before.family)

  // ---- The font picker actually changes the document ----------------------
  const selects = win.locator("select")
  await selects.nth(1).selectOption("Georgia")
  await p.waitForTimeout(500)
  const afterFont = await styleOf()
  ok("the font picker changes the document", afterFont.family === "Georgia", `${before.family} -> ${afterFont.family}`)

  // And the whole of it, not the parts that happened to carry inline styles.
  const families = await p.evaluate(() => {
    const page = document.querySelector("#window-resume [data-page]")
    const els = [page, ...page.querySelectorAll("h1,h2,h3,p,li,span,td")].slice(0, 60)
    return [...new Set(els.map((e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, "")))]
  })
  ok("every element in the document follows it", families.length === 1 && families[0] === "Georgia", families.join(", "))

  await selects.nth(2).selectOption("18")
  await p.waitForTimeout(500)
  const afterSize = await styleOf()
  ok("the size picker changes the document", afterSize.size === "18px", `${before.size} -> ${afterSize.size}`)

  await selects.nth(2).selectOption("10")
  await p.waitForTimeout(500)
  ok("and it goes back down again", (await styleOf()).size === "10px")

  // The blanket rule must not be winning any more.
  const important = await p.evaluate(() => {
    const el = document.querySelector('#window-resume [contenteditable="true"]')
    return el.style.getPropertyPriority("font-family")
  })
  ok("the document's font outranks the blanket rule", important === "important", important || "(not important)")

  // ---- No toolbar button is a placeholder any more ------------------------
  const placeholders = await win.evaluate((el) => el.innerHTML.includes("This would"))
  ok("no 'this would' placeholders remain", placeholders === false)

  // Columns cycles the page.
  const columnsBtn = win.locator('[title="Columns"]')
  if (await columnsBtn.count()) {
    await columnsBtn.first().click()
    await p.waitForTimeout(300)
    const cols = await p.evaluate(() => document.querySelector("#window-resume [data-page]").style.columnCount)
    ok("Columns splits the page", cols === "2", `column-count ${cols || "unset"}`)
    await columnsBtn.first().click()
    await columnsBtn.first().click()
    await p.waitForTimeout(300)
    const back = await p.evaluate(() => document.querySelector("#window-resume [data-page]").style.columnCount)
    ok("and cycles back to one", !back, `column-count ${back || "unset"}`)
  }

  // The pilcrow toggle.
  const marksBtn = win.locator('[title="Control Codes"]').first()
  if (await marksBtn.count()) {
    await marksBtn.click()
    await p.waitForTimeout(300)
    const on = await p.evaluate(() => document.querySelector("#window-resume [data-page]").hasAttribute("data-marks"))
    ok("paragraph marks toggle on", on)
    await marksBtn.click()
    await p.waitForTimeout(200)
    const off = await p.evaluate(() => document.querySelector("#window-resume [data-page]").hasAttribute("data-marks"))
    ok("and off again", !off)
  }

  // ---- Winamp lists real lengths -----------------------------------------
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "winamp" } })))
  await p.waitForTimeout(6000)
  const playlist = await p.evaluate(() => document.body.innerText)
  const oneSecond = (playlist.match(/0:01/g) || []).length
  ok("no track is left at the 0:01 placeholder", oneSecond === 0, `${oneSecond} tracks read 0:01`)
  ok("real lengths are listed", /3:17|4:32|6:26/.test(playlist), (playlist.match(/\d+:\d\d/g) || []).slice(0, 6).join(" "))

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 160))
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
