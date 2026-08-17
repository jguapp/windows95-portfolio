"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { CloseIcon } from "./win95-controls"
import { persistenceEnabled, setPersistenceEnabled } from "@/lib/persistence"

interface WelcomePopupProps {
  onClose: () => void
}

/** What's New content, kept as data so the panel is markup and nothing else. */
const RECENT_UPDATES = [
  "CD Player, Phone Dialer, ScanDisk and Defrag stopped being stubs and became real programs",
  "Paint's Edit menu works: cut, copy, paste, flip, rotate, stretch, skew and a font picker",
  "Explorer got a clipboard, a Properties sheet, and Add/Remove Programs joined Control Panel",
  "Word's toolbar does what it says: fonts, sizes, columns, borders, styles and print preview",
  "ADVENTURE.EXE is now fourteen rooms, a two-word parser and a night shift with an ending",
  "Solitaire pays Vegas, FreeCell deals the joke hands, Hearts learns your name, Pong seats two",
  "Minesweeper gained Custom Field, Best Times, and both cheats it shipped with in 1995",
  "Chess plays real move recordings, and the guestbook can be moderated by its owner",
  "Start > Documents remembers what you opened, and F1 opens help for whatever is focused",
  "The battle HUD was rebuilt: capsule HP gauges, centred names, and arrows that all work",
]

const PLANNED_FEATURES = [
  "Stacked Up Summit 2026 photos in the gallery",
  "Shell sort joining the sorting visualiser race",
  "A Briefcase that actually syncs between two folders on the C:\\ drive",
  "Solitaire's draw-three option, and Minesweeper's best times split by board size",
  "Notepad's Find and Replace, and Word Wrap that remembers its setting",
]

/** The raised grey button, and the wide variant the main panel's row uses. */
const BUTTON =
  "win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
const BUTTON_WIDE = `${BUTTON} flex-1 min-w-[110px] sm:w-[120px] sm:flex-none`

/** The bevelled panel frame both windows share; width differs, nothing else. */
const PANEL =
  "absolute flex max-h-[calc(100dvh-44px)] max-w-[calc(100vw-16px)] flex-col border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"

/**
 * Dragging for the pair of panels, which move as one.
 *
 * null means "never dragged", which renders centred via CSS. Measuring the
 * popup in an effect instead would paint it at a stale coordinate for one
 * frame, which is what made it visibly jump in from the top-left.
 */
function usePanelDrag(popupRef: React.RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      // Ensure popup stays within viewport
      const maxX = window.innerWidth - 600 // Popup width
      const maxY = window.innerHeight - 300 // Approximate popup height
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, maxX)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, maxY)),
      })
    }
    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Centred until dragged, then pinned to explicit coordinates. `offset`
  // nudges the What's New panel down-right of the main one.
  const panelStyle = (offset = 0): React.CSSProperties =>
    position
      ? { left: `${position.x + offset}px`, top: `${position.y + offset}px` }
      : {
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px))`,
        }

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    setIsDragging(true)
  }

  return { panelStyle, startDrag }
}

/** The navy title bar with its close button, shared by both panels. */
function PanelTitleBar({
  title,
  closeLabel,
  onDrag,
  onClose,
}: {
  title: string
  closeLabel: string
  onDrag: (e: React.MouseEvent) => void
  onClose: () => void
}) {
  return (
    <div
      className="win95-title-bar bg-[#000080] text-white p-[3px_5px] font-bold flex justify-between items-center"
      onMouseDown={onDrag}
    >
      <span className="text-xs">{title}</span>
      <button
        className="w-4 h-4 shrink-0 bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer text-black flex items-center justify-center"
        aria-label={closeLabel}
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

/**
 * The footer checkbox: whether files, drawings and desktop items a visitor
 * makes are remembered by their browser. Off until they say otherwise;
 * toggling takes effect immediately, and turning it off clears what was
 * saved. Owns its state entirely, since nothing else reads it.
 */
function PersistToggle() {
  const [persist, setPersist] = useState(false)
  useEffect(() => {
    setPersist(persistenceEnabled())
  }, [])

  return (
    <label className="flex items-center text-[10px] text-black cursor-pointer" data-persist-toggle>
      <div
        className="relative w-[13px] h-[13px] bg-white border border-[#808080] mr-[5px]"
        onClick={() => {
          const next = !persist
          setPersist(next)
          setPersistenceEnabled(next)
        }}
      >
        {persist && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black text-[10px] leading-none">✓</span>
          </div>
        )}
      </div>
      <span>
        <u>R</u>emember my files and desktop changes on this computer
      </span>
    </label>
  )
}

/** The secondary panel: recent updates and what is planned. */
function WhatsNewPanel({
  style,
  onDrag,
  onClose,
}: {
  style: React.CSSProperties
  onDrag: (e: React.MouseEvent) => void
  onClose: () => void
}) {
  return (
    <div className={`${PANEL} w-[400px] z-[1001]`} style={style}>
      <PanelTitleBar title="What's New" closeLabel="Close What's New" onDrag={onDrag} onClose={onClose} />

      <div className="win95-content min-h-0 flex-1 overflow-auto p-[10px_20px]">
        <h2 className="text-sm font-bold mb-2">Recent Updates</h2>
        <ul className="list-disc pl-5 text-xs mb-4">
          {RECENT_UPDATES.map((line) => (
            <li key={line} className="mb-1">
              {line}
            </li>
          ))}
        </ul>

        <h2 className="text-sm font-bold mb-2">Planned Features</h2>
        <ul className="list-disc pl-5 text-xs">
          {PLANNED_FEATURES.map((line) => (
            <li key={line} className="mb-1">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="win95-footer flex justify-end items-center border-t border-t-[#808080] p-[10px] bg-[#c0c0c0]">
        <button className={BUTTON} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const { panelStyle, startDrag } = usePanelDrag(popupRef)

  useEffect(() => {
    // Show welcome popup after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  /** Closes the popup and opens a program in its place. */
  const openInstead = (id: string) => {
    onClose()
    window.dispatchEvent(new CustomEvent("openWindow", { detail: { id } }))
  }

  const toggleWhatsNew = () => setShowWhatsNew((v) => !v)

  return (
    <>
      {isVisible && (
        <div ref={popupRef} id="win95-popup" className={`${PANEL} w-[600px] z-[1000]`} style={panelStyle()}>
          <PanelTitleBar title="Welcome" closeLabel="Close" onDrag={startDrag} onClose={onClose} />

          <div className="win95-content min-h-0 flex-1 overflow-auto p-[10px_12px] sm:p-[10px_20px]">
            <h1 className="text-base text-black mb-[15px] font-bold">Welcome to My Portfolio!</h1>

            <div className="info-container flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-5">
              <div className="info-box flex-1 border border-inset border-[#808080] bg-[#ffffe0] p-[10px] text-black leading-[1.4]">
                <div className="info-content flex items-start gap-[10px]">
                  <Image
                    src="/images/blob/garfield.png"
                    alt="Garfield icon"
                    width={64}
                    height={64}
                    className="mt-[5px]"
                    // Tailwind's preflight sets height:auto on every image,
                    // which changes one dimension and not the other and makes
                    // next/image complain. Pinning both settles it.
                    style={{ width: 64, height: 64, imageRendering: "pixelated" }}
                  />
                  <div className="info-text flex-1 leading-[1.4] text-xs">
                    <p className="mt-[5px]">
                      <strong>Hi there...</strong>
                    </p>
                    <p className="mt-3">
                      I'm Joel, a Computer Science student focused on backend and infrastructure engineering —
                      distributed systems, operating systems, and containerization. I'm also a huge fan of retro tech, so
                      I decided to create this portfolio based on <strong>Windows 95</strong>! Thank you for visiting,
                      and enjoy the experience!
                    </p>
                  </div>
                </div>
              </div>

              <div className="buttons-container flex flex-row flex-wrap gap-[10px] items-stretch sm:flex-col">
                <button className={BUTTON_WIDE} onClick={toggleWhatsNew}>
                  What's <u>N</u>ew
                </button>
                <button className={BUTTON_WIDE} onClick={() => openInstead("projects")}>
                  <u>L</u>atest Projects
                </button>
                <button className={BUTTON_WIDE} onClick={() => openInstead("contact")}>
                  Contact <u>M</u>e
                </button>
              </div>
            </div>

            <div className="mt-4 border border-[#808080] bg-[#ffffcc] p-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-base font-bold">💡</span>
                <p>
                  <strong>Tip:</strong> Try the Konami code on the desktop! (↑ ↑ ↓ ↓ ← → ← → B A)
                </p>
              </div>
            </div>
          </div>

          <div className="win95-footer flex justify-between items-center border-t border-t-[#808080] p-[10px_20px] bg-[#c0c0c0] text-[10px]">
            <PersistToggle />
            <button className={`close-button ${BUTTON_WIDE}`} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}

      {showWhatsNew && <WhatsNewPanel style={panelStyle(50)} onDrag={startDrag} onClose={toggleWhatsNew} />}
    </>
  )
}
