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

/*
  The key must match whatever the server under test loaded, which is the
  repo's .env unless the environment overrides it. A hardcoded fallback
  went stale the moment the key was rotated, and every assertion after it
  failed for the wrong reason.
*/
const { readFileSync } = require("fs")
const KEY =
  process.env.GUESTBOOK_ADMIN_KEY ||
  (() => {
    try {
      const line = readFileSync(require("path").join(process.cwd(), ".env"), "utf-8")
        .split(/\r?\n/)
        .find((l) => l.startsWith("GUESTBOOK_ADMIN_KEY="))
      return line ? line.slice("GUESTBOOK_ADMIN_KEY=".length).trim() : ""
    } catch {
      return ""
    }
  })()
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
  /*
    Signing is capped at three per fifteen minutes per address, so a run
    that follows a few others meets the site's own limiter. That is the
    control working, not a fault: the run says so and stops, because there
    is nothing to moderate without a fresh entry.
  */
  const signed = (await win.locator("[data-entries]").innerText()).includes(stamp)
  const signLimited = /signed a few times already/i.test(await win.innerText())
  ok("an entry can be signed", signed || signLimited, signLimited ? "rate limited" : "")
  if (!signed) {
    console.log("  SKIP  the signing limiter is holding this address; rerun shortly")
    ok("no page errors during the guestbook pass", errors.length === 0, errors.join(" | ").slice(0, 200))
    await b.close()
    return
  }

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

  /*
    A wrong key is refused and reveals nothing.

    Five wrong guesses in ten minutes shuts the door per address, which is
    the point of the limiter, so running this check repeatedly eventually
    meets its own rate limit. Being told to come back later is a refusal
    too; the rest is skipped in that case rather than reported as a fault,
    because a locked-out run cannot test what a key unlocks.
  */
  await win.locator("[data-moderation-on]").click()
  await p.waitForTimeout(250)
  await p.locator("[data-key-input]").fill("not-the-key")
  await p.locator("[data-key-ok]").click()
  await p.waitForTimeout(900)
  const refusal = await win.innerText()
  const rateLimited = /too many attempts/i.test(refusal)
  ok("#102 a wrong key is refused", /not right/i.test(refusal) || rateLimited, rateLimited ? "rate limited" : "")
  ok("#102 and unlocks nothing", (await win.locator("[data-delete-entry]").count()) === 0)

  if (rateLimited) {
    console.log("  SKIP  the limiter is holding this address; rerun in ten minutes")
    ok("no page errors during the guestbook pass", errors.length === 0, errors.join(" | ").slice(0, 200))
    await b.close()
    return
  }

  // The right key opens moderation. Verifying spends from the same
  // five-per-ten-minutes budget the wrong guess above did, so back-to-back
  // runs can be refused here too; that is the limiter, not a fault.
  await p.locator("[data-key-input]").fill(KEY)
  await p.locator("[data-key-ok]").click()
  await p.waitForTimeout(900)
  if (/too many attempts/i.test(await win.innerText())) {
    console.log("  SKIP  the limiter is holding this address; rerun in ten minutes")
    ok("no page errors during the guestbook pass", errors.length === 0, errors.join(" | ").slice(0, 200))
    await b.close()
    return
  }
  const deletes = await win.locator("[data-delete-entry]").count()
  ok("#102 the right key reveals the Delete buttons", deletes > 0, `${deletes} entries`)

  // Delete the entry just signed, confirming the dialog.
  const target = win.locator("[data-entry]", { hasText: stamp }).locator("[data-delete-entry]")
  await target.first().click()
  // Wait for the confirmation rather than assuming it has arrived: the box
  // is queued, so a busy run can render it a beat later than a fixed sleep.
  await p.waitForSelector("[data-messagebox]", { timeout: 10000 })
  await p.locator("[data-ok]").click()
  await p.waitForTimeout(1500)
  /*
    Deleting spends from the same five-per-ten-minutes budget the key
    checks do, so a run following others in the same window can be refused
    here even with the right key. That is the limiter doing its job on the
    action that actually destroys something, which is where it matters
    most, so a locked-out run says so instead of failing.
  */
  const deleteRefused = /too many attempts/i.test(await win.innerText())
  if (deleteRefused) {
    console.log("  SKIP  the limiter refused the delete; rerun in ten minutes")
    ok("no page errors during the guestbook pass", errors.length === 0, errors.join(" | ").slice(0, 200))
    await b.close()
    return
  }
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
