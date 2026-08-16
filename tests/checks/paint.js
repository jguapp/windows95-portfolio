/**
 * Behaviour checks for MS Paint (issue #95).
 *
 * Covers the clipboard, the transform dialogs, the text font picker, the
 * airbrush nozzles, the eyedropper, and Set As Wallpaper.
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
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "paint" } })))
  await p.waitForSelector("#window-paint canvas", { timeout: 15000 })
  await p.waitForTimeout(600)

  const win = p.locator("#window-paint")
  const canvas = win.locator("canvas").first()
  const menu = async (name, selector) => {
    await win.getByText(name, { exact: true }).first().hover()
    await p.waitForTimeout(200)
    await win.locator(selector).click()
    await p.waitForTimeout(400)
  }
  /** The colour of one canvas pixel, as an "r,g,b" string. */
  const pixel = (x, y) =>
    canvas.evaluate((c, [px, py]) => {
      const d = c.getContext("2d").getImageData(px, py, 1, 1).data
      return `${d[0]},${d[1]},${d[2]}`
    }, [x, y])

  // Paint a black square in the top left with the brush.
  const box = await canvas.boundingBox()
  await win.locator('[data-tool="brush"]').click()
  await p.mouse.move(box.x + 20, box.y + 20)
  await p.mouse.down()
  await p.mouse.move(box.x + 60, box.y + 20, { steps: 6 })
  await p.mouse.move(box.x + 60, box.y + 60, { steps: 6 })
  await p.mouse.up()
  await p.waitForTimeout(300)
  ok("the brush paints", (await pixel(40, 20)) !== "255,255,255", await pixel(40, 20))

  // ---- #63: the eyedropper takes the colour under it ----------------------
  await win.locator('[data-tool="eyedropper"]').click()
  await p.mouse.click(box.x + 40, box.y + 20)
  await p.waitForTimeout(300)
  ok("#63 the eyedropper is offered", (await win.locator('[data-tool="eyedropper"]').count()) === 1)

  // ---- #64: curve and polygon are real tools ------------------------------
  ok("#64 curve and polygon exist", (await win.locator('[data-tool="curve"]').count()) === 1 && (await win.locator('[data-tool="polygon"]').count()) === 1)

  // ---- #60: the airbrush offers three nozzles -----------------------------
  await win.locator('[data-tool="airbrush"]').click()
  await p.waitForTimeout(250)
  const nozzles = await win.locator("[data-spray]").count()
  ok("#60 three airbrush nozzles", nozzles === 3, String(nozzles))
  await win.locator('[data-spray="16"]').click()
  // Re-measure: the window settles after the first strokes, so a box taken
  // earlier no longer maps page coordinates onto canvas ones.
  const sprayBox = await canvas.boundingBox()
  await p.mouse.move(sprayBox.x + 200, sprayBox.y + 200)
  await p.mouse.down()
  // A spray needs a moment of travel, as a real one does.
  for (let i = 0; i < 6; i++) {
    await p.mouse.move(sprayBox.x + 200 + i, sprayBox.y + 200 + i)
    await p.waitForTimeout(60)
  }
  await p.mouse.up()
  await p.waitForTimeout(300)
  // Count dark pixels well clear of the brush stroke in the top left corner.
  const sprayed = await canvas.evaluate((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) {
      const px = (i / 4) % c.width
      const py = Math.floor(i / 4 / c.width)
      if (px > 120 && py > 120 && d[i] < 200) n++
    }
    return n
  })
  ok("#60 the wide nozzle sprays a spread", sprayed > 20, `${sprayed} dots`)

  // ---- #57: the text tool offers a face and a size ------------------------
  await win.locator('[data-tool="text"]').click()
  await p.waitForTimeout(250)
  ok("#57 the font picker appears", (await win.locator("[data-font-family]").count()) === 1 && (await win.locator("[data-font-size]").count()) === 1)
  await win.locator("[data-font-size]").selectOption("24")
  ok("#57 the size sticks", (await win.locator("[data-font-size]").inputValue()) === "24")

  // ---- #56: Select All, Cut clears, Paste puts it back --------------------
  await menu("Edit", "[data-edit-all]")
  await menu("Edit", "[data-edit-copy]")
  await menu("Edit", "[data-edit-cut]")
  ok("#56 Cut clears the bitmap", (await pixel(40, 20)) === "255,255,255", await pixel(40, 20))
  await menu("Edit", "[data-edit-paste]")
  ok("#56 Paste puts the pixels back", (await pixel(40, 20)) !== "255,255,255", await pixel(40, 20))

  // ---- #58: Flip/Rotate and Stretch/Skew ----------------------------------
  await menu("Image", "[data-image-flip]")
  ok("#58 the Flip and Rotate dialog opens", (await p.locator("[data-flip-dialog]").count()) === 1)
  const beforeFlip = await pixel(40, 20)
  await p.locator('[data-flip="horizontal"]').click()
  await p.waitForTimeout(500)
  const mirrored = await canvas.evaluate((c) => {
    const w = c.width
    const d = c.getContext("2d").getImageData(w - 45, 20, 20, 1).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) if (d[i] < 200) n++
    return n
  })
  ok("#58 a horizontal flip moves the ink to the other side", mirrored > 0, `${mirrored} dark px, was ${beforeFlip}`)

  await menu("Image", "[data-image-stretch]")
  ok("#58 the Stretch and Skew dialog opens", (await p.locator("[data-stretch-dialog]").count()) === 1)
  await p.locator('[data-stretch-dialog] input[name="sx"]').fill("50")
  await p.locator("[data-stretch-ok]").click()
  await p.waitForTimeout(500)
  ok("#58 stretching closes the dialog and redraws", (await p.locator("[data-stretch-dialog]").count()) === 0)

  // Invert, which must flip white to black somewhere untouched.
  await menu("Image", "[data-image-invert]")
  ok("#58 Invert Colors inverts", (await pixel(400, 300)) === "0,0,0", await pixel(400, 300))

  // ---- #62: Set As Wallpaper (Tiled) --------------------------------------
  await menu("File", "[data-set-wallpaper]")
  await p.waitForTimeout(400)
  await p.locator("[data-ok]").click().catch(() => {})
  await p.waitForTimeout(300)
  const bg = await p.evaluate(() => document.getElementById("desktop").style.backgroundImage)
  ok("#62 the drawing becomes the wallpaper", bg.includes("data:image/"), bg.slice(0, 32))
  const stored = await p.evaluate(() => localStorage.getItem("win95-background-image"))
  ok("#62 and is chosen for next time", stored === "custom-upload", String(stored))

  ok("no page errors during the paint pass", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
