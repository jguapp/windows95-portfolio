const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)
;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } })
  const p = await ctx.newPage()
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))

  const boot = async () => {
    await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
    await p.waitForSelector("#win95-popup", { timeout: 90000 })
    await p.getByLabel("Close").first().click()
    await p.waitForTimeout(500)
  }

  await boot()
  await p.evaluate(() => {
    localStorage.clear()
    // Persistence is opt-in; this check is about what happens once it is on.
    localStorage.setItem("win95:persist", "1")
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(500)

  // ---- Notepad: Save As a new file ----------------------------------------
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "notepad" } })))
  await p.waitForSelector("#window-notepad", { timeout: 15000 })
  await p.locator("#window-notepad textarea").fill("persistence test body zqx")
  await p.locator("#window-notepad").getByText("File", { exact: true }).click()
  await p.getByText("Save As...", { exact: true }).click()
  await p.waitForTimeout(300)
  const nameBox = p.locator('#window-notepad input').first()
  await nameBox.fill("Persist Test.txt")
  await p.locator("#window-notepad").getByText("Save", { exact: true }).last().click()
  await p.waitForTimeout(400)

  // ---- Paint: Save to Desktop ---------------------------------------------
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "paint" } })))
  await p.waitForSelector("#window-paint", { timeout: 15000 })
  await p.waitForTimeout(400)
  const canvas = p.locator("#window-paint canvas").first()
  const box = await canvas.boundingBox()
  await p.mouse.move(box.x + 40, box.y + 40)
  await p.mouse.down()
  await p.mouse.move(box.x + 160, box.y + 120, { steps: 8 })
  await p.mouse.up()
  await p.locator("#window-paint").getByText("File", { exact: true }).click()
  await p.locator("[data-save-desktop]").click()
  await p.waitForTimeout(400)
  // Dismiss the confirmation message box.
  const okBtn = p.getByRole("button", { name: "OK" }).first()
  if (await okBtn.count()) await okBtn.click().catch(() => {})
  await p.waitForTimeout(300)
  ok("drawing appears on the desktop", (await p.getByText("Untitled", { exact: true }).count()) >= 1)

  // Record where the drawing icon sits, then move it and remember that too.
  const drawIcon = p.getByText("Untitled", { exact: true }).first()
  const before = await drawIcon.boundingBox()

  // ---- Reload: everything should come back --------------------------------
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(600)

  const iconAfter = p.getByText("Untitled", { exact: true }).first()
  ok("drawing icon survives a reload", (await iconAfter.count()) >= 1)
  const after = await iconAfter.boundingBox().catch(() => null)
  ok(
    "at the same position",
    !!after && Math.abs(after.x - before.x) < 4 && Math.abs(after.y - before.y) < 4,
    after ? `${Math.round(before.x)},${Math.round(before.y)} -> ${Math.round(after.x)},${Math.round(after.y)}` : "gone",
  )

  // The saved Notepad file is still on the drive: Find sees it.
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "find-files" } })))
  await p.waitForSelector("[data-find]", { timeout: 15000 })
  await p.locator("[data-find-named]").fill("persist test")
  await p.locator("[data-find-now]").click()
  await p.waitForTimeout(400)
  const hits = await p.locator("[data-find-hit]").count()
  ok("saved Notepad file survives the reload", hits === 1, `${hits} hit(s)`)

  // Its body survived too.
  await p.locator("[data-find-text]").fill("zqx")
  await p.locator("[data-find-now]").click()
  await p.waitForTimeout(400)
  ok("with its contents intact", (await p.locator("[data-find-hit]").count()) === 1)

  // Default icons still reset to the grid: My Computer sits at the first slot.
  const mc = await p.getByText("About Me", { exact: true }).first().boundingBox()
  ok("default icons still occupy the grid", !!mc && mc.x < 120 && mc.y < 120, mc ? `${Math.round(mc.x)},${Math.round(mc.y)}` : "")

  // ---- Deleting the drawing persists too ----------------------------------
  await p.locator("#window-find-files").getByLabel("Close").click().catch(() => {})
  await p.locator('[data-id="drawing-1"]').click({ button: "right" })
  await p.waitForTimeout(300)
  const del = p.getByText("Delete", { exact: true }).first()
  if (await del.count()) {
    await del.click()
    await p.waitForTimeout(400)
    const okBtn2 = p.getByRole("button", { name: /Yes|OK/ }).first()
    if (await okBtn2.count()) await okBtn2.click().catch(() => {})
    await p.waitForTimeout(300)
    await p.reload({ waitUntil: "domcontentloaded" })
    await p.waitForSelector("#win95-popup", { timeout: 90000 })
    await p.getByLabel("Close").first().click()
    await p.waitForTimeout(600)
    ok("deleting it persists as well", (await p.getByText("Untitled", { exact: true }).count()) === 0)
  } else {
    ok("deleting it persists as well", false, "no Delete menu item found")
  }

  ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.error("SCRIPT ERROR", e.message)
  process.exit(1)
})
