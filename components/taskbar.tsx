"use client"

import { useEffect, useState } from "react"
import { taskbarTitle, windowIcon } from "@/lib/window-titles"
import { getVolume, isMuted, play, setMuted, setVolume, subscribeVolume } from "@/lib/sound"
import { RESOLUTIONS, applyResolution, readResolution } from "@/lib/resolution"
import DateTimeProperties from "@/components/date-time-properties"

/** Quick Launch entries, in the order Windows put them: the shell first. */
const QUICK_LAUNCH = [
  { id: "explorer", label: "Windows Explorer", icon: "/images/win95/explorer-16.png" },
  { id: "msdos", label: "MS-DOS Prompt", icon: "/images/win95/msdos-16.png" },
]

interface TaskbarProps {
  openWindows: string[]
  activeWindow: string | null
  minimizedWindows: string[]
  onWindowSelect: (id: string) => void
  onToggleStartMenu: () => void
}


export default function Taskbar({
  openWindows,
  activeWindow,
  minimizedWindows,
  onWindowSelect,
  onToggleStartMenu,
}: TaskbarProps) {
  const [time, setTime] = useState<string>("")
  const [showVolume, setShowVolume] = useState(false)
  /** The full Volume Control, on a tray double click. */
  const [showMixer, setShowMixer] = useState(false)
  /** The decorative channels: faders that move and mean it locally. */
  const [mix, setMix] = useState({ wave: 80, midi: 70, cd: 65 })
  const [mixMute, setMixMute] = useState({ wave: false, midi: false, cd: false })
  /** The QuickRes popup: a list of resolutions above the tray. */
  const [showRes, setShowRes] = useState(false)
  const [resolution, setResolutionState] = useState("native")

  useEffect(() => {
    setResolutionState(readResolution())
  }, [])
  /** The clock opens Date/Time Properties. Windows wanted a double click;
   *  a single one is friendlier and costs nothing here. */
  const [showDateTime, setShowDateTime] = useState(false)
  /** The bar's own right-click menu: minimise all, and the tray dialogs. */
  const [barMenu, setBarMenu] = useState<{ x: number } | null>(null)

  useEffect(() => {
    if (!barMenu) return
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-taskbar-menu]")) return
      setBarMenu(null)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [barMenu])
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
    if (!showMixer) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-mixer-panel]") || target.closest("#sound-button")) return
      setShowMixer(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [showMixer])

  useEffect(() => {
    if (!showRes) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-resolution-panel]") || target.closest("#resolution-button")) return
      setShowRes(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [showRes])


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
      onContextMenu={(e) => {
        // Only the bar itself: buttons and the tray keep their own behaviour.
        if ((e.target as HTMLElement).closest("button, .taskbar-item, #right-section")) return
        e.preventDefault()
        setBarMenu({ x: Math.min(e.clientX, window.innerWidth - 190) })
      }}
    >
      {barMenu && (
        <div
          data-taskbar-menu
          /*
            Identical metrics to the desktop's context menu, so the two
            right-click menus read as the same control. The context-menu
            class is what makes that true: the blanket element rule in
            globals.css forces buttons to 1.2rem with !important, which no
            utility class outranks, so without the carve-out this menu
            rendered at 19px and half again the desktop menu's size.
          */
          className="context-menu absolute bottom-[36px] z-[1100] select-none bg-[#c5c4c4] p-[4px_2px] outline outline-1 outline-white"
          style={{
            left: barMenu.x,
            minWidth: 138,
            border: "2px solid #eeeded",
            borderRightColor: "#000000",
            borderRightWidth: 1,
            borderBottomColor: "#000000",
            borderBottomWidth: 1,
          }}
        >
          <div className="p-0.5">
            <button
              type="button"
              className="block w-full whitespace-nowrap py-[2px] pl-6 pr-6 text-left text-[12px] hover:bg-[#040d91] hover:text-white"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("minimizeAllWindows"))
                setBarMenu(null)
              }}
            >
              Minimize All Windows
            </button>
            <div className="mx-0 my-1" style={{ borderBottom: "2.5px groove #eae8e8" }} />
            <button
              type="button"
              className="block w-full whitespace-nowrap py-[2px] pl-6 pr-6 text-left text-[12px] hover:bg-[#040d91] hover:text-white"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "background" } }))
                setBarMenu(null)
              }}
            >
              Properties
            </button>
          </div>
        </div>
      )}
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
            aria-label={q.label}
            title={q.label}
            onClick={() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: q.id } }))}
            className="flex h-[22px] w-[22px] items-center justify-center border-2 border-transparent hover:border-t-white hover:border-l-white hover:border-r-[#404040] hover:border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            <img src={q.icon} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
          </button>
        ))}
        <button
          type="button"
          aria-label="Show Desktop"
          title="Show Desktop"
          onClick={() => window.dispatchEvent(new CustomEvent("minimizeAllWindows"))}
          className="flex h-[22px] w-[22px] items-center justify-center border-2 border-transparent hover:border-t-white hover:border-l-white hover:border-r-[#404040] hover:border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
        >
          {/* The desk blotter glyph the Desktop Update used. */}
          <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges" aria-hidden>
            <rect x="1" y="2" width="12" height="9" fill="#008080" stroke="#000" strokeWidth="1" />
            <rect x="3" y="4" width="3" height="3" fill="#fff" />
            <rect x="5" y="11" width="4" height="2" fill="#808080" />
          </svg>
        </button>
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
          The screen resolution changer. QuickRes shipped with the Power Toys
          and put a little monitor in the tray; clicking it popped a menu of
          resolutions right there, which is what this does. Display Properties
          stays one entry away at the bottom of the list.
        */}
        <button
          type="button"
          id="resolution-button"
          aria-label="Screen resolution"
          title="Screen resolution"
          onClick={() => setShowRes((v) => !v)}
          className="flex items-center justify-center w-[20px] h-full bg-[#c0c0c0]"
        >
          <img
            src="/images/win95/resolution-16.png"
            alt=""
            className="w-[16px] h-[16px]"
            style={{ imageRendering: "pixelated" }}
          />
        </button>

        {showRes && (
          <div
            data-resolution-panel
            className="win95-type absolute bottom-[36px] right-1 z-[1100] w-[190px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_6px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
          >
            {RESOLUTIONS.map((res) => (
              <button
                key={res.id}
                type="button"
                data-resolution-option={res.id}
                onClick={() => {
                  applyResolution(res.id)
                  setResolutionState(res.id)
                  setShowRes(false)
                  play("click")
                }}
                className="flex w-full items-center gap-1 px-2 py-[3px] text-left hover:bg-[#000080] hover:text-white"
              >
                <span className="inline-block w-[12px]">{resolution === res.id ? "\u2713" : ""}</span>
                {res.label}
              </button>
            ))}
            <div className="mx-1 my-1 border-t border-[#808080] border-b border-b-white" />
            <button
              type="button"
              data-resolution-settings
              onClick={() => {
                setShowRes(false)
                window.dispatchEvent(new CustomEvent("openDisplayProperties", { detail: { tab: "settings" } }))
              }}
              className="flex w-full items-center gap-1 whitespace-nowrap px-2 py-[3px] text-left hover:bg-[#000080] hover:text-white"
            >
              <span className="inline-block w-[12px]" />
              Adjust Display Properties...
            </button>
          </div>
        )}

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
          onDoubleClick={() => {
            // A double click opened the full Volume Control, as it did.
            setShowVolume(false)
            setShowMixer(true)
          }}
          className="flex items-center justify-center w-[20px] h-full bg-[#c0c0c0]"
        >
          <img
            src="/images/blob/sound.png"
            alt=""
            className="w-[16px] h-[16px] object-contain"
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

        {/*
          The full Volume Control, on a double click. Only the first column
          governs anything: the desktop has one output, but the mixer had
          four faders and so does this one.
        */}
        {showMixer && (
          <div
            data-mixer-panel
            className="win95-type absolute bottom-[36px] right-1 z-[1100] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[2px_2px_6px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
          >
            <div className="flex items-center justify-between bg-[#000080] px-2 py-[2px]">
              <span className="text-xs font-bold text-white">Volume Control</span>
              <button
                type="button"
                aria-label="Close Volume Control"
                onClick={() => setShowMixer(false)}
                className="flex h-4 w-4 items-center justify-center bg-[#c0c0c0] text-black shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000]"
              >
                <span className="text-[10px] leading-none">×</span>
              </button>
            </div>
            <div className="flex gap-1 p-2">
              {(
                [
                  ["Volume Control", "master"],
                  ["Wave", "wave"],
                  ["MIDI", "midi"],
                  ["CD Audio", "cd"],
                ] as const
              ).map(([label, ch]) => {
                const isMaster = ch === "master"
                const value = isMaster ? Math.round(volume * 100) : mix[ch]
                const chMuted = isMaster ? muted : mixMute[ch]
                return (
                  <div
                    key={ch}
                    data-mixer-channel={ch}
                    className="flex w-[74px] flex-col items-center border border-[#808080] p-1"
                  >
                    <div className="mb-1 h-[24px] text-center text-[11px] leading-tight">{label}</div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      aria-label={`${label} volume`}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (isMaster) {
                          setVolume(v / 100)
                          if (muted) setMuted(false)
                        } else {
                          setMix((m) => ({ ...m, [ch]: v }))
                        }
                      }}
                      style={{ writingMode: "vertical-lr", direction: "rtl", width: 24, height: 80 }}
                    />
                    <label className="mt-1 flex items-center gap-1 text-[11px]">
                      <input
                        type="checkbox"
                        checked={chMuted}
                        onChange={(e) => {
                          if (isMaster) {
                            setMuted(e.target.checked)
                            if (!e.target.checked) play("click")
                          } else {
                            setMixMute((m) => ({ ...m, [ch]: e.target.checked }))
                          }
                        }}
                      />
                      Mute
                    </label>
                  </div>
                )
              })}
            </div>
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
          onClick={() => setShowDateTime(true)}
          // Size lives in globals.css (#taskbar #clock), which must out-rank
          // the blanket button type rule; an inline size here never renders.
          className="text-black bg-[#c0c0c0] pl-[6px] pr-[7px] h-full flex items-center justify-center"
        >
          {time}
        </button>
      </div>

      {showDateTime && <DateTimeProperties onClose={() => setShowDateTime(false)} />}
    </div>
  )
}
