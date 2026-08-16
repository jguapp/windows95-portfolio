"use client"

/**
 * Best times and high scores, kept in localStorage.
 *
 * Every game held its table in component state, so a score survived exactly as
 * long as the window stayed open. Windows 95 wrote these to disk and showed
 * them again next time, which is the only thing that makes a best time mean
 * anything.
 *
 * Reads are defensive: a visitor with storage disabled, or with a stale shape
 * left over from an earlier version, gets the defaults rather than a crash.
 */

export interface ScoreEntry {
  name: string
  /** Seconds for a timed game, points for a scored one. */
  value: number
  /** Difficulty, deck, or whatever else splits one table from another. */
  category?: string
  at?: string
}

const PREFIX = "win95:scores:"

function read(game: string): ScoreEntry[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PREFIX + game)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (e) => e && typeof e.name === "string" && typeof e.value === "number" && Number.isFinite(e.value),
    )
  } catch {
    return null
  }
}

function write(game: string, entries: ScoreEntry[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PREFIX + game, JSON.stringify(entries))
  } catch {
    // Storage can be full or disabled. A lost high score is not worth a crash.
  }
}

export function loadScores(game: string, fallback: ScoreEntry[]): ScoreEntry[] {
  return read(game) ?? fallback
}

/**
 * Files a score and returns the table it belongs to.
 *
 * `lower` is true for times, where a smaller number is better, and false for
 * points. Only the top ten of each category are kept.
 */
export function saveScore(game: string, entry: ScoreEntry, lower = true): ScoreEntry[] {
  const all = read(game) ?? []
  const next = [...all, { ...entry, at: entry.at ?? new Date().toISOString() }]
    .sort((a, b) => (lower ? a.value - b.value : b.value - a.value))
    .filter((e, i, list) => list.filter((x) => x.category === e.category).indexOf(e) < 10)
  write(game, next)
  return next
}

/** Clears a game's table, which is what a Reset Scores button is for. */
export function resetScores(game: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PREFIX + game)
  } catch {
    // Storage disabled reads as already reset.
  }
}

/** True when a score would make the table, so the name prompt is worth showing. */
export function isBestTime(game: string, value: number, category?: string, lower = true): boolean {
  const all = (read(game) ?? []).filter((e) => e.category === category)
  if (all.length < 10) return true
  return all.some((e) => (lower ? value < e.value : value > e.value))
}
