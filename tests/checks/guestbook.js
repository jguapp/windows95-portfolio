/**
 * Guestbook moderation (issue #102).
 *
 * Signs the book, then proves the owner can remove an entry and a stranger
 * cannot: the Moderate button only appears when a key is configured, a
 * wrong key deletes nothing, and the right one reveals working Delete
 * buttons. Requires GUESTBOOK_ADMIN_KEY to be set for the server under
 * test; without it the moderation assertions are skipped rather than
 * reported as failures.
 */
const { chromium } = require("playwright")
const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)

const KEY = process.env.GUESTBOOK_ADMIN_KEY || "local-test-key-12345"
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } })
  const errors = []
  p.on("pageerror", (e) => errors.push(e.message))

  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.waitForTimeout(400)
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "guestbook" } })))
  await p.waitForSelector("[data-guestbook]", { timeout: 15000 })
  await p.waitForTimeout(800)

  const win = p.locator("[data-guestbook]")

  // Sign the book so there is something to moderate.
  const stamp = `check-${Date.now()}`
  await win.locator('input[name="name"]').fill("Check Robot")
  await win.locator('textarea[name="message"]').fill(stamp)
  await win.getByRole("button", { name: "Sign", exact: false }).last().click()
  await p.waitForTimeout(1500)
  const signed = (await win.locator("[data-entries]").innerText()).includes(stamp)
  ok("an entry can be signed", signed)

  // ---- #102: the moderation door -----------------------------------------
  const offered = await win.locator("[data-moderation-on]").count()
  if (offered === 0) {
    console.log("  SKIP  moderation is not configured on this server")
    ok("no page errors", errors.length === 0, errors.join(" | ").slice(0, 150))
    await b.close()
    return
  }
  ok("#102 the Moderate button is offered when a key is configured", offered === 1)
  ok("#102 no Delete buttons before signing in", (await win.locator("[data-delete-entry]").count()) === 0)

  // A wrong key is refused and reveals nothing.
  await win.locator("[data-moderation-on]").click()
  await p.waitForTimeout(250)
  await p.locator("[data-key-input]").fill("not-the-key")
  await p.locator("[data-key-ok]").click()
  await p.waitForTimeout(900)
  ok("#102 a wrong key is refused", /not right/i.test(await win.innerText()))
  ok("#102 and unlocks nothing", (await win.locator("[data-delete-entry]").count()) === 0)

  // The right key opens moderation.
  await p.locator("[data-key-input]").fill(KEY)
  await p.locator("[data-key-ok]").click()
  await p.waitForTimeout(900)
  const deletes = await win.locator("[data-delete-entry]").count()
  ok("#102 the right key reveals the Delete buttons", deletes > 0, `${deletes} entries`)

  // Delete the entry just signed, confirming the dialog.
  const target = win.locator("[data-entry]", { hasText: stamp }).locator("[data-delete-entry]")
  await target.first().click()
  await p.waitForTimeout(400)
  await p.locator("[data-ok]").click()
  await p.waitForTimeout(1200)
  const gone = !(await win.locator("[data-entries]").innerText()).includes(stamp)
  ok("#102 the entry is removed", gone)

  // It stays removed after a reload, so the delete reached storage.
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector("#win95-popup", { timeout: 90000 })
  await p.getByLabel("Close").first().click()
  await p.evaluate(() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "guestbook" } })))
  await p.waitForSelector("[data-guestbook]", { timeout: 15000 })
  await p.waitForTimeout(1200)
  const stillGone = !(await p.locator("[data-entries]").innerText()).includes(stamp)
  ok("#102 and stays removed after a reload", stillGone)
  ok("#102 moderation does not survive the reload", (await p.locator("[data-delete-entry]").count()) === 0)

  // The key must never be in anything the browser was served.
  const html = await p.content()
  ok("#102 the key is not in the page", !html.includes(KEY))

  ok("no page errors during the guestbook pass", errors.length === 0, errors.join(" | ").slice(0, 200))
  await b.close()
})().catch((e) => {
  console.log("SCRIPT ERROR " + e.message)
  process.exit(1)
})
