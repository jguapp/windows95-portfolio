"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { CloseIcon } from "./win95-controls"
import { persistenceEnabled, setPersistenceEnabled } from "@/lib/persistence"

interface WelcomePopupProps {
  onClose: () => void
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  // null means "never dragged", which renders centred via CSS. Measuring the
  // popup in an effect instead would paint it at a stale coordinate for one
  // frame, which is what made it visibly jump in from the top-left.
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  /**
   * The footer checkbox: whether files, drawings and desktop items a visitor
   * makes are remembered by their browser. Off until they say otherwise;
   * toggling takes effect immediately, and turning it off clears what was
   * saved.
   */
  const [persist, setPersist] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    setPersist(persistenceEnabled())
  }, [])
  const [isVisible, setIsVisible] = useState(false)

  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Show welcome popup after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Ensure popup stays within viewport
      const maxX = window.innerWidth - 600 // Popup width
      const maxY = window.innerHeight - 300 // Approximate popup height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Centred until dragged, then pinned to explicit coordinates. `offset` nudges
  // the What's New panel down-right of the main one.
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
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    
    setIsDragging(true)
  }

  const handleOpenProjects = () => {
    onClose()
    // Open the projects window
    const event = new CustomEvent("openWindow", { detail: { id: "projects" } })
    window.dispatchEvent(event)
  }

  const handleOpenContact = () => {
    onClose()
    // Open the contact window
    const event = new CustomEvent("openWindow", { detail: { id: "contact" } })
    window.dispatchEvent(event)
  }

  const toggleWhatsNew = () => {
    setShowWhatsNew(!showWhatsNew)
  }

  return (
    <>
      {isVisible && (
        <div
          ref={popupRef}
          id="win95-popup"
          className="absolute flex max-h-[calc(100dvh-44px)] w-[600px] max-w-[calc(100vw-16px)] flex-col border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[1000]"
          style={panelStyle()}
        >
          <div
            className="win95-title-bar bg-[#000080] text-white p-[3px_5px] font-bold flex justify-between items-center"
            onMouseDown={startDrag}
          >
            <span className="text-xs">Welcome</span>
            <button
              className="w-4 h-4 shrink-0 bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer text-black flex items-center justify-center"
              aria-label="Close"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>

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
                      distributed systems, operating systems, and containerization. I'm also a huge fan of retro tech, so I
                      decided to create this portfolio based on <strong>Windows 95</strong>! Thank you for visiting,
                      and enjoy the experience!
                    </p>
                  </div>
                </div>
              </div>

              <div className="buttons-container flex flex-row flex-wrap gap-[10px] items-stretch sm:flex-col">
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer flex-1 min-w-[110px] sm:w-[120px] sm:flex-none hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                  onClick={toggleWhatsNew}
                >
                  What's <u>N</u>ew
                </button>
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer flex-1 min-w-[110px] sm:w-[120px] sm:flex-none hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                  onClick={handleOpenProjects}
                >
                  <u>L</u>atest Projects
                </button>
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer flex-1 min-w-[110px] sm:w-[120px] sm:flex-none hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                  onClick={handleOpenContact}
                >
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
            <button
              className="win95-button close-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer flex-1 min-w-[110px] sm:w-[120px] sm:flex-none hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showWhatsNew && (
        <div
          className="absolute flex max-h-[calc(100dvh-44px)] w-[400px] max-w-[calc(100vw-16px)] flex-col border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[1001]"
          style={panelStyle(50)}
        >
          <div
            className="win95-title-bar bg-[#000080] text-white p-[3px_5px] font-bold flex justify-between items-center"
            onMouseDown={startDrag}
          >
            <span className="text-xs">What's New</span>
            <button
              className="w-4 h-4 shrink-0 bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer text-black flex items-center justify-center"
              aria-label="Close What's New"
              onClick={toggleWhatsNew}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="win95-content min-h-0 flex-1 overflow-auto p-[10px_20px]">
            <h2 className="text-sm font-bold mb-2">Recent Updates</h2>
            <ul className="list-disc pl-5 text-xs mb-4">
              <li className="mb-1">CD Player, Phone Dialer, ScanDisk and Defrag stopped being stubs and became real programs</li>
              <li className="mb-1">Paint&apos;s Edit menu works: cut, copy, paste, flip, rotate, stretch, skew and a font picker</li>
              <li className="mb-1">Explorer got a clipboard, a Properties sheet, and Add/Remove Programs joined Control Panel</li>
              <li className="mb-1">Word&apos;s toolbar does what it says: fonts, sizes, columns, borders, styles and print preview</li>
              <li className="mb-1">ADVENTURE.EXE is now fourteen rooms, a two-word parser and a night shift with an ending</li>
              <li className="mb-1">Solitaire pays Vegas, FreeCell deals the joke hands, Hearts learns your name, Pong seats two</li>
              <li className="mb-1">Minesweeper gained Custom Field, Best Times, and both cheats it shipped with in 1995</li>
              <li className="mb-1">Chess plays real move recordings, and the guestbook can be moderated by its owner</li>
              <li className="mb-1">Start &gt; Documents remembers what you opened, and F1 opens help for whatever is focused</li>
              <li className="mb-1">The battle HUD was rebuilt: capsule HP gauges, centred names, and arrows that all work</li>
            </ul>

            <h2 className="text-sm font-bold mb-2">Planned Features</h2>
            <ul className="list-disc pl-5 text-xs">
              <li className="mb-1">Stacked Up Summit 2026 photos in the gallery</li>
              <li className="mb-1">Shell sort joining the sorting visualiser race</li>
              <li className="mb-1">A Briefcase that actually syncs between two folders on the C:\ drive</li>
              <li className="mb-1">Solitaire&apos;s draw-three option, and Minesweeper&apos;s best times split by board size</li>
              <li className="mb-1">Notepad&apos;s Find and Replace, and Word Wrap that remembers its setting</li>
            </ul>
          </div>

          <div className="win95-footer flex justify-end items-center border-t border-t-[#808080] p-[10px] bg-[#c0c0c0]">
            <button
              className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
              onClick={toggleWhatsNew}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
