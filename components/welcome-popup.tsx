"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface WelcomePopupProps {
  onClose: () => void
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showAgain, setShowAgain] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
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

  // Center the popup when it becomes visible
  useEffect(() => {
    if (isVisible && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2,
      })
    }
  }, [isVisible])

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
          className="absolute w-[600px] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[1000]"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div
            className="win95-title-bar bg-[#000080] text-white p-[3px_5px] font-bold flex justify-between items-center"
            onMouseDown={startDrag}
          >
            <span className="text-xs">Welcome</span>
            <button
              className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer text-[10px] text-black flex items-center justify-center"
              onClick={onClose}
            >
              <span className="font-bold">x</span>
            </button>
          </div>

          <div className="win95-content p-[10px_20px]">
            <h1 className="text-base text-black mb-[15px] font-bold">Welcome to My Portfolio!</h1>

            <div className="info-container flex items-start gap-5">
              <div className="info-box flex-1 border border-inset border-[#808080] bg-[#ffffe0] p-[10px] text-black leading-[1.4]">
                <div className="info-content flex items-start gap-[10px]">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Garfield-rCq2edeAzuoJGSl65hYADJ5LridXRv.png"
                    alt="Garfield icon"
                    width={64}
                    height={64}
                    className="mt-[5px]"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="info-text flex-1 leading-[1.4] text-xs">
                    <p className="mt-[5px]">
                      <strong>Hi there...</strong>
                    </p>
                    <p className="mt-3">
                      I'm Joel, a Computer Science student and aspiring Machine Learning Engineer. I'm also a huge fan
                      of retro tech, so I decided to create this portfolio based on <strong>Windows 95!</strong>. Thank
                      you for visiting, and enjoy the experience!
                    </p>
                  </div>
                </div>
              </div>

              <div className="buttons-container flex flex-col gap-[10px] items-stretch">
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer w-[120px] hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                  onClick={toggleWhatsNew}
                >
                  What's <u>N</u>ew
                </button>
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer w-[120px] hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                  onClick={handleOpenProjects}
                >
                  <u>L</u>atest Projects
                </button>
                <button
                  className="win95-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer w-[120px] hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
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

          <div className="win95-footer flex justify-between items-center border-t border-t-[#808040] p-[10px_20px] bg-[#c0c0c0] text-[10px]">
            <label className="flex items-center text-[10px] text-black cursor-pointer">
              <div
                className="relative w-[13px] h-[13px] bg-white border border-[#808080] mr-[5px]"
                onClick={() => setShowAgain(!showAgain)}
              >
                {showAgain && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-black text-[10px] leading-none">✓</span>
                  </div>
                )}
              </div>
              <span>
                <u>S</u>how this Welcome Screen next time you start Windows
              </span>
            </label>
            <button
              className="win95-button close-button bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-xs text-black p-[5px_10px] text-center cursor-pointer w-[120px] hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showWhatsNew && (
        <div
          className="absolute w-[400px] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[1001]"
          style={{
            left: `${position.x + 50}px`,
            top: `${position.y + 50}px`,
          }}
        >
          <div
            className="win95-title-bar bg-[#000080] text-white p-[3px_5px] font-bold flex justify-between items-center"
            onMouseDown={startDrag}
          >
            <span className="text-xs">What's New</span>
            <button
              className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer text-[10px] text-black flex items-center justify-center"
              onClick={toggleWhatsNew}
            >
              <span className="font-bold">x</span>
            </button>
          </div>

          <div className="win95-content p-[10px_20px] max-h-[300px] overflow-auto">
            <h2 className="text-sm font-bold mb-2">Recent Updates</h2>
            <ul className="list-disc pl-5 text-xs mb-4">
              <li className="mb-1">Updated desktop icons with authentic Windows 95 style</li>
              <li className="mb-1">Fixed taskbar styling to match Windows 95</li>
              <li className="mb-1">Improved font rendering across all components</li>
              <li className="mb-1">Added hover effects to desktop icons</li>
              <li className="mb-1">Enhanced start menu appearance and functionality</li>
            </ul>

            <h2 className="text-sm font-bold mb-2">Planned Features</h2>
            <ul className="list-disc pl-5 text-xs">
              <li className="mb-1">MS-DOS Command Prompt simulator</li>
              <li className="mb-1">Windows 95 Paint application</li>
              <li className="mb-1">Minesweeper and Solitaire games</li>
              <li className="mb-1">File Explorer with drag and drop functionality</li>
              <li className="mb-1">Animated boot sequence</li>
              <li className="mb-1">System sounds and notifications</li>
            </ul>
          </div>

          <div className="win95-footer flex justify-end items-center border-t border-t-[#808040] p-[10px] bg-[#c0c0c0]">
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
