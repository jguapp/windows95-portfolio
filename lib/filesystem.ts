/**
 * The virtual C:\ drive.
 *
 * One tree shared by Explorer, the MS-DOS Prompt, Notepad and the Recycle Bin,
 * so they describe the same machine rather than each inventing its own.
 *
 * Files can carry `opens`, the id of the window that handles them. That is what
 * lets Explorer double-click Resume.doc into the Word window and the DOS prompt
 * run START RESUME, without either knowing anything about the other.
 */

import { persistenceEnabled } from "@/lib/persistence"

export type FsFile = {
  kind: "file"
  /** Window id this file opens in, if any. */
  opens?: string
  /** Text contents, for TYPE and Notepad. */
  body?: string
  /** Bytes, as shown by DIR and Explorer's Details view. */
  size: number
  modified: string
}

export type FsDir = {
  kind: "dir"
  children: Record<string, FsNode>
}

export type FsNode = FsFile | FsDir

const f = (opts: { body?: string; opens?: string; size?: number; modified?: string }): FsFile => ({
  kind: "file",
  opens: opts.opens,
  body: opts.body,
  size: opts.size ?? (opts.body ? opts.body.length : 0),
  modified: opts.modified ?? "08/24/95 12:00",
})

const d = (children: Record<string, FsNode>): FsDir => ({ kind: "dir", children })

export const README_TEXT = `README.TXT
==========

This whole desktop is a Next.js application:
every window, the Start menu, the drag-and-drop,
the games. Nothing here is a screenshot.

Things worth opening:

  Resume        Microsoft Word 95
  My Projects   YouTube, circa 2005
  Mail          Outlook Express
  Games         Chess, Solitaire, Tetris,
                Minesweeper, FreeCell,
                Hearts, Reversi and Pong
  The Internet  Explorer, and 1996 with it
  Winamp        it really whips the llama
  Paint         it draws, and it saves

Ctrl+Alt+R opens Run.
Try the Konami code on the desktop.

- Joel
`

const INITIAL: FsDir = d({
  "My Documents": d({
    "Resume.doc": f({ opens: "resume", size: 28160, modified: "08/12/26 09:14" }),
    "Readme.txt": f({ opens: "notepad", body: README_TEXT, modified: "08/12/26 09:20" }),
  }),
  "My Pictures": d({
    "Gallery.lnk": f({ opens: "gallery", size: 512, modified: "08/12/26 09:14" }),
  }),
  "Program Files": d({
    Accessories: d({
      "Notepad.exe": f({ opens: "notepad", size: 45568, modified: "08/24/95 12:00" }),
      "Calc.exe": f({ opens: "calculator", size: 90112, modified: "08/24/95 12:00" }),
      "Mspaint.exe": f({ opens: "paint", size: 312320, modified: "08/24/95 12:00" }),
      Games: d({
        "Chess.exe": f({ opens: "games", size: 128000, modified: "08/24/95 12:00" }),
        "Sol.exe": f({ opens: "games", size: 180224, modified: "08/24/95 12:00" }),
        "Winmine.exe": f({ opens: "games", size: 27136, modified: "08/24/95 12:00" }),
        "Tetris.exe": f({ opens: "games", size: 64512, modified: "08/24/95 12:00" }),
        "Pong.exe": f({ opens: "games", size: 32768, modified: "08/24/95 12:00" }),
      }),
    }),
    Internet: d({
      "Outlook.exe": f({ opens: "contact", size: 421888, modified: "08/24/95 12:00" }),
      "Youtube.url": f({ opens: "projects", size: 256, modified: "08/12/26 09:14" }),
    }),
  }),
  Windows: d({
    "Command.com": f({ opens: "msdos", size: 93890, modified: "08/24/95 12:00" }),
    Media: d({
      "Chimes.wav": f({ size: 15920, modified: "08/24/95 12:00" }),
      "Ding.wav": f({ size: 10744, modified: "08/24/95 12:00" }),
    }),
    "Win.ini": f({ body: "[windows]\nrun=\nload=\n", modified: "08/24/95 12:00" }),
  }),
  "Autoexec.bat": f({ body: "@ECHO OFF\nPROMPT $P$G\nPATH C:\\WINDOWS\n", modified: "08/24/95 12:00" }),
  "Config.sys": f({ body: "DEVICE=C:\\WINDOWS\\HIMEM.SYS\nFILES=60\nBUFFERS=30\n", modified: "08/24/95 12:00" }),
})

/**
 * The live drive.
 *
 * Notepad can save, so the tree has to be mutable. Readers go through
 * getRoot() and anything that renders it subscribes, so Explorer updates the
 * moment a file is written rather than showing a stale listing.
 */
let root: FsDir = INITIAL
const listeners = new Set<() => void>()

export function getRoot(): FsDir {
  hydrate()
  return root
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/*
  Persistence.

  The tree lives in localStorage so a file saved from Notepad or written from
  DOS is still there tomorrow. The key carries a version: when the shipped
  default tree changes shape, bumping FS_VERSION discards stale saves rather
  than letting an old snapshot freeze the defaults forever. Reads and writes
  are defensive; a visitor with storage disabled just gets a fresh drive each
  visit, which is where everyone started in 1995 anyway.
*/
// A version bump must be mirrored in lib/persistence.ts WORK_KEYS.
const FS_VERSION = 1
const FS_KEY = `win95:fs:v${FS_VERSION}`

function persist() {
  if (typeof window === "undefined" || !persistenceEnabled()) return
  try {
    window.localStorage.setItem(FS_KEY, JSON.stringify(root))
  } catch {
    // Quota or storage disabled. The session still works; it just forgets.
  }
}

let hydrated = false

/** Replaces the default tree with the stored one, once, on the client. */
function hydrate() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  if (!persistenceEnabled()) return
  try {
    const raw = window.localStorage.getItem(FS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && parsed.kind === "dir" && parsed.children) {
      root = parsed as FsDir
    }
  } catch {
    // A corrupt save is worth less than a working drive.
  }
}

function notify() {
  persist()
  root = { ...root }
  for (const l of listeners) l()
}

/** Create or overwrite a text file, creating parent folders as needed. */
export function writeFile(path: string[], body: string): boolean {
  if (!path.length) return false
  const dirPath = path.slice(0, -1)
  const name = path[path.length - 1]
  const parent = resolve(dirPath)
  if (!parent || parent.kind !== "dir") return false

  const existingKey = Object.keys(parent.children).find((k) => k.toLowerCase() === name.toLowerCase())
  const key = existingKey ?? name
  const prev = existingKey ? parent.children[existingKey] : undefined
  const now = new Date()
  const stamp = `${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(2)} ${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  parent.children[key] = {
    kind: "file",
    body,
    size: body.length,
    modified: stamp,
    opens: prev && prev.kind === "file" ? prev.opens : "notepad",
  }
  notify()
  return true
}

/** Every text file on the drive, for Notepad's Open dialog. */
export function textFiles(): { path: string[]; name: string }[] {
  const out: { path: string[]; name: string }[] = []
  const walk = (node: FsNode, path: string[]) => {
    if (node.kind !== "dir") return
    for (const [name, child] of Object.entries(node.children)) {
      if (child.kind === "dir") walk(child, [...path, name])
      else if (typeof child.body === "string") out.push({ path: [...path, name], name })
    }
  }
  walk(root, [])
  return out
}

/** Case-insensitive lookup, since DOS and Explorer both ignore case. */
export function resolve(path: string[], from: FsDir = root): FsNode | null {
  let node: FsNode = from
  for (const part of path) {
    if (node.kind !== "dir") return null
    const children: Record<string, FsNode> = node.children
    const key: string | undefined = Object.keys(children).find((k) => k.toLowerCase() === part.toLowerCase())
    if (!key) return null
    node = children[key]
  }
  return node
}

/** The canonical casing for a path, so `cd my documents` prints My Documents. */
export function canonical(path: string[], from: FsDir = root): string[] | null {
  const out: string[] = []
  let node: FsNode = from
  for (const part of path) {
    if (node.kind !== "dir") return null
    const children: Record<string, FsNode> = node.children
    const key: string | undefined = Object.keys(children).find((k) => k.toLowerCase() === part.toLowerCase())
    if (!key) return null
    out.push(key)
    node = children[key]
  }
  return out
}

export function listDir(path: string[], from: FsDir = root): [string, FsNode][] {
  const node = resolve(path, from)
  if (!node || node.kind !== "dir") return []
  // Directories first, then files, each alphabetically, as Explorer sorted.
  return Object.entries(node.children).sort(([an, a], [bn, b]) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1
    return an.localeCompare(bn)
  })
}

export function displayPath(path: string[]): string {
  return path.length ? `C:\\${path.join("\\")}` : "C:\\"
}

/** Parse a DOS-style path into segments, relative to `cwd` unless absolute. */
export function parsePath(input: string, cwd: string[]): string[] {
  const trimmed = input.trim().replace(/"/g, "")
  const absolute = /^[a-z]:\\/i.test(trimmed) || trimmed.startsWith("\\")
  const body = trimmed.replace(/^[a-z]:\\?/i, "").replace(/^\\/, "")
  const parts = body.split("\\").filter(Boolean)

  const base = absolute ? [] : [...cwd]
  for (const part of parts) {
    if (part === ".") continue
    if (part === "..") base.pop()
    else base.push(part)
  }
  return base
}

/** Icon for a node, from the extracted Windows 95 set. */
export function iconFor(name: string, node: FsNode, open = false): string {
  if (node.kind === "dir") {
    return open ? "/images/win95/folder-open-16.png" : "/images/win95/folder-closed-16.png"
  }
  const lower = name.toLowerCase()
  if (lower.endsWith(".txt")) return "/images/win95/notepad-16.png"
  if (lower.endsWith(".doc")) return "/images/win95/resume-16.png"
  if (lower.endsWith(".com")) return "/images/win95/msdos-16.png"
  if (lower.includes("calc")) return "/images/win95/calculator-16.png"
  if (lower.includes("paint")) return "/images/win95/paint-16.png"
  if (lower.includes("winmine")) return "/images/win95/minesweeper-16.png"
  if (lower.includes("sol")) return "/images/win95/solitaire-16.png"
  if (lower.endsWith(".exe")) return "/images/win95/explorer-16.png"
  return "/images/win95/notepad-16.png"
}
