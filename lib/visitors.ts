import "server-only"
import postgres from "postgres"

/**
 * Named counters, in the spirit of every 1990s hit counter.
 *
 * Two live here: "visitors", which counts first visits and lets Clippy greet
 * people with their number, and "hits", the per-view counter on the Internet
 * Explorer home page. They store nothing about who anybody was: each is one
 * row holding one number.
 *
 * Uses the same `DATABASE_URL` as the guestbook but its own single-connection
 * client, closed after twenty idle seconds. With no database the counts live
 * in process memory, which does not survive a restart; callers can check
 * `isPersistent` and decide whether a resetting number is worth showing.
 */

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

/** Development fallback, per instance, lost on restart by design. */
const memory = new Map<string, number>()

let sql: ReturnType<typeof postgres> | null = null

function db() {
  if (!connectionString) return null
  if (!sql) {
    sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      prepare: false,
    })
  }
  return sql
}

let ready: Promise<void> | null = null

function ensureTable(client: NonNullable<ReturnType<typeof db>>): Promise<void> {
  if (!ready) {
    ready = client`
      CREATE TABLE IF NOT EXISTS counters (
        name TEXT PRIMARY KEY,
        count BIGINT NOT NULL
      )
    `.then(() => undefined)
    // A failed migration must not be cached, or every later request believes
    // the table exists.
    ready.catch(() => {
      ready = null
    })
  }
  return ready
}

export function isPersistent(): boolean {
  return Boolean(connectionString)
}

/** Adds one to a named counter and returns the new total. */
export async function increment(name: string): Promise<number> {
  const client = db()
  if (!client) {
    const next = (memory.get(name) ?? 0) + 1
    memory.set(name, next)
    return next
  }

  await ensureTable(client)
  const rows = await client<{ count: string }[]>`
    INSERT INTO counters (name, count) VALUES (${name}, 1)
    ON CONFLICT (name) DO UPDATE SET count = counters.count + 1
    RETURNING count
  `
  return Number(rows[0].count)
}

/** A counter's current total, zero if it has never been touched. */
export async function total(name: string): Promise<number> {
  const client = db()
  if (!client) return memory.get(name) ?? 0

  await ensureTable(client)
  const rows = await client<{ count: string }[]>`
    SELECT count FROM counters WHERE name = ${name}
  `
  return rows.length ? Number(rows[0].count) : 0
}
