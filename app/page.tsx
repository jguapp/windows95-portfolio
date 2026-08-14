"use client"

import { useEffect, useState, useCallback } from "react"
import Desktop from "@/components/desktop"
import Taskbar from "@/components/taskbar"
import StartMenu from "@/components/start-menu"
import Window from "@/components/window"
import WelcomePopup from "@/components/welcome-popup"
import BootSequence from "@/components/boot-sequence"
import CloseProgram from "@/components/close-program"
import KonamiCodeDetector from "@/components/konami-code-detector"
import PokemonBattle from "@/components/pokemon-battle"
import RunDialog from "@/components/run-dialog"
import Screensaver from "@/components/screensaver"
import Clippy from "@/components/clippy"
import dynamic from "next/dynamic"

/*
  Winamp is heavy, so the component (and the webamp library inside it) loads
  only when someone opens it. ssr:false because webamp needs a window.
*/
const Winamp = dynamic(() => import("@/components/winamp"), { ssr: false })

import Shutdown from "@/components/shutdown"
import { applyResolution, readResolution } from "@/lib/resolution"
import { playWhenAllowed } from "@/lib/sound"
import FontChecker from "@/components/font-checker"

export default function Home() {
  const [openWindows, setOpenWindows] = useState<string[]>([])
  const [activeWindow, setActiveWindow] = useState<string | null>(null)
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([])
  const [showStartMenu, setShowStartMenu] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(true)
  const [isBooting, setIsBooting] = useState(true)
  // Ending Explorer from Close Program takes the taskbar away, as it did in 1995.
  const [explorerRunning, setExplorerRunning] = useState(true)
  const [isShutDown, setIsShutDown] = useState(false)
  const [showPokemonBattle, setShowPokemonBattle] = useState(false)
  const [showRun, setShowRun] = useState(false)
  const [showWinamp, setShowWinamp] = useState(false)
  const [showShutdown, setShowShutdown] = useState(false)

  /*
    The startup chime.

    The boot sequence finishes on a timer, not a click, so at that moment the
    browser has had no gesture and will not let anything make a noise. Arming
    it instead means it goes off on the first thing the visitor does, which is
    as close as a page gets to a machine coming up.
  */
  // A saved Desktop area choice applies as the desktop appears. Keyed on the
  // boot flag because the shell root does not exist until the boot screen has
  // gone; applying earlier hit a page that was not there yet.
  useEffect(() => {
    if (!isBooting) applyResolution(readResolution())
  }, [isBooting])

  const handleBootComplete = useCallback(() => {
    setIsBooting(false)
    const cancel = playWhenAllowed("startup")
    return cancel
  }, [])

  // Handle opening a window
  const handleOpenWindow = useCallback(
    (id: string) => {
      // Winamp draws its own windows, so it never joins the window list.
      if (id === "winamp") {
        setShowWinamp(true)
        return
      }
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
    // Set the window as active when maximized
    setActiveWindow(id)

    // Dispatch a direct event to maximize the window
    window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "maximize", id } }))
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
    setShowPokemonBattle(true)
  }, [])

  /*
    The Run dialog.

    It cannot live on Windows+R: the operating system claims that combination
    before the browser ever sees it, so pressing it opened the visitor's own
    Run box. Ctrl+Alt+R is free on every platform.
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && e.ctrlKey && e.altKey && !e.metaKey) {
        e.preventDefault()
        setShowRun(true)
      }
    }
    const onRequest = () => setShowRun(true)
    const onShutdown = () => setShowShutdown(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("openRun", onRequest)
    window.addEventListener("openShutdown", onShutdown)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("openRun", onRequest)
      window.removeEventListener("openShutdown", onShutdown)
    }
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


  /*
    The screensaver lives in the Screensaver component, driven by the settings
    the Display Properties dialog stores. A second, DOM-injected copy of each
    saver used to be built here from innerHTML; one implementation is enough.
  */
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

  // If still booting, show boot sequence
  if (isShutDown) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <p className="text-center text-[#e8a33d]" style={{ fontFamily: '"MS Sans Serif", sans-serif', fontSize: 22 }}>
          It&apos;s now safe to turn off
          <br />
          your computer.
        </p>
      </div>
    )
  }

  if (isBooting) {
    return <BootSequence onBootComplete={handleBootComplete} />
  }

  return (
    <main
      id="shell-root"
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
            onFocus={() => setActiveWindow(id)}
          />
        ))}
      </div>

      {showStartMenu && (
        <StartMenu
          onOpenWindow={(id) => {
            handleOpenWindow(id)
            setShowStartMenu(false)
          }}
        />
      )}

      {explorerRunning && (
      <Taskbar
        openWindows={openWindows}
        activeWindow={activeWindow}
        minimizedWindows={minimizedWindows}
        onWindowSelect={handleOpenWindow}
        onToggleStartMenu={toggleStartMenu}
      />
      )}

      {showWelcomePopup && <WelcomePopup onClose={closeWelcomePopup} />}

      <CloseProgram
        openWindows={openWindows}
        explorerRunning={explorerRunning}
        onEndTask={handleCloseWindow}
        onKillExplorer={() => setExplorerRunning(false)}
        onShutDown={() => setIsShutDown(true)}
        onReboot={() => {
          setOpenWindows([])
          setMinimizedWindows([])
          setActiveWindow(null)
          setExplorerRunning(true)
          setShowWelcomePopup(true)
          setIsBooting(true)
        }}
      />

      {/* Konami Code Detector */}
      <KonamiCodeDetector onCodeEntered={handleKonamiCodeEntered} />

      {/* Pokemon Battle */}
      {showPokemonBattle && <PokemonBattle onClose={() => setShowPokemonBattle(false)} />}

      {/* The screensaver chosen in Display Properties, after the wait it sets. */}
      <Screensaver />

      {/* The Office Assistant, on the desktop only and entirely dismissible. */}
      <Clippy desktopVisible={openWindows.every((w) => minimizedWindows.includes(w))} />

      {/* Winamp, loaded on first open */}
      {showWinamp && <Winamp onClose={() => setShowWinamp(false)} />}

      {/* Shut Down, ending on the amber screen */}
      {showShutdown && <Shutdown onCancel={() => setShowShutdown(false)} />}

      {/* Run dialog, from the Start menu or Windows+R */}
      {showRun && <RunDialog onClose={() => setShowRun(false)} />}

      {/* Font Checker */}
      <FontChecker />
    </main>
  )
}
