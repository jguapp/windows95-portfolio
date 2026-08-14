"use client"

import { useEffect, useState } from "react"

/**
 * Shut Down, done properly.
 *
 * The Start menu used to call window.close(), which browsers ignore, and then
 * apologise in a message box. Windows 95 asked what you wanted, dimmed the
 * desktop, and ended on the amber "It's now safe to turn off your computer"
 * screen, which is one of the most recognisable things it ever drew.
 *
 * Restart reloads the page, which runs the boot sequence again: the closest a
 * browser tab gets to a warm boot. The final screen offers the same reload on
 * a click, because unlike a real machine there is no power switch to reach.
 */
interface ShutdownProps {
  onCancel: () => void
}

type Phase = "ask" | "closing" | "off"

export default function Shutdown({ onCancel }: ShutdownProps) {
  const [phase, setPhase] = useState<Phase>("ask")
  const [choice, setChoice] = useState<"shutdown" | "restart">("shutdown")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "ask") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel, phase])

  const go = () => {
    setPhase("closing")
    setTimeout(() => {
      if (choice === "restart") {
        window.location.reload()
      } else {
        setPhase("off")
      }
    }, 1400)
  }

  if (phase === "off") {
    return (
      <button
        type="button"
        data-shutdown-off
        onClick={() => window.location.reload()}
        className="fixed inset-0 z-[3000] block h-full w-full cursor-pointer bg-black text-center"
      >
        <span
          className="text-[28px] font-bold leading-snug"
          style={{ color: "#ffa500", fontFamily: '"Courier New", monospace', textShadow: "0 0 8px rgba(255,165,0,0.5)" }}
        >
          It&apos;s now safe to turn off
          <br />
          your computer.
        </span>
        <span className="mt-8 block text-[13px] text-[#804000]">(or click to turn it back on)</span>
      </button>
    )
  }

  if (phase === "closing") {
    return (
      <div data-shutdown-closing className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#008080]">
        <span
          className="text-[22px] font-bold text-white"
          style={{ fontFamily: '"MS Sans Serif", sans-serif', textShadow: "1px 1px 0 #000000" }}
        >
          Windows is shutting down...
        </span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40">
      <div
        data-shutdown
        className="win95-type w-[330px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_8px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex items-center bg-[#000080] px-2 py-[2px] text-white">
          <span className="font-bold">Shut Down Windows</span>
        </div>

        <div className="flex gap-3 p-4">
          {/* The moon-and-monitor glyph, drawn rather than shipped. */}
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden shapeRendering="crispEdges">
            <rect x="2" y="4" width="22" height="16" fill="#008080" stroke="#000000" />
            <rect x="4" y="6" width="18" height="12" fill="#000040" />
            <rect x="9" y="20" width="8" height="2" fill="#c0c0c0" stroke="#000000" />
            <rect x="6" y="22" width="14" height="3" fill="#c0c0c0" stroke="#000000" />
            <path d="M28 10 A7 7 0 1 1 20 3 A6 6 0 0 0 28 10" fill="#ffff00" stroke="#808000" />
          </svg>
          <div className="flex-1">
            <p className="mb-3">What do you want the computer to do?</p>
            <label className="flex items-center gap-2 py-[2px]">
              <input
                type="radio"
                name="shutdown"
                checked={choice === "shutdown"}
                onChange={() => setChoice("shutdown")}
              />
              <span>
                <span className="underline">S</span>hut down the computer
              </span>
            </label>
            <label className="flex items-center gap-2 py-[2px]">
              <input
                type="radio"
                name="shutdown"
                checked={choice === "restart"}
                onChange={() => setChoice("restart")}
              />
              <span>
                <span className="underline">R</span>estart the computer
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={go}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}
