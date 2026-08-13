import "server-only"

/**
 * Guestbook storage.
 *
 * Entries are shared between visitors, so they need somewhere real to live.
 * This talks to Upstash Redis over its REST API, which needs no driver and no
 * connection pooling: two environment variables and fetch. That matters on
 * serverless, where a pooled Postgres client is a liability and every cold
 * start pays for it.
 *
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * With neither set the guestbook runs against an in-process list instead, so
 * local development works out of the box. That list is per-instance and does
 * not survive a restart, which is exactly why it is not the production path.
 */

export interface GuestbookEntry {
  id: string
  name: string
  message: string
  /** Optional, shown as a link only when it is a real http(s) URL. */
  site?: string
  /** Optional PNG data URI from the little sketch pad, capped in size. */
  drawing?: string
  /** ISO timestamp; the client formats it. */
  at: string
}

const KEY = "guestbook:entries"
const MAX_ENTRIES = 200

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export function isPersistent(): boolean {
  return Boolean(url && token)
}

/** Development fallback. Per-instance and lost on restart, by design. */
const memory: GuestbookEntry[] = []

async function redis(command: unknown[]): Promise<unknown> {
  const response = await fetch(url as string, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Upstash responded ${response.status}`)
  const body = (await response.json()) as { result?: unknown }
  return body.result
}

export async function listEntries(): Promise<GuestbookEntry[]> {
  if (!isPersistent()) return [...memory]

  // Newest first: entries are pushed onto the head of the list.
  const raw = (await redis(["LRANGE", KEY, 0, MAX_ENTRIES - 1])) as string[] | null
  if (!raw) return []

  return raw.flatMap((item) => {
    try {
      const parsed = JSON.parse(item) as GuestbookEntry
      // A malformed row should cost that one row, not the whole page.
      return parsed && typeof parsed.message === "string" ? [parsed] : []
    } catch {
      return []
    }
  })
}

export async function addEntry(entry: GuestbookEntry): Promise<void> {
  if (!isPersistent()) {
    memory.unshift(entry)
    memory.length = Math.min(memory.length, MAX_ENTRIES)
    return
  }

  await redis(["LPUSH", KEY, JSON.stringify(entry)])
  // Trim on write so the list cannot grow without bound.
  await redis(["LTRIM", KEY, 0, MAX_ENTRIES - 1])
}
