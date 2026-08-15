"use server"

import { headers } from "next/headers"

import { rateLimit } from "@/lib/rate-limit"
import { increment, isPersistent, total } from "@/lib/visitors"

/**
 * The counters' public verbs.
 *
 * A Server Action is a public POST endpoint, so even cosmetic counters get
 * the contact form's treatment: increments are rate limited per IP, because
 * the alternative is letting one script inflate the numbers forever. The IP
 * keys the limiter's in-memory window and is stored nowhere.
 *
 * `persistent: false` means the in-process fallback is counting; a number
 * that resets on restart is not worth a greeting, and Clippy stays quiet.
 */

const UNIQUE_LIMIT = 5
const HITS_LIMIT = 60
const WINDOW_MS = 60 * 60 * 1000

async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}

/** Counts a first-time visitor toward the unique-visitors total. */
export async function countVisit(): Promise<{ count: number; persistent: boolean }> {
  try {
    const limit = rateLimit(`visitors:${await clientIp()}`, UNIQUE_LIMIT, WINDOW_MS)
    if (!limit.allowed) {
      return { count: await total("visitors"), persistent: isPersistent() }
    }
    return { count: await increment("visitors"), persistent: isPersistent() }
  } catch (error) {
    console.error("Could not count the visit:", error)
    return { count: 0, persistent: false }
  }
}

/** Reads the unique-visitors total without counting anybody. */
export async function visitorCount(): Promise<{ count: number; persistent: boolean }> {
  try {
    return { count: await total("visitors"), persistent: isPersistent() }
  } catch (error) {
    console.error("Could not read the visitor count:", error)
    return { count: 0, persistent: false }
  }
}

/**
 * One page view on the home page's hit counter. Returns the new total, which
 * the counter renders zero-padded because that is the law.
 */
export async function bumpVisitors(): Promise<number> {
  try {
    const limit = rateLimit(`hits:${await clientIp()}`, HITS_LIMIT, WINDOW_MS)
    if (!limit.allowed) return total("hits")
    return await increment("hits")
  } catch (error) {
    console.error("Could not bump the hit counter:", error)
    return 0
  }
}
