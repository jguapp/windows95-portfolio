"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Windows 95 Notepad.
 *
 * Word Wrap is off by default, as it was, which is why the textarea scrolls
 * horizontally until you turn it on. F5 stamps the time and date. The Find
 * dialog matches the original's shape: a text field, Match case, a direction
 * group, and Find Next / Cancel.
 */

const DEFAULT_TEXT = `Welcome to my portfolio.

This whole desktop is a Next.js application: every window, the Start menu,
the drag-and-drop, the games. Nothing here is a screenshot.

Things worth opening:

  Resume      opens in Microsoft Word 95
  My Projects opens YouTube, circa 2005
  Contact Me  opens Outlook Express
  Games       Chess, Solitaire, Tetris, Minesweeper and Pong
  Paint       it draws, and it saves

Try the Konami code on the desktop.

- Joel
`

function stamp(): string {
  const d = new Date()
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  return `${time} ${date}`
}

export default function Notepad() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [wordWrap, setWordWrap] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [findTerm, setFindTerm] = useState("")
  const [matchCase, setMatchCase] = useState(false)
  const [direction, setDirection] = useState<"up" | "down">("down")
  const [notFound, setNotFound] = useState(false)
  const [fileName, setFileName] = useState("Readme.txt")

  const areaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = useCallback((value: string) => {
    const el = areaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    setText((prev) => prev.slice(0, start) + value + prev.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + value.length
    })
  }, [])

  const findNext = useCallback(() => {
    const el = areaRef.current
    if (!el || !findTerm) return
    const haystack = matchCase ? text : text.toLowerCase()
    const needle = matchCase ? findTerm : findTerm.toLowerCase()

    let index: number
    if (direction === "down") {
      index = haystack.indexOf(needle, el.selectionEnd)
    } else {
      index = haystack.lastIndexOf(needle, Math.max(0, el.selectionStart - 1))
    }

    if (index === -1) {
      setNotFound(true)
      return
    }
    setNotFound(false)
    el.focus()
    el.setSelectionRange(index, index + needle.length)
  }, [direction, findTerm, matchCase, text])

  // F5 stamps time and date; Ctrl+F opens Find, as in the original.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault()
        insertAtCursor(stamp())
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault()
        setFindOpen(true)
      } else if (e.key === "F3") {
        e.preventDefault()
        findNext()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [findNext, insertAtCursor])

  const selectAll = () => areaRef.current?.select()

  const menus: Record<string, { label: string; action: () => void; checked?: boolean; separator?: boolean }[]> = {
    File: [
      {
        label: "New",
        action: () => {
          setText("")
          setFileName("Untitled")
        },
      },
      { label: "Open...", action: () => alert("Open is not wired to the file system yet.") },
      { label: "Save", action: () => alert(`Saved ${fileName}.`) },
      { label: "Save As...", action: () => alert("Save As is not wired to the file system yet.") },
      { label: "Page Setup...", action: () => {}, separator: true },
      { label: "Print", action: () => window.print() },
      { label: "Exit", action: () => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "notepad" } })), separator: true },
    ],
    Edit: [
      { label: "Undo", action: () => document.execCommand("undo") },
      { label: "Cut", action: () => document.execCommand("cut"), separator: true },
      { label: "Copy", action: () => document.execCommand("copy") },
      { label: "Paste", action: () => document.execCommand("paste") },
      { label: "Delete", action: () => insertAtCursor("") },
      { label: "Select All", action: selectAll, separator: true },
      { label: "Time/Date\tF5", action: () => insertAtCursor(stamp()) },
      { label: "Word Wrap", action: () => setWordWrap((v) => !v), checked: wordWrap, separator: true },
    ],
    Search: [
      { label: "Find...", action: () => setFindOpen(true) },
      { label: "Find Next\tF3", action: findNext },
    ],
    Help: [{ label: "About Notepad", action: () => alert("Notepad\n\nWindows 95 recreation.") }],
  }

  const lineCol = (() => {
    const el = areaRef.current
    if (!el) return { ln: 1, col: 1 }
    const upto = text.slice(0, el.selectionStart)
    const lines = upto.split("\n")
    return { ln: lines.length, col: lines[lines.length - 1].length + 1 }
  })()

  return (
    <div className="flex h-full w-full flex-col bg-[#c0c0c0]" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      {/* Menu bar */}
      <div className="flex border-b border-[#808080] px-1" onMouseLeave={() => setOpenMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] text-xs ${openMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenMenu(openMenu === name ? null : name)}
              onMouseEnter={() => openMenu && setOpenMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[190px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <div key={item.label}>
                    {item.separator && <div className="my-1 border-t border-[#808080] border-b border-b-white" />}
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-[2px] text-left text-xs hover:bg-[#000080] hover:text-white"
                      onClick={() => {
                        item.action()
                        setOpenMenu(null)
                      }}
                    >
                      <span className="flex items-center">
                        <span className="mr-2 w-3">{item.checked ? "✓" : ""}</span>
                        {item.label.split("\t")[0]}
                      </span>
                      {item.label.includes("\t") && <span className="ml-6 opacity-70">{item.label.split("\t")[1]}</span>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Document */}
      <textarea
        ref={areaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        wrap={wordWrap ? "soft" : "off"}
        className="flex-1 resize-none border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-1 text-black outline-none"
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          lineHeight: 1.25,
          whiteSpace: wordWrap ? "pre-wrap" : "pre",
          overflowX: wordWrap ? "hidden" : "auto",
        }}
      />

      {/* Status bar */}
      <div className="flex items-center justify-end gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[2px] text-xs">
        <span>
          Ln {lineCol.ln}, Col {lineCol.col}
        </span>
      </div>

      {/* Find dialog */}
      {findOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-10">
          <div className="w-[340px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
              <span className="text-xs font-bold">Find</span>
              <button
                type="button"
                aria-label="Close"
                className="h-4 w-4 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-[10px] leading-none text-black"
                onClick={() => setFindOpen(false)}
              >
                x
              </button>
            </div>
            <div className="p-3">
              <div className="mb-3 flex items-center gap-2">
                <label className="text-xs">
                  Fi<span className="underline">n</span>d what:
                </label>
                <input
                  type="text"
                  autoFocus
                  aria-label="Find what"
                  value={findTerm}
                  onChange={(e) => {
                    setFindTerm(e.target.value)
                    setNotFound(false)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && findNext()}
                  className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 text-xs outline-none"
                />
              </div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={matchCase} onChange={() => setMatchCase((v) => !v)} />
                  Match <span className="underline">c</span>ase
                </label>
                <fieldset className="border border-[#808080] px-2 pb-1">
                  <legend className="px-1 text-xs">Direction</legend>
                  <label className="mr-3 text-xs">
                    <input
                      type="radio"
                      checked={direction === "up"}
                      onChange={() => setDirection("up")}
                      className="mr-1"
                    />
                    Up
                  </label>
                  <label className="text-xs">
                    <input
                      type="radio"
                      checked={direction === "down"}
                      onChange={() => setDirection("down")}
                      className="mr-1"
                    />
                    Down
                  </label>
                </fieldset>
              </div>
              {notFound && <p className="mb-2 text-xs">Cannot find &quot;{findTerm}&quot;</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={findNext}
                  className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  Find Next
                </button>
                <button
                  type="button"
                  onClick={() => setFindOpen(false)}
                  className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
