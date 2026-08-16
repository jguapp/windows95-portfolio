"use client"

import { useEffect, useRef, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"
import { messageBox } from "@/components/win95-dialog"

/**
 * The Run dialog, opened from the Start menu or with Windows+R.
 *
 * Windows 95 accepted a program name and ran it. This accepts the same names,
 * matched without case or extension, and opens the window they correspond to.
 * Anything it does not recognise gets the error the original gave, which named
 * the file back at you rather than saying something vague.
 */
interface RunDialogProps {
  onClose: () => void
}

/**
 * What you can type and what it opens.
 *
 * The keys are the executable names Windows actually shipped, so `winmine`
 * and `sol` work for the same reason `calc` does. Aliases for this site's own
 * windows sit alongside them.
 */
const COMMANDS: Record<string, string> = {
  calc: "calculator",
  calculator: "calculator",
  notepad: "notepad",
  mspaint: "paint",
  paint: "paint",
  pbrush: "paint",
  explorer: "explorer",
  command: "msdos",
  cmd: "msdos",
  winmine: "games",
  sol: "games",
  freecell: "games",
  mshearts: "games",
  chess: "games",
  tetris: "games",
  pong: "games",
  games: "games",
  winamp: "winamp",
  iexplore: "internet-explorer",
  find: "find-files",
  sounds: "sound-properties",
  mmsys: "sound-properties",
  ie: "internet-explorer",
  outlook: "contact",
  contact: "contact",
  resume: "resume",
  gallery: "gallery",
  projects: "projects",
  youtube: "projects",
  guestbook: "guestbook",
  about: "about-me",
  "about-me": "about-me",
}

/** The defaults behind the real history, in Windows' order. */
const DEFAULT_HISTORY = ["calc", "notepad", "mspaint", "winmine", "sol", "explorer", "command"]

const HISTORY_KEY = "win95:run-history"

/** What was actually run leads; the defaults fill in behind it. */
function readHistory(): string[] {
  try {
    const own: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
    return [...own, ...DEFAULT_HISTORY.filter((d) => !own.includes(d))].slice(0, 10)
  } catch {
    return DEFAULT_HISTORY
  }
}

function recordRun(name: string) {
  try {
    const own: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
    localStorage.setItem(HISTORY_KEY, JSON.stringify([name, ...own.filter((o) => o !== name)].slice(0, 10)))
  } catch {
    // A prompt without a memory is still a prompt.
  }
}

export default function RunDialog({ onClose }: RunDialogProps) {
  const [value, setValue] = useState("")
  const [history, setHistory] = useState<string[]>(DEFAULT_HISTORY)

  useEffect(() => {
    setHistory(readHistory())
  }, [])
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const run = () => {
    // Strip a path, an extension and any quotes, the way a shell would.
    const typed = value.trim().replace(/^"|"$/g, "")
    if (!typed) return
    const bare = typed.split(/[\\/]/).pop() ?? typed
    const key = bare.replace(/\.(exe|com|lnk|url)$/i, "").toLowerCase()

    const target = COMMANDS[key]
    if (!target) {
      void messageBox({
        title: "Run",
        text: `Cannot find the file '${typed}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`,
        icon: "error",
      })
      return
    }

    recordRun(key)
    window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: target } }))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30">
      <div
        data-run
        className="win95-type w-[364px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_8px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
          <span className="px-1 font-bold">Run</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-[16px] w-[16px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex gap-3 p-3">
          <img
            src="/images/win95/msdos-16.png"
            alt=""
            className="mt-1 h-8 w-8 shrink-0"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="flex-1">
            <p className="mb-3">
              Type the name of a program, folder, or document, and Windows will open it for you.
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="run-open">
                <span className="underline">O</span>pen:
              </label>
              <div className="relative flex-1">
                <div className="flex border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
                  <input
                    id="run-open"
                    ref={input}
                    data-run-input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") run()
                    }}
                    className="min-w-0 flex-1 px-1 py-[2px] outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Show history"
                    onClick={() => setOpen((v) => !v)}
                    className="w-[17px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-[9px] leading-none"
                  >
                    &#9660;
                  </button>
                </div>
                {open && (
                  <ul className="absolute left-0 right-0 top-full z-10 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-white">
                    {history.map((h) => (
                      <li key={h}>
                        <button
                          type="button"
                          onClick={() => {
                            setValue(h)
                            setOpen(false)
                            input.current?.focus()
                          }}
                          className="w-full px-1 py-[1px] text-left hover:bg-[#000080] hover:text-white"
                        >
                          {h}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={run}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              void messageBox({
                title: "Browse",
                text: "Browsing for a file is not available here. Type a program name instead, for example: calc",
                icon: "information",
              })
            }
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Browse...
          </button>
        </div>
      </div>
    </div>
  )
}
