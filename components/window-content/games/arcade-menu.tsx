"use client"

import { useState, useRef, useEffect } from "react"

interface MenuOption {
  label: string
  action: () => void
  disabled?: boolean
}

interface MenuProps {
  label: string
  options: MenuOption[]
  theme: "bomberman" | "tron" | "arkanoid" | "pacman"
}

export default function ArcadeMenu({ label, options, theme }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [hoverSound] = useState<HTMLAudioElement | null>(
    typeof window !== "undefined" ? new Audio("/sounds/hover.mp3") : null,
  )

  // Set volume for hover sound
  useEffect(() => {
    if (hoverSound) {
      hoverSound.volume = 0.1
    }
  }, [hoverSound])

  // Play hover sound
  const playHoverSound = () => {
    if (hoverSound) {
      hoverSound.currentTime = 0
      hoverSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case "bomberman":
        return {
          button: "bg-blue-900 text-white border-2 border-blue-400 hover:bg-blue-800",
          menu: "bg-black border-2 border-blue-500",
          option: "hover:bg-blue-800 hover:text-white",
          disabled: "text-blue-700 cursor-not-allowed hover:bg-transparent",
        }
      case "tron":
        return {
          button: "bg-cyan-900 text-white border-2 border-cyan-400 hover:bg-cyan-800",
          menu: "bg-black border-2 border-cyan-500",
          option: "hover:bg-cyan-800 hover:text-white",
          disabled: "text-cyan-700 cursor-not-allowed hover:bg-transparent",
        }
      case "arkanoid":
        return {
          button: "bg-fuchsia-900 text-white border-2 border-fuchsia-400 hover:bg-fuchsia-800",
          menu: "bg-black border-2 border-fuchsia-500",
          option: "hover:bg-fuchsia-800 hover:text-white",
          disabled: "text-fuchsia-700 cursor-not-allowed hover:bg-transparent",
        }
      case "pacman":
        return {
          button: "bg-blue-900 text-white border-2 border-yellow-400 hover:bg-blue-800",
          menu: "bg-black border-2 border-yellow-500",
          option: "hover:bg-blue-800 hover:text-white",
          disabled: "text-blue-700 cursor-not-allowed hover:bg-transparent",
        }
    }
  }

  const styles = getThemeStyles()

  return (
    <div ref={menuRef} className="relative">
      <button
        className={`px-3 py-1 ${styles.button} font-['Press_Start_2P',monospace] text-xs`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={playHoverSound}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 z-50 min-w-[150px] ${styles.menu} shadow-lg`}
          style={{ minWidth: "180px" }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className={`px-3 py-2 text-white font-['Press_Start_2P',monospace] text-xs cursor-pointer ${
                option.disabled ? styles.disabled : styles.option
              }`}
              onClick={() => {
                if (!option.disabled) {
                  option.action()
                  setIsOpen(false)
                }
              }}
              onMouseEnter={playHoverSound}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
