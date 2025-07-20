"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import AboutMe from "./window-content/about-me"
import Resume from "./window-content/resume"
import RetroYoutube from "./window-content/retro-youtube"
import Contact from "./window-content/contact"
import Gallery from "./window-content/gallery"
import Games from "./window-content/games"
import Paint from "./window-content/paint"

interface WindowProps {
  id: string
  isActive: boolean
  isMinimized: boolean
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFocus: () => void
}

export default function Window({ id, isActive, isMinimized, onClose, onMinimize, onMaximize, onFocus }: WindowProps) {
  const [position, setPosition] = useState({ x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 })
  const [size, setSize] = useState({ width: 650, height: 500 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const windowRef = useRef<HTMLDivElement>(null)

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
      default:
        return <div>Content not available</div>
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

  // Direct maximize function
  const maximizeWindow = () => {
    setIsMaximized(true)
    onMaximize()
  }

  // Direct restore function
  const restoreWindow = () => {
    setIsMaximized(false)
    onMaximize()
  }

  // Toggle maximize state
  const toggleMaximize = () => {
    console.log("Toggle maximize called, current state:", isMaximized)
    setIsMaximized(!isMaximized)
  }

  // Listen for window action events
  useEffect(() => {
    const handleWindowAction = (event: CustomEvent) => {
      const { action, id: windowId } = event.detail
      console.log("Window action received:", action, windowId, id)

      if (windowId === id && action === "maximize") {
        console.log("Maximizing window:", id)
        setIsMaximized((prev) => !prev)
      }
    }

    window.addEventListener("windowAction", handleWindowAction as EventListener)

    return () => {
      window.removeEventListener("windowAction", handleWindowAction as EventListener)
    }
  }, [id])

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
        >
          <h1 className="text-sm m-0 p-[0_5px]">
            {id === "spotify"
              ? "Windows Media Player"
              : id
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
          </h1>
          <div className="controls flex gap-[5px]">
            <button
              className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[10px] text-center font-bold leading-3 p-0 hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
              onClick={(e) => {
                e.stopPropagation()
                onMinimize()
              }}
            >
              −
            </button>
            <button
              className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[10px] text-center font-bold leading-3 p-0 hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
              onClick={(e) => {
                e.stopPropagation()
                toggleMaximize()
              }}
            >
              □
            </button>
            <button
              className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[4px] text-center font-normal leading-[16px] p-0 flex items-center justify-center hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              X
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
    </div>
  )
}
