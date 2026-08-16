import "server-only"
import postgres from "postgres"

/**
 * Guestbook storage.
 *
 * Entries are shared between visitors, so they need somewhere real to live.
 * This talks to any Postgres over a single `DATABASE_URL`, which means the free
 * tier of Neon or Supabase, or a database on a box you own, all work with the
 * same code and none of them tie the site to its host.
 *
 *   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
 *
 * Use the *pooled* connection string. Serverless runs many short-lived
 * instances, and pointing them all at a direct Postgres connection exhausts the
 * server's connection limit under any real traffic; Neon and Supabase both hand
 * out a pooler URL for exactly this.
 *
 * With DATABASE_URL unset the guestbook falls back to an in-process list, so
 * local development works out of the box. That list is per-instance and does
 * not survive a restart, which is why it is not the production path.
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

const MAX_ENTRIES = 200

const connectionString = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)

export function isPersistent(): boolean {
  return Boolean(connectionString)
}

/** Development fallback. Per-instance and lost on restart, by design. */
const memory: GuestbookEntry[] = []

/**
 * One connection per instance.
 *
 * A serverless instance handles one request at a time, so a pool of one is all
 * it can use, and anything larger just holds connections the pooler could give
 * to someone else. Prepared statements are off because a transaction-mode
 * pooler cannot keep them between statements.
 */
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

/**
 * Creates the table on first use.
 *
 * Kept as a promise so concurrent requests on a cold instance wait on one
 * statement rather than each issuing their own CREATE.
 */
let ready: Promise<void> | null = null

function ensureTable(client: NonNullable<ReturnType<typeof db>>): Promise<void> {
  if (!ready) {
    ready = client`
      CREATE TABLE IF NOT EXISTS guestbook (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        site TEXT,
        drawing TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `
      .then(
        // Row level security, so no other role reads the table by default.
        // This app's role owns it and owners bypass RLS, so the server
        // actions are unaffected; a PostgREST anon role sees nothing.
        () => client`ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY`,
      )
      .then(() => undefined)
    // A failed migration must not be cached, or every later request believes
    // the table exists.
    ready.catch(() => {
      ready = null
    })
  }
  return ready
}

interface Row {
  id: string
  name: string
  message: string
  site: string | null
  drawing: string | null
  created_at: Date
}

const toEntry = (row: Row): GuestbookEntry => ({
  id: row.id,
  name: row.name,
  message: row.message,
  site: row.site ?? undefined,
  drawing: row.drawing ?? undefined,
  at: row.created_at.toISOString(),
})

export async function listEntries(): Promise<GuestbookEntry[]> {
  const client = db()
  if (!client) return [...memory]

  await ensureTable(client)
  const rows = await client<Row[]>`
    SELECT id, name, message, site, drawing, created_at
    FROM guestbook
    ORDER BY created_at DESC
    LIMIT ${MAX_ENTRIES}
  `
  return rows.map(toEntry)
}

export async function addEntry(entry: GuestbookEntry): Promise<void> {
  const client = db()
  if (!client) {
    memory.unshift(entry)
    memory.length = Math.min(memory.length, MAX_ENTRIES)
    return
  }

  await ensureTable(client)
  await client`
    INSERT INTO guestbook (id, name, message, site, drawing, created_at)
    VALUES (
      ${entry.id},
      ${entry.name},
      ${entry.message},
      ${entry.site ?? null},
      ${entry.drawing ?? null},
      ${entry.at}
    )
  `
}

/**
 * Removes one entry, for moderation.
 *
 * Returns whether a row was actually removed, so the caller can tell a
 * successful delete from an id that was already gone. Authorisation is not
 * decided here: the server action checks the key before it ever calls this.
 */
export async function deleteEntry(id: string): Promise<boolean> {
  const client = db()
  if (!client) {
    const at = memory.findIndex((entry) => entry.id === id)
    if (at === -1) return false
    memory.splice(at, 1)
    return true
  }

  await ensureTable(client)
  const removed = await client`DELETE FROM guestbook WHERE id = ${id} RETURNING id`
  return removed.length > 0
}
