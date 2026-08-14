"use server"

import postgres from "postgres"

/**
 * The hit counter, made honest.
 *
 * Every 1996 home page had one and most of them lied. This one keeps a single
 * row in the same Postgres the guestbook uses and increments it once per call.
 * Without a database it falls back to a seeded in-process count, which resets
 * per instance: exactly as trustworthy as the counters it imitates.
 */

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

const sql = connectionString
  ? postgres(connectionString, { max: 1, prepare: false, idle_timeout: 20 })
  : null

let ensured: Promise<void> | null = null

function ensureTable(): Promise<void> {
  if (!sql) return Promise.resolve()
  if (!ensured) {
    ensured = sql`
      CREATE TABLE IF NOT EXISTS counters (
        name text PRIMARY KEY,
        value bigint NOT NULL DEFAULT 0
      )
    `.then(
      () => undefined,
      (err) => {
        // Un-cache so the next call retries rather than failing forever.
        ensured = null
        throw err
      },
    )
  }
  return ensured
}

/** The number the fallback starts from, chosen to look period-appropriate. */
const SEED = 13847
let inMemory = SEED

/** Increments the visitor count and returns the new total. */
export async function bumpVisitors(): Promise<number> {
  if (!sql) {
    inMemory += 1
    return inMemory
  }
  try {
    await ensureTable()
    const rows = await sql<{ value: string }[]>`
      INSERT INTO counters (name, value) VALUES ('ie-home', ${SEED + 1})
      ON CONFLICT (name) DO UPDATE SET value = counters.value + 1
      RETURNING value
    `
    return Number(rows[0].value)
  } catch {
    // A database outage should not break the home page over a novelty number.
    inMemory += 1
    return inMemory
  }
}
