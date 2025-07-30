"use client"

import { useEffect, useState, useCallback } from "react"
import Desktop from "@/components/desktop"
import Taskbar from "@/components/taskbar"
import StartMenu from "@/components/start-menu"
import Window from "@/components/window"
import WelcomePopup from "@/components/welcome-popup"
import BootSequence from "@/components/boot-sequence"
import KonamiCodeDetector from "@/components/konami-code-detector"
import PokemonBattle from "@/components/pokemon-battle"
import FontChecker from "@/components/font-checker"

export default function Home() {
  const [openWindows, setOpenWindows] = useState<string[]>([])
  const [activeWindow, setActiveWindow] = useState<string | null>(null)
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([])
  const [showStartMenu, setShowStartMenu] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(true)
  const [isBooting, setIsBooting] = useState(true)
  const [bootSound, setBootSound] = useState<HTMLAudioElement | null>(null)
  const [showPokemonBattle, setShowPokemonBattle] = useState(false)

  // Initialize boot sound
  useEffect(() => {
    const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/win95-startup.mp3")
    audio.preload = "auto"
    setBootSound(audio)

    return () => {
      if (bootSound) {
        bootSound.pause()
        bootSound.src = ""
      }
    }
  }, [])

  // Handle boot completion
  const handleBootComplete = useCallback(() => {
    setIsBooting(false)
    // Play Windows 95 startup sound with a slight delay
    setTimeout(() => {
      if (bootSound) {
        bootSound.play().catch((err) => console.log("Audio playback failed:", err))
      }
    }, 500)
  }, [bootSound])

  // Handle opening a window
  const handleOpenWindow = useCallback(
    (id: string) => {
      if (!openWindows.includes(id)) {
        setOpenWindows((prev) => [...prev, id])
      }
      if (minimizedWindows.includes(id)) {
        setMinimizedWindows((prev) => prev.filter((winId) => winId !== id))
      }
      setActiveWindow(id)
    },
    [openWindows, minimizedWindows],
  )

  // Handle closing a window
  const handleCloseWindow = (id: string) => {
    setOpenWindows(openWindows.filter((winId) => winId !== id))
    if (activeWindow === id) {
      setActiveWindow(openWindows.length > 1 ? openWindows[openWindows.length - 2] : null)
    }
  }

  // Handle minimizing a window
  const handleMinimizeWindow = (id: string) => {
    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows([...minimizedWindows, id])
    }
    if (activeWindow === id) {
      setActiveWindow(openWindows.length > 1 ? openWindows[openWindows.length - 2] : null)
    }
  }

  // Handle maximizing a window
  const handleMaximizeWindow = (id: string) => {
    console.log("handleMaximizeWindow called for:", id)
    // Set the window as active when maximized
    setActiveWindow(id)

    // Dispatch a direct event to maximize the window
    const event = new CustomEvent("windowAction", {
      detail: { action: "maximize", id },
    })
    console.log("Dispatching maximize event for:", id)
    window.dispatchEvent(event)
  }

  // Toggle start menu
  const toggleStartMenu = () => {
    setShowStartMenu(!showStartMenu)
  }

  // Close welcome popup
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false)
  }

  // Handle Konami code entered
  const handleKonamiCodeEntered = useCallback(() => {
    console.log("Konami code entered!")
    setShowPokemonBattle(true)
  }, [])

  // Listen for custom openWindow events
  useEffect(() => {
    const handleCustomOpenWindow = (event: CustomEvent) => {
      if (event.detail && event.detail.id) {
        handleOpenWindow(event.detail.id)
      }
    }

    window.addEventListener("openWindow", handleCustomOpenWindow as EventListener)

    return () => {
      window.removeEventListener("openWindow", handleCustomOpenWindow as EventListener)
    }
  }, [handleOpenWindow])

  // Close start menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showStartMenu && !target.closest("#start-menu") && !target.closest("#start-button")) {
        setShowStartMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [showStartMenu])

  // Add a useEffect to initialize screen saver functionality
  useEffect(() => {
    // Load screen saver settings
    const savedScreenSaver = localStorage.getItem("win95-screensaver")
    const savedWaitTime = localStorage.getItem("win95-screensaver-wait")

    if (savedScreenSaver && savedScreenSaver !== "none") {
      let screenSaverTimer: NodeJS.Timeout | null = null
      const waitTime = Number.parseInt(savedWaitTime || "15", 10)

      // Function to start screen saver
      const startScreenSaver = () => {
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
        switch (savedScreenSaver) {
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

        screenSaverTimer = setTimeout(startScreenSaver, waitTime * 60 * 1000)
      }

      // Set up event listeners to reset the timer on user activity
      const handleUserActivity = () => {
        resetScreenSaverTimer()
      }

      window.addEventListener("mousemove", handleUserActivity)
      window.addEventListener("keydown", handleUserActivity)
      window.addEventListener("click", handleUserActivity)

      // Initial setup of timer
      resetScreenSaverTimer()

      // Clean up
      return () => {
        if (screenSaverTimer) {
          clearTimeout(screenSaverTimer)
        }
        window.removeEventListener("mousemove", handleUserActivity)
        window.removeEventListener("keydown", handleUserActivity)
        window.removeEventListener("click", handleUserActivity)
      }
    }
  }, [])

  // Add an event listener to handle window actions from the Resume component
  useEffect(() => {
    const handleWindowAction = (event: CustomEvent) => {
      const { action, id } = event.detail
      if (id === "resume") {
        if (action === "minimize") {
          handleMinimizeWindow(id)
        } else if (action === "maximize") {
          handleMaximizeWindow(id)
        } else if (action === "close") {
          handleCloseWindow(id)
        }
      }
    }

    window.addEventListener("windowAction", handleWindowAction as EventListener)

    return () => {
      window.removeEventListener("windowAction", handleWindowAction as EventListener)
    }
  }, [])

  // Add a direct event listener for debugging
  useEffect(() => {
    const debugListener = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("Window action event detected:", customEvent.detail)
    }

    window.addEventListener("windowAction", debugListener)

    return () => {
      window.removeEventListener("windowAction", debugListener)
    }
  }, [])

  // If still booting, show boot sequence
  if (isBooting) {
    return <BootSequence onBootComplete={handleBootComplete} />
  }

  return (
    <main
      className="h-screen w-full overflow-hidden relative"
      style={{
        backgroundColor: "#008080",
      }}
    >
      <Desktop onOpenWindow={handleOpenWindow} />

      {/* Windows Container */}
      <div id="windows-container">
        {openWindows.map((id) => (
          <Window
            key={id}
            id={id}
            isActive={activeWindow === id}
            isMinimized={minimizedWindows.includes(id)}
            onClose={() => handleCloseWindow(id)}
            onMinimize={() => handleMinimizeWindow(id)}
            onMaximize={() => handleMaximizeWindow(id)}
            onFocus={() => setActiveWindow(id)}
          />
        ))}
      </div>

      {showStartMenu && <StartMenu onClose={() => setShowStartMenu(false)} />}

      <Taskbar
        openWindows={openWindows}
        activeWindow={activeWindow}
        minimizedWindows={minimizedWindows}
        onWindowSelect={handleOpenWindow}
        onToggleStartMenu={toggleStartMenu}
        showStartMenu={showStartMenu}
      />

      {showWelcomePopup && <WelcomePopup onClose={closeWelcomePopup} />}

      {/* Konami Code Detector */}
      <KonamiCodeDetector onCodeEntered={handleKonamiCodeEntered} />

      {/* Pokemon Battle */}
      {showPokemonBattle && <PokemonBattle onClose={() => setShowPokemonBattle(false)} />}

      {/* Font Checker */}
      <FontChecker />
    </main>
  )
}
