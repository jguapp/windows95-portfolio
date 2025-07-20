"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DisplayPropertiesProps {
  onClose: () => void
}

// Background images for the user to choose from
const backgroundImages = [
  {
    id: "windows-default",
    name: "Windows Default",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/windows%2095%20background-EtN4lj8sGXFbBJbSMibk3qJxBFnRWJ.webp",
  },
  {
    id: "clouds",
    name: "Clouds",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clouds-NLb22l1U8vFoUMVGCXfCqBIQP7Rr66.jpg",
  },
  {
    id: "bricks",
    name: "Bricks",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bricks-TqWVoSrfJtG6Jv9fTwC9Y5yA61rKnz.jpg",
  },
  {
    id: "maze",
    name: "Maze",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/maze-pattern-bknlGZZjZLkAuKyqoGaOqiXrXDMp7P.jpg",
  },
  {
    id: "waves",
    name: "Waves",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/waves-pattern-E3LzDPmPa1zT3j1sHuZUEbkXn01GnJ.jpg",
  },
]

// Screen savers available in Windows 95
const screenSavers = [
  { id: "none", name: "(None)" },
  { id: "mystify", name: "Mystify Your Mind" },
  { id: "starfield", name: "Starfield Simulation" },
  { id: "flying-windows", name: "Flying Windows" },
  { id: "beziers", name: "Beziers" },
  { id: "curves", name: "3D Flowers" },
]

// Color schemes
const colorSchemes = [
  { id: "windows-standard", name: "Windows Standard" },
  { id: "brick", name: "Brick" },
  { id: "desert", name: "Desert" },
  { id: "eggplant", name: "Eggplant" },
  { id: "lilac", name: "Lilac" },
  { id: "maple", name: "Maple" },
  { id: "rose", name: "Rose" },
  { id: "spruce", name: "Spruce" },
  { id: "wheat", name: "Wheat" },
  { id: "wine", name: "Wine" },
]

export default function DisplayProperties({ onClose }: DisplayPropertiesProps) {
  // Load current settings from localStorage or use defaults
  const [activeTab, setActiveTab] = useState("background")
  const [selectedBackground, setSelectedBackground] = useState(() => {
    const saved = localStorage.getItem("win95-background-image")
    return saved || "windows-default"
  })
  const [backgroundPattern, setBackgroundPattern] = useState(() => {
    const saved = localStorage.getItem("win95-background-pattern")
    return saved || "center" // center, tile, stretch
  })
  const [selectedScreenSaver, setSelectedScreenSaver] = useState(() => {
    const saved = localStorage.getItem("win95-screensaver")
    return saved || "none"
  })
  const [waitTime, setWaitTime] = useState(() => {
    const saved = localStorage.getItem("win95-screensaver-wait")
    return Number.parseInt(saved || "15", 10)
  })
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [selectedColorScheme, setSelectedColorScheme] = useState(() => {
    const saved = localStorage.getItem("win95-color-scheme")
    return saved || "windows-standard"
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dialogPosition, setDialogPosition] = useState({ x: 50, y: 50 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Apply background image to desktop when it changes
  useEffect(() => {
    const desktop = document.getElementById("desktop")
    if (desktop && selectedBackground) {
      const bgImage = backgroundImages.find((bg) => bg.id === selectedBackground)
      if (bgImage) {
        desktop.style.backgroundImage = `url(${bgImage.url})`

        // Set background size and repeat based on pattern
        if (backgroundPattern === "center") {
          desktop.style.backgroundSize = "auto"
          desktop.style.backgroundRepeat = "no-repeat"
          desktop.style.backgroundPosition = "center"
        } else if (backgroundPattern === "tile") {
          desktop.style.backgroundSize = "auto"
          desktop.style.backgroundRepeat = "repeat"
          desktop.style.backgroundPosition = "top left"
        } else if (backgroundPattern === "stretch") {
          desktop.style.backgroundSize = "cover"
          desktop.style.backgroundRepeat = "no-repeat"
          desktop.style.backgroundPosition = "center"
        }

        // Save settings to localStorage
        localStorage.setItem("win95-background-image", selectedBackground)
        localStorage.setItem("win95-background-pattern", backgroundPattern)
      }
    }
  }, [selectedBackground, backgroundPattern])

  // Add a new useEffect to apply color scheme changes
  useEffect(() => {
    // Apply color scheme changes
    const applyColorScheme = () => {
      const root = document.documentElement

      // Default Windows Standard colors
      let desktopColor = "#008080" // Teal
      let windowColor = "#c0c0c0" // Silver
      const textColor = "#000000" // Black
      const highlightColor = "#000080" // Navy
      const highlightTextColor = "#ffffff" // White

      // Change colors based on selected scheme
      switch (selectedColorScheme) {
        case "brick":
          desktopColor = "#800000" // Maroon
          windowColor = "#c0c0c0"
          break
        case "desert":
          desktopColor = "#d2b48c" // Tan
          windowColor = "#d4c4a8"
          break
        case "eggplant":
          desktopColor = "#604080" // Purple
          windowColor = "#c0c0c0"
          break
        case "lilac":
          desktopColor = "#c8a2c8" // Light purple
          windowColor = "#d8c8d8"
          break
        case "maple":
          desktopColor = "#804000" // Brown
          windowColor = "#c0c0c0"
          break
        case "rose":
          desktopColor = "#ff80a0" // Pink
          windowColor = "#ffc0d0"
          break
        case "spruce":
          desktopColor = "#006040" // Dark green
          windowColor = "#c0c0c0"
          break
        case "wheat":
          desktopColor = "#f5deb3" // Wheat
          windowColor = "#f0e0c0"
          break
        case "wine":
          desktopColor = "#800020" // Burgundy
          windowColor = "#c0c0c0"
          break
        default: // Windows Standard
          desktopColor = "#008080" // Teal
          windowColor = "#c0c0c0" // Silver
          break
      }

      // Apply colors to desktop if no background image is set
      const desktop = document.getElementById("desktop")
      if (desktop) {
        // Only change background color if no image is set or if using a pattern that shows background
        if (!selectedBackground || selectedBackground === "none") {
          desktop.style.backgroundColor = desktopColor
        }
      }

      // Apply colors to CSS variables for windows, taskbar, etc.
      document.documentElement.style.setProperty("--win95-desktop-color", desktopColor)
      document.documentElement.style.setProperty("--win95-window-color", windowColor)
      document.documentElement.style.setProperty("--win95-text-color", textColor)
      document.documentElement.style.setProperty("--win95-highlight-color", highlightColor)
      document.documentElement.style.setProperty("--win95-highlight-text-color", highlightTextColor)

      // Save to localStorage
      localStorage.setItem("win95-color-scheme", selectedColorScheme)
    }

    applyColorScheme()
  }, [selectedColorScheme])

  // Add a new useEffect to handle screen saver settings
  useEffect(() => {
    let screenSaverTimer: NodeJS.Timeout | null = null

    // Function to start screen saver
    const startScreenSaver = () => {
      if (selectedScreenSaver === "none") return

      // Create screen saver element
      const screenSaverEl = document.createElement("div")
      screenSaverEl.id = "win95-screensaver"
      screenSaverEl.style.position = "fixed"
      screenSaverEl.style.top = "0"
      screenSaverEl.style.left = "0"
      screenSaverEl.style.width = "100%"
      screenSaverEl.style.height = "100%"
      screenSaverEl.style.zIndex = "10000"
      screenSaverEl.style.backgroundColor = "black"

      // Add screen saver content based on selection
      switch (selectedScreenSaver) {
        case "mystify":
          screenSaverEl.innerHTML = `
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
              <div style="width:200px;height:200px;border:2px solid cyan;animation:rotate 5s linear infinite;"></div>
              <div style="width:150px;height:150px;border:2px solid magenta;position:absolute;top:25px;left:25px;animation:rotate 7s linear infinite reverse;"></div>
            </div>
            <style>
              @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            </style>
          `
          break
        case "starfield":
          screenSaverEl.innerHTML = `
            <div id="starfield" style="width:100%;height:100%;overflow:hidden;"></div>
            <script>
              const starfield = document.getElementById('starfield');
              for (let i = 0; i < 200; i++) {
                const star = document.createElement('div');
                star.style.position = 'absolute';
                star.style.width = '2px';
                star.style.height = '2px';
                star.style.backgroundColor = 'white';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animation = 'twinkle ' + (Math.random() * 5 + 1) + 's infinite';
                starfield.appendChild(star);
              }
            </script>
            <style>
              @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
            </style>
          `
          break
        case "flying-windows":
          screenSaverEl.innerHTML = `
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
              <div style="width:100px;height:80px;border:2px solid white;background:#000080;position:absolute;animation:fly1 10s infinite linear;"></div>
              <div style="width:100px;height:80px;border:2px solid white;background:#000080;position:absolute;animation:fly2 8s infinite linear;"></div>
              <div style="width:100px;height:80px;border:2px solid white;background:#000080;position:absolute;animation:fly3 12s infinite linear;"></div>
            </div>
            <style>
              @keyframes fly1 { 0% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(500px, 300px) rotate(360deg); } }
              @keyframes fly2 { 0% { transform: translate(200px, 100px) rotate(0deg); } 100% { transform: translate(-300px, -200px) rotate(-360deg); } }
              @keyframes fly3 { 0% { transform: translate(-100px, 200px) rotate(0deg); } 100% { transform: translate(400px, -300px) rotate(720deg); } }
            </style>
          `
          break
        default:
          screenSaverEl.innerHTML = `<div style="color:white;text-align:center;padding-top:40vh;font-family:'MS Sans Serif',sans-serif;">Screen Saver</div>`
      }

      // Add click handler to exit screen saver
      screenSaverEl.addEventListener("click", () => {
        document.body.removeChild(screenSaverEl)
        resetScreenSaverTimer()
      })

      // Add key handler to exit screen saver
      screenSaverEl.addEventListener("keydown", () => {
        if (document.body.contains(screenSaverEl)) {
          document.body.removeChild(screenSaverEl)
          resetScreenSaverTimer()
        }
      })

      // Add the screen saver to the body
      document.body.appendChild(screenSaverEl)
    }

    // Function to reset the screen saver timer
    const resetScreenSaverTimer = () => {
      if (screenSaverTimer) {
        clearTimeout(screenSaverTimer)
      }

      if (selectedScreenSaver !== "none") {
        screenSaverTimer = setTimeout(startScreenSaver, waitTime * 60 * 1000)
      }
    }

    // Set up event listeners to reset the timer on user activity
    const handleUserActivity = () => {
      resetScreenSaverTimer()
    }

    // Only set up screen saver if it's not "none"
    if (selectedScreenSaver !== "none") {
      window.addEventListener("mousemove", handleUserActivity)
      window.addEventListener("keydown", handleUserActivity)
      window.addEventListener("click", handleUserActivity)

      // Initial setup of timer
      resetScreenSaverTimer()
    }

    // Save screen saver settings
    localStorage.setItem("win95-screensaver", selectedScreenSaver)
    localStorage.setItem("win95-screensaver-wait", waitTime.toString())

    // Clean up
    return () => {
      if (screenSaverTimer) {
        clearTimeout(screenSaverTimer)
      }
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
      window.removeEventListener("click", handleUserActivity)
    }
  }, [selectedScreenSaver, waitTime])

  // Start dragging the dialog
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()

    setIsDragging(true)
    const dialogRect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - dialogRect.left,
      y: e.clientY - dialogRect.top,
    })
  }

  // Handle dialog dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Ensure dialog stays within viewport
      const maxX = window.innerWidth - 500 // approximate dialog width
      const maxY = window.innerHeight - 400 // approximate dialog height

      setDialogPosition({
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
  }, [isDragging, dragOffset])

  // Update the handleApply function to apply all settings at once
  const handleApply = () => {
    // Save all settings to localStorage
    localStorage.setItem("win95-background-image", selectedBackground)
    localStorage.setItem("win95-background-pattern", backgroundPattern)
    localStorage.setItem("win95-screensaver", selectedScreenSaver)
    localStorage.setItem("win95-screensaver-wait", waitTime.toString())
    localStorage.setItem("win95-color-scheme", selectedColorScheme)

    // Apply background image
    const desktop = document.getElementById("desktop")
    if (desktop && selectedBackground) {
      const bgImage = backgroundImages.find((bg) => bg.id === selectedBackground)
      if (bgImage) {
        desktop.style.backgroundImage = `url(${bgImage.url})`

        // Set background size and repeat based on pattern
        if (backgroundPattern === "center") {
          desktop.style.backgroundSize = "auto"
          desktop.style.backgroundRepeat = "no-repeat"
          desktop.style.backgroundPosition = "center"
        } else if (backgroundPattern === "tile") {
          desktop.style.backgroundSize = "auto"
          desktop.style.backgroundRepeat = "repeat"
          desktop.style.backgroundPosition = "top left"
        } else if (backgroundPattern === "stretch") {
          desktop.style.backgroundSize = "cover"
          desktop.style.backgroundRepeat = "no-repeat"
          desktop.style.backgroundPosition = "center"
        }
      }
    }
  }

  const handleSave = () => {
    handleApply()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="absolute bg-[#c0c0c0] border-t-2 border-l-2 border-[#ffffff] border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
        style={{
          width: 420,
          maxHeight: "90vh",
          top: `${dialogPosition.y}px`,
          left: `${dialogPosition.x}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center cursor-move"
          onMouseDown={startDrag}
        >
          <span className="text-sm font-bold">Display Properties</span>
          <button
            className="w-4 h-4 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] flex items-center justify-center text-black text-[10px]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="background" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#c0c0c0] flex border-t border-[#808080] overflow-x-auto">
            <TabsTrigger
              value="background"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:border-b-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "background" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "background" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "background" ? "1px solid #808080" : "none",
                borderTop: activeTab === "background" ? "1px solid #ffffff" : "none",
              }}
            >
              Background
            </TabsTrigger>
            <TabsTrigger
              value="screen-saver"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "screen-saver" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "screen-saver" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "screen-saver" ? "1px solid #808080" : "none",
                borderTop: activeTab === "screen-saver" ? "1px solid #ffffff" : "none",
              }}
            >
              Screen Saver
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "appearance" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "appearance" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "appearance" ? "1px solid #808080" : "none",
                borderTop: activeTab === "appearance" ? "1px solid #ffffff" : "none",
              }}
            >
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "settings" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "settings" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "settings" ? "1px solid #808080" : "none",
                borderTop: activeTab === "settings" ? "1px solid #ffffff" : "none",
              }}
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Background Tab */}
          <TabsContent
            value="background"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex">
              <div className="flex-1 pr-2">
                <div className="mb-3">
                  <label className="block text-xs mb-1">Wallpaper:</label>
                  <select
                    className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs"
                    value={selectedBackground}
                    onChange={(e) => setSelectedBackground(e.target.value)}
                  >
                    {backgroundImages.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Display:</label>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pattern"
                        value="center"
                        checked={backgroundPattern === "center"}
                        onChange={() => setBackgroundPattern("center")}
                        className="mr-1"
                      />
                      <span className="text-xs">Center</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pattern"
                        value="tile"
                        checked={backgroundPattern === "tile"}
                        onChange={() => setBackgroundPattern("tile")}
                        className="mr-1"
                      />
                      <span className="text-xs">Tile</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pattern"
                        value="stretch"
                        checked={backgroundPattern === "stretch"}
                        onChange={() => setBackgroundPattern("stretch")}
                        className="mr-1"
                      />
                      <span className="text-xs">Stretch</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="w-32 h-32 border border-[#808080] shadow-[inset_1px_1px_#000000] bg-[#008080] relative">
                <div
                  className="absolute inset-2 bg-cover bg-center border border-[#000000]"
                  style={{
                    backgroundImage: `url(${backgroundImages.find((bg) => bg.id === selectedBackground)?.url})`,
                    backgroundSize: backgroundPattern === "stretch" ? "cover" : "auto",
                    backgroundRepeat: backgroundPattern === "tile" ? "repeat" : "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Mini desktop icons */}
                  <div className="w-4 h-4 bg-white absolute left-1 top-1"></div>
                  <div className="w-4 h-4 bg-white absolute left-6 top-1"></div>
                  <div className="w-4 h-4 bg-white absolute left-1 top-6"></div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Screen Saver Tab */}
          <TabsContent
            value="screen-saver"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex">
              <div className="flex-1 pr-2">
                <div className="mb-3">
                  <label className="block text-xs mb-1">Screen Saver:</label>
                  <select
                    className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs"
                    value={selectedScreenSaver}
                    onChange={(e) => setSelectedScreenSaver(e.target.value)}
                  >
                    {screenSavers.map((ss) => (
                      <option key={ss.id} value={ss.id}>
                        {ss.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <button
                    className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-2 py-1 text-xs"
                    style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
                    disabled={selectedScreenSaver === "none"}
                  >
                    Settings...
                  </button>
                  <button
                    className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-2 py-1 text-xs ml-2"
                    style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
                    disabled={selectedScreenSaver === "none"}
                  >
                    Preview
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Wait: {waitTime} minutes</label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={waitTime}
                    onChange={(e) => setWaitTime(Number.parseInt(e.target.value, 10))}
                    className="w-full"
                    disabled={selectedScreenSaver === "none"}
                  />
                </div>

                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={passwordProtected}
                      onChange={() => setPasswordProtected(!passwordProtected)}
                      disabled={selectedScreenSaver === "none"}
                      className="mr-1"
                    />
                    <span className="text-xs">Password protected</span>
                  </label>
                </div>

                <div className="mb-3">
                  <button
                    className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-2 py-1 text-xs"
                    style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
                    disabled={!passwordProtected || selectedScreenSaver === "none"}
                  >
                    Change...
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="w-32 h-32 border border-[#808080] shadow-[inset_1px_1px_#000000] bg-black relative">
                {selectedScreenSaver === "mystify" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border border-[#00ffff] animate-pulse"></div>
                  </div>
                )}
                {selectedScreenSaver === "starfield" && (
                  <div className="absolute inset-0">
                    <div className="absolute w-1 h-1 bg-white top-5 left-10"></div>
                    <div className="absolute w-1 h-1 bg-white top-15 left-20"></div>
                    <div className="absolute w-1 h-1 bg-white top-8 left-18"></div>
                    <div className="absolute w-1 h-1 bg-white top-12 left-8"></div>
                    <div className="absolute w-1 h-1 bg-white top-20 left-16"></div>
                    <div className="absolute w-1 h-1 bg-white top-16 left-5"></div>
                  </div>
                )}
                {selectedScreenSaver === "flying-windows" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#ffffff] bg-[#000080]"></div>
                  </div>
                )}
                {selectedScreenSaver === "none" && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs">(None)</div>
                )}
              </div>
            </div>

            <div className="text-xs mt-4 bg-[#ffffff] p-2 border border-[#808080] shadow-[inset_1px_1px_#000000]">
              Energy Star compliant monitors will turn off their screens after the time set here has elapsed.
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent
            value="appearance"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex">
              <div className="flex-1 pr-2">
                <div className="mb-3">
                  <label className="block text-xs mb-1">Color Scheme:</label>
                  <select
                    className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs"
                    value={selectedColorScheme}
                    onChange={(e) => setSelectedColorScheme(e.target.value)}
                  >
                    {colorSchemes.map((cs) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Item:</label>
                  <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                    <option>Desktop</option>
                    <option>Active Window</option>
                    <option>Inactive Window</option>
                    <option>Menu</option>
                    <option>Window Text</option>
                    <option>Menu Bar</option>
                    <option>Tooltip</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Size:</label>
                  <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                    <option>Normal</option>
                    <option>Large</option>
                    <option>Extra Large</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="w-32 h-32 border border-[#808080] shadow-[inset_1px_1px_#000000] bg-[#008080] relative">
                {/* Mini Windows 95 preview */}
                <div className="absolute top-1 left-1 right-1 h-5 bg-[#000080]">
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[#c0c0c0]"></div>
                </div>
                <div className="absolute top-7 left-1 w-7 h-20 bg-[#c0c0c0]"></div>
                <div className="absolute bottom-1 left-1 right-1 h-3 bg-[#c0c0c0]"></div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="text-xs mb-3">
              The display settings shown below may not match your monitor's capabilities. Refer to your monitor's
              documentation for more information.
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-1">Color palette:</label>
              <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                <option>256 Color</option>
                <option>High Color (16 bit)</option>
                <option>True Color (24 bit)</option>
                <option>True Color (32 bit)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-1">Desktop area:</label>
              <div className="flex items-center">
                <span className="text-xs mr-1">640 by 480 pixels</span>
                <input type="range" className="flex-1" />
                <span className="text-xs ml-1">1024 by 768 pixels</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-3 py-1 text-xs"
                style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
              >
                Advanced Properties...
              </button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Button Bar */}
        <div className="px-4 py-3 flex justify-end gap-2">
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={handleSave}
          >
            OK
          </button>
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
