"use client"

import { useEffect, useRef, useState } from "react"
import { windowTitle } from "@/lib/window-titles"

/**
 * The Close Program dialog, on Ctrl+Alt+Del.
 *
 * Explorer and Systray are always listed, exactly as they were. Ending
 * Explorer takes the taskbar away, which is what happened in 1995 and is worth
 * keeping. Pressing the combination again while the dialog is open reboots.
 */

interface CloseProgramProps {
  openWindows: string[]
  onEndTask: (id: string) => void
  onShutDown: () => void
  onReboot: () => void
  onKillExplorer: () => void
  explorerRunning: boolean
}

const SYSTRAY = "__systray"
const EXPLORER = "__explorer"

export default function CloseProgram({
  openWindows,
  onEndTask,
  onShutDown,
  onReboot,
  onKillExplorer,
  explorerRunning,
}: CloseProgramProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // The handler needs to know whether the dialog is already up, but calling
  // onReboot from inside a setState updater would fire a side effect during an
  // update. A ref keeps the read current without that.
  const openRef = useRef(false)
  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault()
        // The second press while it is already up reboots, as it did.
        if (openRef.current) {
          openRef.current = false
          setOpen(false)
          onReboot()
        } else {
          setOpen(true)
        }
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onReboot])

  if (!open) return null

  const tasks = [
    ...openWindows.map((id) => ({ id, label: windowTitle(id) })),
    ...(explorerRunning ? [{ id: EXPLORER, label: "Explorer" }] : []),
    { id: SYSTRAY, label: "Systray" },
  ]

  const endTask = () => {
    if (!selected) return
    if (selected === EXPLORER) {
      onKillExplorer()
    } else if (selected !== SYSTRAY) {
      onEndTask(selected)
    }
    setSelected(null)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/25">
      <div
        role="dialog"
        aria-label="Close Program"
        className="w-[380px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[4px_4px_10px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between bg-[#000080] px-2 py-[3px]">
          <span className="text-xs font-bold text-white">Close Program</span>
        </div>

        <div className="p-4">
          <div className="mb-3 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
            <ul className="h-[140px] overflow-auto">
              {tasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.id)}
                    onDoubleClick={endTask}
                    className={`w-full px-2 py-[1px] text-left text-xs ${
                      selected === t.id ? "bg-[#000080] text-white" : "text-black"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mb-4 text-xs leading-[1.4]">
            WARNING: Pressing CTRL+ALT+DEL again will restart your computer. You will lose unsaved information in all
            programs that are running.
          </p>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={endTask}
              disabled={!selected}
              className="h-[23px] min-w-[85px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              End Task
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onShutDown()
              }}
              className="h-[23px] min-w-[85px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              Shut Down
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-[23px] min-w-[85px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
