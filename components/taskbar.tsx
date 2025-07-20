"use client"

import { useEffect, useState } from "react"

interface TaskbarProps {
  openWindows: string[]
  activeWindow: string | null
  minimizedWindows: string[]
  onWindowSelect: (id: string) => void
  onToggleStartMenu: () => void
  showStartMenu: boolean
}

export default function Taskbar({
  openWindows,
  activeWindow,
  minimizedWindows,
  onWindowSelect,
  onToggleStartMenu,
  showStartMenu,
}: TaskbarProps) {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      let hours = now.getHours()
      const minutes = now.getMinutes().toString().padStart(2, "0")
      const ampm = hours >= 12 ? "PM" : "AM"
      hours = hours % 12 || 12 // Convert to 12-hour format
      setTime(`${hours}:${minutes} ${ampm}`)
    }

    updateClock() // Initialize clock immediately
    const interval = setInterval(updateClock, 1000)

    return () => clearInterval(interval)
  }, [])

  // Map window IDs to their respective icons
  const iconMap: Record<string, string> = {
    "about-me": "/images/desktop-icons/about-me.png",
    resume: "/images/desktop-icons/resume.png",
    projects: "/images/desktop-icons/youtube.png",
    contact: "/images/desktop-icons/contact.png",
    gallery: "/images/desktop-icons/gallery.png",
    games: "/images/desktop-icons/games.png",
    paint: "/images/desktop-icons/paint.png",
  }

  // Map window IDs to display names
  const displayNameMap: Record<string, string> = {
    // No special display names needed after removing spotify
  }

  return (
    <div
      id="taskbar"
      className="fixed bottom-0 left-0 w-full h-[34px] bg-[#c0c0c0] border-t-2 border-t-[#808080] border-b border-b-white flex items-center z-[1000] justify-between"
    >
      <div id="start-button" className="flex items-center cursor-pointer" onClick={onToggleStartMenu}>
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/start-button-mPPqvVzCJaYwL78t8Dw7suvpvIFOS1.png"
          alt="Start"
          className="h-6"
        />
      </div>

      <div
        id="taskbar-buttons"
        className="flex gap-[1px] flex-grow justify-start items-center overflow-hidden ml-0 mr-1"
      >
        {openWindows.map((id) => {
          return (
            <div
              key={id}
              id={`taskbar-${id}`}
              className={`taskbar-item flex items-center gap-0 h-[22px] bg-[#c0c0c0] border-2 ${
                activeWindow === id && !minimizedWindows.includes(id)
                  ? "border-[#404040] border-t-[#404040] border-l-[#404040] border-r-white border-b-white"
                  : "border-white border-t-white border-l-white border-r-[#404040] border-b-[#404040]"
              } pl-0 pr-2 text-xs cursor-pointer text-black hover:bg-[#d0d0d0]`}
              onClick={() => onWindowSelect(id)}
            >
              <img
                src={iconMap[id] || "/placeholder.svg?height=16&width=16"}
                alt={`${id} Icon`}
                className="w-8 h-8 -ml-0.5"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="capitalize ml-0">{displayNameMap[id] || id.replace(/-/g, " ")}</span>
            </div>
          )
        })}
      </div>

      <div id="right-section" className="flex items-center h-[34px] border-2 border-inset border-white">
        <div id="sound-button" className="flex items-center justify-center w-[36px] h-full bg-[#c0c0c0]">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sound-icon-aCl39MutlaS3nQJaqBD1JIlmaryuSZ.png"
            alt="Sound Icon"
            className="w-[36px] h-[28px] object-contain"
          />
        </div>
        <div
          id="clock"
          className="text-[13px] text-black bg-[#c0c0c0] px-2 h-full flex items-center justify-center"
          style={{ textShadow: "1px 1px 0 #ffffff" }}
        >
          {time}
        </div>
      </div>
    </div>
  )
}
