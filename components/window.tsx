"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { play } from "@/lib/sound"
import { useNarrowScreen } from "@/lib/use-narrow-screen"
import AboutMe from "./window-content/about-me"
import Resume from "./window-content/resume"
import RetroYoutube from "./window-content/retro-youtube"
import Contact from "./window-content/contact"
import Gallery from "./window-content/gallery"
import Games from "./window-content/games"
import Paint from "./window-content/paint"
import Calculator from "./window-content/calculator"
import Guestbook from "./window-content/guestbook"
import Notepad from "./window-content/notepad"
import MsDos from "./window-content/ms-dos"
import Explorer from "./window-content/explorer"
import RecycleBinWindow from "./window-content/recycle-bin"
import PatchNotes from "./window-content/patch-notes"
import InternetExplorer from "./window-content/internet-explorer"
import StubApp, { STUB_PROGRAMS } from "./window-content/stub-app"
import FindFiles from "./window-content/find-files"
import SoundProperties from "./window-content/sound-properties"
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "./win95-controls"
import { windowIcon, windowTitle } from "@/lib/window-titles"

// Shared by the three title-bar controls: a 16px Win95 button with the glyph
// centred. flex centring replaces the old line-height trick, which could not
// hold the glyph in place once globals.css forced the font size to 1.2rem.
const controlButtonClass =
  "w-4 h-4 shrink-0 bg-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] cursor-pointer text-black p-0 flex items-center justify-center hover:bg-[#dfdfdf] active:shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff]"

type Point = { x: number; y: number }
type Size = { width: number; height: number }
type Rect = Point & Size

/** Eight grips: four edges and four corners. */
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

const EDGES: ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"]

const TASKBAR_HEIGHT = 34
const DEFAULT_MIN: Size = { width: 320, height: 200 }

/** Windows that cannot be maximised, as their originals could not. The real
 *  Calculator had no maximise button at all: the keypad is a fixed slab and
 *  a full screen of it means nothing. */
/** Windows whose maximise button is present but disabled, drawn in grey the
 *  way Windows 95 disabled a control instead of hiding it. */
const NEVER_MAXIMIZE = new Set(["calculator"])

/** The games and editors draw to fixed boards, so they get a floor that keeps
 *  the board intact rather than letting the window crop it. */
const MIN_SIZE: Record<string, Size> = {
  guestbook: { width: 420, height: 380 },
  games: { width: 560, height: 400 },
  paint: { width: 560, height: 420 },
  resume: { width: 640, height: 460 },
  projects: { width: 620, height: 440 },
  contact: { width: 560, height: 400 },
  gallery: { width: 520, height: 380 },
  calculator: { width: 300, height: 290 },
  notepad: { width: 400, height: 300 },
  msdos: { width: 420, height: 280 },
  explorer: { width: 520, height: 340 },
  "recycle-bin": { width: 420, height: 260 },
}

const DEFAULT_SIZE: Record<string, Size> = {
  guestbook: { width: 600, height: 640 },
  calculator: { width: 316, height: 304 },
  notepad: { width: 620, height: 480 },
  msdos: { width: 660, height: 420 },
  explorer: { width: 720, height: 460 },
  "recycle-bin": { width: 560, height: 340 },
  resume: { width: 1180, height: 660 },
  projects: { width: 760, height: 580 },
  paint: { width: 720, height: 560 },
  contact: { width: 740, height: 580 },
  gallery: { width: 800, height: 600 },
  games: { width: 900, height: 680 },
  "patch-notes": { width: 640, height: 560 },
  "internet-explorer": { width: 780, height: 580 },
  "find-files": { width: 620, height: 460 },
  "sound-properties": { width: 380, height: 470 },
  wordpad: { width: 460, height: 340 },
  charmap: { width: 460, height: 340 },
  mediaplayer: { width: 460, height: 340 },
  soundrec: { width: 460, height: 340 },
  cdplayer: { width: 460, height: 340 },
  phonedialer: { width: 460, height: 340 },
  hyperterm: { width: 460, height: 340 },
  scandisk: { width: 460, height: 340 },
  defrag: { width: 460, height: 340 },
}

const CURSOR: Record<ResizeEdge, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
}

/** Grip hit areas, 4px along each edge and 8px square at each corner. */
const GRIP_STYLE: Record<ResizeEdge, React.CSSProperties> = {
  n: { top: -2, left: 8, right: 8, height: 6 },
  s: { bottom: -2, left: 8, right: 8, height: 6 },
  w: { left: -2, top: 8, bottom: 8, width: 6 },
  e: { right: -2, top: 8, bottom: 8, width: 6 },
  nw: { top: -2, left: -2, width: 10, height: 10 },
  ne: { top: -2, right: -2, width: 10, height: 10 },
  sw: { bottom: -2, left: -2, width: 10, height: 10 },
  se: { bottom: -2, right: -2, width: 10, height: 10 },
}

interface WindowProps {
  id: string
  isActive: boolean
  isMinimized: boolean
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
}

export default function Window({ id, isActive, isMinimized, onClose, onMinimize, onFocus }: WindowProps) {
  const [position, setPosition] = useState({ x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 })
  const [size, setSize] = useState<Size>(() => DEFAULT_SIZE[id] ?? { width: 650, height: 500 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge | null>(null)

  const windowRef = useRef<HTMLDivElement>(null)
  /** Captured on the way into maximise so Restore returns to the same rect. */
  const restoreRect = useRef<Rect | null>(null)
  /** Pointer and window rect at mousedown. A resize is computed from where the
   *  drag began rather than accumulated frame to frame, so it cannot drift. */
  const resizeStart = useRef<{ pointer: Point; rect: Rect } | null>(null)

  const minSize = MIN_SIZE[id] ?? DEFAULT_MIN

  // Handle window content based on ID
  const renderContent = () => {
    switch (id) {
      case "about-me":
        return <AboutMe />
      case "resume":
        return <Resume />
      case "projects":
        return <RetroYoutube />
      case "contact":
        return <Contact />
      case "gallery":
        return <Gallery />
      case "games":
        return <Games />
      case "paint":
        return <Paint />
      case "calculator":
        return <Calculator />
      case "notepad":
        return <Notepad />
      case "msdos":
        return <MsDos />
      case "explorer":
        return <Explorer />
      case "recycle-bin":
        return <RecycleBinWindow />
      case "guestbook":
        return <Guestbook />
      case "patch-notes":
        return <PatchNotes />
      case "internet-explorer":
        return <InternetExplorer />
      case "find-files":
        return <FindFiles />
      case "sound-properties":
        return <SoundProperties />
      default: {
        // The Windows 95 program set: stubs with the right icon and a line
        // about what each was.
        const stub = STUB_PROGRAMS.find((prog) => prog.id === id)
        if (stub) return <StubApp program={stub} />
        return <div>Content not available</div>
      }
    }
  }

  // Start dragging the window
  const startDrag = (e: React.MouseEvent) => {
    if (isMaximized) return

    e.preventDefault()
    onFocus()

    setIsDragging(true)
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  // Start a resize from one of the eight grips.
  const startResize = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    if (isMaximized) return
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    resizeStart.current = {
      pointer: { x: e.clientX, y: e.clientY },
      rect: { ...position, ...size },
    }
    setResizeEdge(edge)
  }

  // Handle window resizing
  useEffect(() => {
    if (!resizeEdge) return

    const onMove = (e: MouseEvent) => {
      const start = resizeStart.current
      if (!start) return

      const { pointer, rect } = start
      const dx = e.clientX - pointer.x
      const dy = e.clientY - pointer.y
      const maxHeight = window.innerHeight - TASKBAR_HEIGHT

      let { x, y, width, height } = rect

      // A north or west grip moves the origin as well as the size, so the
      // opposite edge stays where it is.
      if (resizeEdge.includes("e")) width = rect.width + dx
      if (resizeEdge.includes("w")) {
        width = rect.width - dx
        x = rect.x + dx
      }
      if (resizeEdge.includes("s")) height = rect.height + dy
      if (resizeEdge.includes("n")) {
        height = rect.height - dy
        y = rect.y + dy
      }

      // Clamp to the minimum, pinning the origin so the far edge holds still.
      if (width < minSize.width) {
        if (resizeEdge.includes("w")) x = rect.x + (rect.width - minSize.width)
        width = minSize.width
      }
      if (height < minSize.height) {
        if (resizeEdge.includes("n")) y = rect.y + (rect.height - minSize.height)
        height = minSize.height
      }

      // Keep the window on screen and above the taskbar.
      if (x < 0) {
        width = Math.max(minSize.width, width + x)
        x = 0
      }
      if (y < 0) {
        height = Math.max(minSize.height, height + y)
        y = 0
      }
      width = Math.max(minSize.width, Math.min(width, window.innerWidth - x))
      height = Math.max(minSize.height, Math.min(height, maxHeight - y))

      setSize({ width, height })
      setPosition({ x, y })
    }

    const onUp = () => {
      setResizeEdge(null)
      resizeStart.current = null
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [resizeEdge, minSize.width, minSize.height])

  // Handle window dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Ensure window stays within viewport
      const maxX = window.innerWidth - size.width
      const maxY = window.innerHeight - size.height - 34 // Account for taskbar

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, size.width, size.height])

  // Toggle maximize state
  // A window makes a sound when it appears. Windows are mounted when they open
  // and unmounted when they close, so mounting is the moment.
  useEffect(() => {
    play("windowOpen")
  }, [])

  /*
    The shell wants to know which windows are maximised: the assistant hides
    behind a full-screen window but stays beside a floating one. Announced as
    an event because maximise state lives here, per window, and lifting it
    would thread one boolean through everything.
  */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("windowMaximized", { detail: { id, maximized: isMaximized && !isMinimized } }),
    )
  }, [id, isMaximized, isMinimized])

  useEffect(
    () => () => {
      window.dispatchEvent(new CustomEvent("windowMaximized", { detail: { id, maximized: false } }))
    },
    [id],
  )

  /*
    On a phone the window manager gets out of the way.

    There is nowhere to drag a window to, no second window worth showing at
    once, and no grip small enough to resize with a thumb. So a window fills
    the screen above the taskbar and stays there: the content is the point,
    not the chrome around it.
  */
  const narrow = useNarrowScreen()
  useEffect(() => {
    if (narrow) setIsMaximized(true)
  }, [narrow])

  const toggleMaximize = () => {
    play(isMaximized ? "minimize" : "maximize")
    setIsMaximized((wasMaximized) => {
      if (wasMaximized) {
        // Restore to the rect the window had before it was maximised.
        const saved = restoreRect.current
        if (saved) {
          setPosition({ x: saved.x, y: saved.y })
          setSize({ width: saved.width, height: saved.height })
        }
      } else {
        restoreRect.current = { ...position, ...size }
      }
      return !wasMaximized
    })
  }

  // Listen for window action events
  useEffect(() => {
    const handleWindowAction = (event: CustomEvent) => {
      const { action, id: windowId } = event.detail

      if (windowId === id && action === "maximize") {
        setIsMaximized((prev) => !prev)
      }

      // Some apps are a fixed slab and know their own size. Calculator resized
      // itself when you switched between Standard and Scientific, so it asks
      // for the size it needs rather than being stretched to the window.
      if (windowId === id && action === "resize" && event.detail.size) {
        const want = event.detail.size as Size
        setIsMaximized(false)
        setSize({
          width: Math.max(want.width, minSize.width),
          height: Math.max(want.height, minSize.height),
        })
      }
    }

    window.addEventListener("windowAction", handleWindowAction as EventListener)

    return () => {
      window.removeEventListener("windowAction", handleWindowAction as EventListener)
    }
  }, [id, minSize.height, minSize.width])

  if (isMinimized) {
    return null
  }

  return (
    <div
      ref={windowRef}
      id={`window-${id}`}
      className={`window absolute border-2 border-solid border-black z-[100] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080,2px_2px_#000000] flex flex-col text-xs text-black ${
        isMaximized ? "w-full h-[calc(100vh-34px)] top-0 left-0" : ""
      }`}
      style={{
        top: isMaximized ? 0 : `${position.y}px`,
        left: isMaximized ? 0 : `${position.x}px`,
        width: isMaximized ? "100%" : `${size.width}px`,
        height: isMaximized ? "calc(100vh - 34px)" : `${size.height}px`,
        zIndex: isActive ? 200 : 100,
      }}
      onClick={onFocus}
    >
      {/* Only show the window header if it's not the resume window */}
      {id !== "resume" && (
        <div
          className="window-header bg-[#000080] p-[5px] flex justify-between items-center border-b-2 border-b-black text-white font-bold"
          onMouseDown={startDrag}
          onDoubleClick={toggleMaximize}
        >
          {/* Windows 95 put the application's 16px icon at the left of every
              title bar, which is also what you double-click to close. */}
          <h1 className="text-sm m-0 flex items-center gap-[5px] p-[0_2px]">
            {windowIcon(id) && (
              <img
                src={windowIcon(id)}
                alt=""
                data-title-icon
                className="h-4 w-4 shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            {windowTitle(id)}
          </h1>
          <div className="controls flex gap-[5px]">
            <button
              className={controlButtonClass}
              aria-label="Minimize"
              onClick={(e) => {
                e.stopPropagation()
                play("minimize")
                onMinimize()
              }}
            >
              <MinimizeIcon />
            </button>
            {!narrow && (
            <button
              className={`${controlButtonClass} disabled:text-[#808080]`}
              aria-label={isMaximized ? "Restore" : "Maximize"}
              disabled={NEVER_MAXIMIZE.has(id)}
              onClick={(e) => {
                e.stopPropagation()
                toggleMaximize()
              }}
            >
              <MaximizeIcon />
            </button>
          )}
            <button
              className={controlButtonClass}
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation()
                play("windowClose")
                onClose()
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
      <div
        className={`window-content flex-grow ${id !== "resume" ? "p-0 bg-white border-0" : ""} overflow-auto text-xs leading-[1.4] text-black`}
        style={{ height: id === "resume" ? "100%" : "auto" }}
      >
        {renderContent()}
      </div>

      {/* Resize grips. Maximised windows are fixed, as in Windows 95. */}
      {!isMaximized &&
        EDGES.map((edge) => (
          <div
            key={edge}
            aria-hidden="true"
            onMouseDown={startResize(edge)}
            style={{ position: "absolute", cursor: CURSOR[edge], zIndex: 10, ...GRIP_STYLE[edge] }}
          />
        ))}
    </div>
  )
}
