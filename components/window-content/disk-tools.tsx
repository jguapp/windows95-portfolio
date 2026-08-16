"use client"

import { useEffect, useRef, useState } from "react"
import { play } from "@/lib/sound"

/**
 * ScanDisk and Disk Defragmenter, the two utilities everyone watched run.
 *
 * Both operate on the same thing the rest of this desktop persists to:
 * localStorage. Defrag draws one block per stored key and shuffles them
 * into order; ScanDisk walks the same keys and finds exactly one lost
 * cluster, as it always did, and offers to convert it to a file.
 */

const BLOCK_ROWS = 12
const BLOCK_COLS = 26
const TOTAL_BLOCKS = BLOCK_ROWS * BLOCK_COLS

/** What lives on the drive, so the shows are about real bytes. */
function readDrive(): { keys: string[]; bytes: number } {
  if (typeof window === "undefined") return { keys: [], bytes: 0 }
  try {
    const keys: string[] = []
    let bytes = 0
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key) continue
      keys.push(key)
      bytes += (window.localStorage.getItem(key) ?? "").length
    }
    return { keys, bytes }
  } catch {
    return { keys: [], bytes: 0 }
  }
}

type BlockState = "free" | "used" | "reading" | "moved"

export function Defrag() {
  const [blocks, setBlocks] = useState<BlockState[]>([])
  const [running, setRunning] = useState(false)
  const [percent, setPercent] = useState(0)
  const [drive, setDrive] = useState({ keys: [] as string[], bytes: 0 })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // The map is built from what is actually stored: more saved work, more
  // used blocks, scattered the way a real drive scattered them.
  useEffect(() => {
    const info = readDrive()
    setDrive(info)
    const used = Math.min(TOTAL_BLOCKS - 8, Math.max(12, Math.round(info.bytes / 220)))
    const map: BlockState[] = Array(TOTAL_BLOCKS).fill("free")
    let placed = 0
    while (placed < used) {
      const at = Math.floor(Math.random() * TOTAL_BLOCKS)
      if (map[at] === "free") {
        map[at] = "used"
        placed += 1
      }
    }
    setBlocks(map)
  }, [])

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const start = () => {
    if (running) return
    setRunning(true)
    setPercent(0)
    play("click")

    timer.current = setInterval(() => {
      setBlocks((prev) => {
        // Find the first free block that has a used block after it, and pull
        // that one back: compaction, one block per tick, as the show went.
        const gap = prev.indexOf("free")
        const from = prev.findIndex((b, i) => i > gap && b === "used")
        if (gap === -1 || from === -1) {
          if (timer.current) clearInterval(timer.current)
          setRunning(false)
          setPercent(100)
          play("win")
          return prev.map((b) => (b === "reading" ? "used" : b))
        }
        const next = [...prev]
        next[gap] = "moved"
        next[from] = "free"
        const done = next.filter((b) => b !== "free").length
        const scattered = next.findIndex((b, i) => b === "free" && next.slice(i).includes("used"))
        setPercent(scattered === -1 ? 100 : Math.min(99, Math.round((gap / Math.max(1, done)) * 100)))
        return next
      })
    }, 45)
  }

  const color = (b: BlockState) =>
    b === "free" ? "#c0c0c0" : b === "moved" ? "#0000a8" : b === "reading" ? "#ff0000" : "#000080"

  return (
    <div className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-2 text-xs" style={{ fontFamily: '"MS Sans Serif", sans-serif' }} data-defrag>
      <div className="mb-2">
        Defragmenting Drive C: &mdash; {drive.keys.length} stored item(s), {drive.bytes.toLocaleString()} bytes
      </div>
      <div className="mb-2 flex-1 overflow-hidden border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-1">
        <div
          data-defrag-map
          className="grid h-full w-full gap-[1px]"
          style={{ gridTemplateColumns: `repeat(${BLOCK_COLS}, 1fr)`, gridTemplateRows: `repeat(${BLOCK_ROWS}, 1fr)` }}
        >
          {blocks.map((b, i) => (
            <div key={i} data-block={b} style={{ backgroundColor: color(b) }} />
          ))}
        </div>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-[16px] flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
          <div className="h-full bg-[#000080]" style={{ width: `${percent}%` }} />
        </div>
        <span data-defrag-percent className="w-[42px] text-right">
          {percent}%
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          data-defrag-start
          onClick={start}
          disabled={running}
          className="h-[23px] min-w-[80px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          {running ? "Working..." : "Start"}
        </button>
      </div>
    </div>
  )
}

export function ScanDisk() {
  const [phase, setPhase] = useState<"idle" | "running" | "found" | "fixed">("idle")
  const [line, setLine] = useState("Select the drive and click Start.")
  const [progress, setProgress] = useState(0)
  const [drive, setDrive] = useState({ keys: [] as string[], bytes: 0 })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => setDrive(readDrive()), [])
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const start = () => {
    if (phase === "running") return
    setPhase("running")
    setProgress(0)
    play("click")
    let step = 0
    const keys = drive.keys.length > 0 ? drive.keys : ["(empty drive)"]

    timer.current = setInterval(() => {
      step += 1
      setProgress(Math.min(100, step * 5))
      setLine(`Checking ${keys[step % keys.length]}...`)
      if (step >= 20) {
        if (timer.current) clearInterval(timer.current)
        setPhase("found")
        // One lost cluster. There was always exactly one.
        setLine("ScanDisk found 1 lost cluster containing 512 bytes of data.")
        play("exclamation")
      }
    }, 90)
  }

  const convert = () => {
    setPhase("fixed")
    setLine("The lost cluster was saved as C:\\FILE0000.CHK. It contains nothing you want.")
    play("win")
  }

  return (
    <div className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-3 text-xs" style={{ fontFamily: '"MS Sans Serif", sans-serif' }} data-scandisk>
      <div className="mb-2 font-bold">ScanDisk &mdash; Drive C:</div>
      <div className="mb-2 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-2">
        <div className="mb-1">Type of test: Standard</div>
        <div>
          {drive.keys.length} item(s) on the drive, {drive.bytes.toLocaleString()} bytes in use.
        </div>
      </div>
      <div className="mb-2 h-[16px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
        <div className="h-full bg-[#000080]" style={{ width: `${progress}%` }} />
      </div>
      <div data-scandisk-line className="mb-3 flex-1">
        {line}
      </div>
      <div className="flex justify-end gap-2">
        {phase === "found" ? (
          <button
            type="button"
            data-scandisk-fix
            onClick={convert}
            className="h-[23px] min-w-[110px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
          >
            Convert to file
          </button>
        ) : (
          <button
            type="button"
            data-scandisk-start
            onClick={start}
            disabled={phase === "running"}
            className="h-[23px] min-w-[80px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
          >
            Start
          </button>
        )}
      </div>
    </div>
  )
}
