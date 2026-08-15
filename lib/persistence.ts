"use client"

/**
 * The master switch for remembering a visitor's work.
 *
 * Saving files and desktop items into someone's browser is a choice they
 * should make, so the welcome dialog asks and nothing is saved until the box
 * is checked: consent is opt-in, not assumed. Turning it back off stops new
 * writes and clears what was already saved, because "stop remembering" that
 * keeps the old data would be a strange kind of stopping.
 *
 * Display settings, high scores and the visitor number are small preferences
 * rather than work, and stay outside this switch.
 */

const FLAG_KEY = "win95:persist"

/**
 * The keys that hold a visitor's work. lib/filesystem.ts and desktop.tsx
 * name the same strings; a version bump there must be mirrored here or
 * disabling the switch stops clearing the tree.
 */
const WORK_KEYS = ["win95:fs:v2", "win95:desktop-items:v1"]

export function persistenceEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1"
  } catch {
    return false
  }
}

export function setPersistenceEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(FLAG_KEY, on ? "1" : "0")
    if (!on) {
      for (const key of WORK_KEYS) window.localStorage.removeItem(key)
    }
  } catch {
    // Storage being unavailable makes the whole question moot.
  }
}
