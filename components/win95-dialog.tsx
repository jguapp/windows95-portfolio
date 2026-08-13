"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { play } from "@/lib/sound"
import { CloseIcon } from "./win95-controls"

/**
 * Windows 95 message boxes.
 *
 * The shell was calling the browser's alert(), which draws whatever the browser
 * feels like and pins it to the top of the screen with the page's origin
 * printed above it. A Windows 95 message box has a title bar, one of four
 * icons, the text, and a row of buttons at the bottom right, so that is what
 * this draws.
 *
 * The glyphs are SVG on a one-unit-per-pixel grid, the same approach as the
 * title-bar controls: no assets, no font dependency, and sharp at any zoom.
 */

export type DialogIcon = "information" | "warning" | "error" | "question"

const grid = {
  shapeRendering: "crispEdges" as const,
  "aria-hidden": true,
  focusable: false,
}

/** Circle approximated on the pixel grid, as a 16-colour bitmap would be. */
function DiscRows(colour: string, dark: string) {
  // Half-widths per row for a 30px disc, mirrored around the centre.
  const spans = [10, 8, 6, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1]
  const rows: React.ReactElement[] = []
  for (let i = 0; i < 30; i++) {
    const inset = spans[i < 15 ? i : 29 - i]
    rows.push(
      <rect key={`d${i}`} x={1 + inset} y={1 + i} width={28 - inset * 2} height={1} fill={colour} />,
    )
    // A darker pixel at each end gives the edge the anti-aliased look the
    // originals faked with a second palette entry.
    rows.push(<rect key={`l${i}`} x={inset} y={1 + i} width={1} height={1} fill={dark} />)
    rows.push(<rect key={`r${i}`} x={29 - inset} y={1 + i} width={1} height={1} fill={dark} />)
  }
  return rows
}

export function DialogGlyph({ icon, size = 32 }: { icon: DialogIcon; size?: number }) {
  if (icon === "warning") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" data-glyph={icon} {...grid}>
        {/* Triangle, drawn a row at a time so the edges stay hard. */}
        {Array.from({ length: 28 }, (_, i) => (
          <rect key={i} x={15 - i} y={2 + i} width={2 + i * 2} height={1} fill="#ffff00" />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <rect key={`e${i}`} x={14 - i} y={2 + i} width={1} height={1} fill="#000000" />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <rect key={`f${i}`} x={17 + i} y={2 + i} width={1} height={1} fill="#000000" />
        ))}
        <rect x={2} y={30} width={28} height={1} fill="#000000" />
        <rect x={15} y={11} width={2} height={11} fill="#000000" />
        <rect x={15} y={24} width={2} height={3} fill="#000000" />
      </svg>
    )
  }

  const face = icon === "error" ? "#c00000" : "#000080"
  const edge = icon === "error" ? "#800000" : "#000040"

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" data-glyph={icon} {...grid}>
      {DiscRows(face, edge)}
      {icon === "error" && (
        <>
          {/* A thick white cross, two pixels per step. */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={`a${i}`} x={10 + i} y={9 + i} width={3} height={2} fill="#ffffff" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={`b${i}`} x={21 - i} y={9 + i} width={3} height={2} fill="#ffffff" />
          ))}
        </>
      )}
      {icon === "information" && (
        <>
          <rect x={14} y={6} width={4} height={4} fill="#ffffff" />
          <rect x={13} y={12} width={5} height={3} fill="#ffffff" />
          <rect x={14} y={15} width={4} height={8} fill="#ffffff" />
          <rect x={12} y={23} width={8} height={3} fill="#ffffff" />
        </>
      )}
      {icon === "question" && (
        <>
          <rect x={11} y={8} width={10} height={3} fill="#ffffff" />
          <rect x={9} y={10} width={3} height={4} fill="#ffffff" />
          <rect x={20} y={10} width={3} height={5} fill="#ffffff" />
          <rect x={17} y={14} width={4} height={3} fill="#ffffff" />
          <rect x={14} y={16} width={4} height={5} fill="#ffffff" />
          <rect x={14} y={23} width={4} height={4} fill="#ffffff" />
        </>
      )}
    </svg>
  )
}

export interface MessageBoxRequest {
  title: string
  text: string
  icon?: DialogIcon
  /** Adds a Cancel button and resolves false when it is used. */
  cancel?: boolean
}

type Pending = MessageBoxRequest & { id: number; resolve: (ok: boolean) => void }

let queue: Pending[] = []
let nextId = 1
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getQueue = () => queue
const emptyQueue: Pending[] = []

/**
 * Shows a message box and resolves when it is dismissed.
 *
 * Callers can ignore the promise, which makes this a drop-in for the alert()
 * calls it replaces.
 */
export function messageBox(request: MessageBoxRequest): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...request, id: nextId++, resolve }]
    notify()
  })
}

const BUTTON =
  "min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white focus:outline focus:outline-1 focus:outline-dotted focus:outline-black"

/** Mounted once, near the root. Renders whichever box is at the front. */
export function MessageBoxHost() {
  const pending = useSyncExternalStore(subscribe, getQueue, () => emptyQueue)
  const current = pending[0]
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!current) return
    play(current.icon === "error" ? "lose" : "select")
  }, [current])

  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") close(true)
      if (e.key === "Escape") close(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  if (!mounted || !current) return null

  function close(ok: boolean) {
    const box = queue[0]
    if (!box) return
    queue = queue.slice(1)
    notify()
    box.resolve(ok)
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center" data-messagebox>
      <div
        className="win95-type min-w-[320px] max-w-[440px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
          <span className="px-1 font-bold">{current.title}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => close(false)}
            className="flex h-[16px] w-[16px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex items-start gap-4 px-5 py-5">
          {current.icon && <DialogGlyph icon={current.icon} />}
          <div className="flex-1 whitespace-pre-wrap pt-1">{current.text}</div>
        </div>

        <div className="flex justify-center gap-2 pb-4">
          <button type="button" autoFocus className={BUTTON} onClick={() => close(true)} data-ok>
            OK
          </button>
          {current.cancel && (
            <button type="button" className={BUTTON} onClick={() => close(false)} data-cancel>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
