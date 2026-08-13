"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type FsNode, canonical, displayPath, listDir, parsePath, resolve } from "@/lib/filesystem"

/**
 * MS-DOS Prompt.
 *
 * Black screen, white raster text, a blinking block cursor and a command
 * history on the arrow keys. Unknown commands produce the authentic
 * "Bad command or file name".
 *
 * dir, cd, type and tree read the shared virtual C:\ drive from
 * lib/filesystem, the same tree Explorer shows, so both describe one machine.
 */

const BANNER = ["Microsoft(R) Windows 95", "   (C)Copyright Microsoft Corp 1981-1996.", ""]

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length)
}

function padLeft(s: string, n: number) {
  return s.length >= n ? s : " ".repeat(n - s.length) + s
}

export default function MsDos() {
  const [lines, setLines] = useState<string[]>([...BANNER])
  const [input, setInput] = useState("")
  const [cwd, setCwd] = useState<string[]>(["Windows"])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [busy, setBusy] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const prompt = `${displayPath(cwd)}>`

  const write = useCallback((...out: string[]) => setLines((prev) => [...prev, ...out]), [])

  const openWindow = (id: string) => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id } }))

  const run = useCallback(
    async (raw: string) => {
      const line = raw.trim()
      write(`${prompt}${raw}`)
      if (!line) return

      const [cmdRaw, ...args] = line.split(/\s+/)
      const cmd = cmdRaw.toUpperCase()
      const arg = args.join(" ")

      switch (cmd) {
        case "CLS":
          setLines([])
          return

        case "VER":
          write("", "Windows 95. [Version 4.00.950]", "")
          return

        case "DATE":
          write(`Current date is ${new Date().toDateString()}`, "")
          return

        case "TIME":
          write(`Current time is ${new Date().toLocaleTimeString()}`, "")
          return

        case "ECHO":
          write(arg || "ECHO is on.", "")
          return

        case "WHOAMI":
          write("joel", "")
          return

        case "DIR": {
          const here = resolve(cwd)
          if (!here || here.kind !== "dir") {
            write("Invalid directory", "")
            return
          }
          const entries = listDir(cwd)
          write("", ` Directory of ${displayPath(cwd)}`, "")
          write(`${pad(".", 14)}<DIR>`, `${pad("..", 14)}<DIR>`)
          let files = 0
          let bytes = 0
          for (const [name, child] of entries) {
            if (child.kind === "dir") {
              write(`${pad(name, 14)}<DIR>`)
            } else {
              files++
              bytes += child.size
              write(`${pad(name, 14)}${padLeft(String(child.size), 9)}`)
            }
          }
          write(`${padLeft(String(files), 9)} file(s)${padLeft(String(bytes), 12)} bytes`, "")
          return
        }

        case "CD":
        case "CHDIR": {
          if (!arg || arg === "\\") {
            setCwd(arg === "\\" ? [] : cwd)
            write("")
            return
          }
          if (arg === "..") {
            setCwd((p) => p.slice(0, -1))
            write("")
            return
          }
          const next = parsePath(arg, cwd)
          const node = resolve(next)
          if (!node || node.kind !== "dir") {
            write("Invalid directory", "")
            return
          }
          // Canonical casing, so `cd my documents` prints My Documents.
          setCwd(canonical(next) ?? next)
          write("")
          return
        }

        case "TYPE": {
          if (!arg) {
            write("Required parameter missing", "")
            return
          }
          const node = resolve(parsePath(arg, cwd))
          if (!node) {
            write("File not found", "")
            return
          }
          if (node.kind === "dir") {
            write("Access denied", "")
            return
          }
          // Binaries have no text body; DOS printed garbage, we print nothing.
          write(...(node.body ?? "").split(/\r?\n/), "")
          return
        }

        case "TREE": {
          const walk = (node: FsNode, prefix: string) => {
            if (node.kind !== "dir") return
            const names = Object.keys(node.children)
            names.forEach((name, i) => {
              const last = i === names.length - 1
              const child = node.children[name]
              write(`${prefix}${last ? "\\---" : "+---"}${name}`)
              if (child.kind === "dir") walk(child, `${prefix}${last ? "    " : "|   "}`)
            })
          }
          write(displayPath(cwd))
          const node = resolve(cwd)
          if (node) walk(node, "")
          write("")
          return
        }

        case "START": {
          const map: Record<string, string> = {
            RESUME: "resume",
            NOTEPAD: "notepad",
            CALC: "calculator",
            PAINT: "paint",
            GAMES: "games",
            CONTACT: "contact",
            GALLERY: "gallery",
          }
          // A bare name matches the table; anything else is looked up on disk,
          // so START C:\WINDOWS\COMMAND.COM works too.
          let id = map[arg.toUpperCase().replace(/\.(EXE|DOC|TXT|COM|URL|LNK)$/, "")]
          if (!id) {
            const node = resolve(parsePath(arg, cwd))
            if (node && node.kind === "file" && node.opens) id = node.opens
          }
          if (!id) {
            write("Bad command or file name", "")
            return
          }
          openWindow(id)
          write("")
          return
        }

        case "PING": {
          const host = arg || "builtbyjoel.dev"
          setBusy(true)
          write("", `Pinging ${host} with 32 bytes of data:`, "")
          for (let i = 0; i < 4; i++) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 320))
            const ms = 18 + Math.floor(Math.random() * 22)
            write(`Reply from ${host}: bytes=32 time=${ms}ms TTL=115`)
          }
          write("", `Ping statistics for ${host}:`, "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),", "")
          setBusy(false)
          return
        }

        case "HELP":
          write(
            "",
            "CD       Displays the name of or changes the current directory.",
            "CLS      Clears the screen.",
            "DATE     Displays the date.",
            "DIR      Displays a list of files and subdirectories.",
            "ECHO     Displays messages.",
            "EXIT     Quits the MS-DOS Prompt.",
            "HELP     Provides Help information for Windows commands.",
            "PING     Sends echo requests to a host.",
            "START    Starts a Windows program.",
            "TIME     Displays the system time.",
            "TREE     Graphically displays the directory structure.",
            "TYPE     Displays the contents of a text file.",
            "VER      Displays the Windows version.",
            "WHOAMI   Displays the current user.",
            "",
          )
          return

        case "EXIT":
          window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "msdos" } }))
          return

        default:
          write("Bad command or file name", "")
      }
    },
    [cwd, prompt, write],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (busy) {
      e.preventDefault()
      return
    }
    if (e.key === "Enter") {
      const value = input
      setInput("")
      if (value.trim()) {
        setHistory((h) => [...h, value])
        setHistoryIndex(-1)
      }
      void run(value)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!history.length) return
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex === -1) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(-1)
        setInput("")
      } else {
        setHistoryIndex(next)
        setInput(history[next])
      }
    } else if (e.key === "Tab") {
      // Complete against the names in the current directory.
      e.preventDefault()
      const node = resolve(cwd)
      if (!node || node.kind !== "dir") return
      const parts = input.split(/\s+/)
      const stem = (parts[parts.length - 1] || "").toUpperCase()
      const match = Object.keys(node.children).find((n) => n.startsWith(stem) && stem.length > 0)
      if (match) {
        parts[parts.length - 1] = match
        setInput(parts.join(" "))
      }
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  return (
    <div
      className="h-full w-full overflow-auto bg-black p-1"
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
      style={{ fontFamily: '"Courier New", monospace', fontSize: 14, lineHeight: 1.15, color: "#c0c0c0" }}
    >
      {lines.map((l, i) => (
        // Output is append-only, so the index is a stable key here.
        <div key={i} style={{ whiteSpace: "pre-wrap", minHeight: "1em" }}>
          {l}
        </div>
      ))}

      <div className="flex" style={{ whiteSpace: "pre" }}>
        <span>{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          aria-label="MS-DOS command"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          className="flex-1 border-0 bg-transparent outline-none"
          style={{ fontFamily: "inherit", fontSize: "inherit", color: "inherit", caretColor: "#c0c0c0" }}
        />
      </div>
    </div>
  )
}
