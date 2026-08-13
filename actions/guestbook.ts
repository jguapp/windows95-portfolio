"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { addEntry, isPersistent, listEntries, type GuestbookEntry } from "@/lib/guestbook"
import { rateLimit } from "@/lib/rate-limit"

/**
 * Signing the guestbook.
 *
 * This takes writing from anyone on the internet and shows it to everyone
 * else, so it gets the same treatment the contact form got: a Server Action is
 * a public POST endpoint, and anything enforced only in the browser is not a
 * control. Length caps, a honeypot and a rate limit all run here.
 *
 * Nothing submitted is ever rendered as markup. Entries go into the page as
 * text, which is what makes a public guestbook safe to display.
 */

const MAX_SIGNINGS = 3
const WINDOW_MS = 15 * 60 * 1000

const EntrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please enter a name" })
    .max(40, { message: "That name is too long" }),
  message: z
    .string()
    .trim()
    .min(1, { message: "Please write something" })
    .max(500, { message: "Please keep it under 500 characters" }),
  site: z
    .string()
    .trim()
    .max(120, { message: "That URL is too long" })
    .optional()
    .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), {
      message: "A homepage must start with http:// or https://",
    }),
  /**
   * The sketch, as a PNG data URI.
   *
   * Only PNG is accepted and only up to 48KB: this is a 240x120 doodle pad, so
   * anything larger is not a drawing from it, and an unbounded string from the
   * internet is exactly what you do not want going into shared storage.
   */
  drawing: z
    .string()
    .max(48_000, { message: "That drawing is too large" })
    .optional()
    .refine((value) => !value || /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value), {
      message: "That drawing could not be read",
    }),
})

async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}

export async function getEntries(): Promise<{ entries: GuestbookEntry[]; persistent: boolean }> {
  try {
    return { entries: await listEntries(), persistent: isPersistent() }
  } catch (error) {
    console.error("Could not read the guestbook:", error)
    return { entries: [], persistent: isPersistent() }
  }
}

export async function signGuestbook(
  formData: FormData,
): Promise<{ success: boolean; message: string; entries?: GuestbookEntry[] }> {
  try {
    // Honeypot: hidden from real visitors, so a filled value means a bot.
    // Report success rather than teaching it to try something else.
    if ((formData.get("homepage_url") as string)?.trim()) {
      return { success: true, message: "Thanks for signing!" }
    }

    const limit = rateLimit(`guestbook:${await clientIp()}`, MAX_SIGNINGS, WINDOW_MS)
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60)
      return {
        success: false,
        message: `You've signed a few times already. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      }
    }

    const parsed = EntrySchema.safeParse({
      name: formData.get("name"),
      message: formData.get("message"),
      site: (formData.get("site") as string) || undefined,
      drawing: (formData.get("drawing") as string) || undefined,
    })

    if (!parsed.success) {
      return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") }
    }

    const entry: GuestbookEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: parsed.data.name,
      message: parsed.data.message,
      site: parsed.data.site,
      drawing: parsed.data.drawing,
      at: new Date().toISOString(),
    }

    await addEntry(entry)

    return {
      success: true,
      message: isPersistent()
        ? "Thanks for signing!"
        : "Signed. Storage is not configured, so this entry only lives on this server.",
      entries: await listEntries(),
    }
  } catch (error) {
    console.error("Could not sign the guestbook:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}
