"use client"

/**
 * The Documents menu's memory.
 *
 * Windows 95 listed the documents you had actually opened, most recent
 * first. Opening a file anywhere on this desktop files it here, and the
 * Start menu's Documents cascade reads it back. Kept in localStorage so
 * the list survives a reload, capped the way the original capped it.
 */

export interface RecentDoc {
  /** The file's display name, extension included. */
  name: string
  /** The window id the document opens with. */
  opens: string
  at: string
}

const KEY = "win95:recent-docs"
const CAP = 10

export function readRecentDocs(): RecentDoc[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d) => d && typeof d.name === "string" && typeof d.opens === "string")
  } catch {
    return []
  }
}

/** True for things that open like programs rather than documents. */
function isProgram(name: string): boolean {
  return /\.(exe|lnk|url)$/i.test(name)
}

/** Files a document, newest first, deduplicated by name. Programs are not
 *  documents: launching Notepad.exe never put Notepad.exe in the menu. */
export function recordRecentDoc(name: string, opens: string) {
  if (typeof window === "undefined") return
  if (isProgram(name)) return
  try {
    const rest = readRecentDocs().filter((d) => d.name !== name)
    const next = [{ name, opens, at: new Date().toISOString() }, ...rest].slice(0, CAP)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // A forgotten document is not worth a crash.
  }
}
