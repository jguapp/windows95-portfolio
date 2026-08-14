"use client"

import { useEffect, useState } from "react"
import { taskbarTitle, windowIcon } from "@/lib/window-titles"
import { getVolume, isMuted, play, setMuted, setVolume, subscribeVolume } from "@/lib/sound"
import DateTimeProperties from "@/components/date-time-properties"

interface TaskbarProps {
  openWindows: string[]
  activeWindow: string | null
  minimizedWindows: string[]
  onWindowSelect: (id: string) => void
  onToggleStartMenu: () => void
}

/** Quick Launch entries, in the order Windows put them: shell first. */
const QUICK_LAUNCH = [
  { id: "explorer", label: "Windows Explorer", icon: "/images/win95/explorer-16.png" },
  { id: "msdos", label: "MS-DOS Prompt", icon: "/images/win95/msdos-16.png" },
]

export default function Taskbar({
  openWindows,
  activeWindow,
  minimizedWindows,
  onWindowSelect,
  onToggleStartMenu,
}: TaskbarProps) {
  const [time, setTime] = useState<string>("")
  const [showVolume, setShowVolume] = useState(false)
  /** Double-clicking the clock opened Date/Time Properties. People try it. */
  const [showDateTime, setShowDateTime] = useState(false)
  /**
   * Mirrors the sound library so the panel reflects changes made anywhere.
   * The values live outside React because the audio code is not a component.
   */
  const [volume, setVolumeState] = useState(0.7)
  const [muted, setMutedState] = useState(false)

  useEffect(() => {
    const sync = () => {
      setVolumeState(getVolume())
      setMutedState(isMuted())
    }
    sync()
    return subscribeVolume(sync)
  }, [])

  // Clicking anywhere else puts the panel away, as a tray popup should.
  useEffect(() => {
    if (!showVolume) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-volume-panel]") || target.closest("#sound-button")) return
      setShowVolume(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [showVolume])


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


  return (
    <div
      id="taskbar"
      className="fixed bottom-0 left-0 w-full h-[34px] bg-[#c0c0c0] border-t-2 border-t-[#808080] border-b border-b-white flex items-center z-[1000] justify-between"
    >
      <div id="start-button" className="flex items-center cursor-pointer" onClick={onToggleStartMenu}>
        <img
          src="/images/blob/start.png"
          alt="Start"
          className="h-6"
        />
      </div>

      {/* Quick Launch. Not in the August 1995 release: it arrived with the
          Internet Explorer 4 Desktop Update in 1997 and shipped by default in
          Windows 98. A Windows 95 machine with IE4 installed had exactly this. */}
      <div id="quick-launch" className="flex items-center gap-[2px] px-1">
        <div className="mr-1 h-[22px] w-[3px] border-l border-l-[#808080] border-r border-r-white" />
        {QUICK_LAUNCH.map((q) => (
          <button
            key={q.id}
            type="button"
            title={q.label}
            aria-label={q.label}
            onClick={() => onWindowSelect(q.id)}
            className="flex h-[22px] w-[22px] items-center justify-center border-2 border-transparent hover:border-t-white hover:border-l-white hover:border-r-[#404040] hover:border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            <img src={q.icon} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
          </button>
        ))}
        <div className="ml-1 h-[22px] w-[3px] border-l border-l-[#808080] border-r border-r-white" />
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
                src={windowIcon(id) || "/placeholder.svg?height=16&width=16"}
                alt={`${id} Icon`}
                className="w-4 h-4 mx-1"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="ml-0">{taskbarTitle(id)}</span>
            </div>
          )
        })}
      </div>

      <div id="right-section" className="relative flex items-center h-[34px] border-2 border-inset border-white">
        {/*
          The tray speaker was decoration. Clicking it opens the volume control
          Windows 95 put there: a vertical slider and a Mute box, governing
          every sound the desktop makes.
        */}
        <button
          type="button"
          id="sound-button"
          aria-label="Volume"
          onClick={() => setShowVolume((v) => !v)}
          className="flex items-center justify-center w-[36px] h-full bg-[#c0c0c0]"
        >
          <img
            src="/images/blob/sound.png"
            alt=""
            className="w-[36px] h-[28px] object-contain"
            style={{ opacity: muted || volume === 0 ? 0.4 : 1 }}
          />
        </button>

        {showVolume && (
          <div
            data-volume-panel
            className="win95-type absolute bottom-[36px] right-1 z-[1100] w-[74px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] p-2 text-center shadow-[2px_2px_6px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
          >
            <div className="mb-1">Volume</div>
            <input
              data-volume
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              aria-label="Volume"
              onChange={(e) => {
                setVolume(Number(e.target.value) / 100)
                if (muted) setMuted(false)
              }}
              // A vertical slider, as the original was.
              style={{ writingMode: "vertical-lr", direction: "rtl", width: 24, height: 90 }}
            />
            <label className="mt-2 flex items-center justify-center gap-1">
              <input
                data-mute
                type="checkbox"
                checked={muted}
                onChange={(e) => {
                  setMuted(e.target.checked)
                  if (!e.target.checked) play("click")
                }}
              />
              Mute
            </label>
          </div>
        )}
        <button
          type="button"
          id="clock"
          title={new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          onDoubleClick={() => setShowDateTime(true)}
          className="text-[13px] text-black bg-[#c0c0c0] px-2 h-full flex items-center justify-center"
          style={{ textShadow: "1px 1px 0 #ffffff" }}
        >
          {time}
        </button>
      </div>

      {showDateTime && <DateTimeProperties onClose={() => setShowDateTime(false)} />}
    </div>
  )
}
