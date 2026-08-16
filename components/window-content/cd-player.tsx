"use client"

import { useEffect, useRef, useState } from "react"
import { play } from "@/lib/sound"

/**
 * CD Player.
 *
 * The applet that showed a disc as numbered tracks with a running time,
 * and knew nothing about what was on it unless you typed the titles in
 * yourself. The disc in this drive is the same fifteen tracks Winamp
 * carries, and the transport counts real seconds, which is as much as an
 * applet with no audio ever needed to do.
 */

const DISC: { artist: string; title: string; seconds: number }[] = [
  { artist: "The Strokes", title: "Last Nite", seconds: 193 },
  { artist: "Arctic Monkeys", title: "Do I Wanna Know", seconds: 272 },
  { artist: "Radiohead", title: "Karma Police", seconds: 261 },
  { artist: "Mac Miller", title: "Self Care", seconds: 345 },
  { artist: "Kendrick Lamar", title: "Money Trees", seconds: 386 },
  { artist: "Bob Dylan", title: "Like a Rolling Stone", seconds: 369 },
  { artist: "Marvin Gaye", title: "What's Going On", seconds: 233 },
  { artist: "Faye Webster", title: "Kingston", seconds: 254 },
  { artist: "Stevie Wonder", title: "Superstition", seconds: 245 },
  { artist: "Queen", title: "Don't Stop Me Now", seconds: 209 },
  { artist: "Michael Jackson", title: "Rock with You", seconds: 220 },
  { artist: "Billy Joel", title: "Vienna", seconds: 214 },
  { artist: "Tame Impala", title: "The Less I Know the Better", seconds: 216 },
  { artist: "The Strokes", title: "Reptilia", seconds: 221 },
  { artist: "Arctic Monkeys", title: "505", seconds: 253 },
]

const mmss = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`

export default function CdPlayer() {
  const [track, setTrack] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [random, setRandom] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = DISC.reduce((n, t) => n + t.seconds, 0)

  /** Steps to a track, from the list or the transport buttons. */
  const goTo = (index: number) => {
    setTrack(((index % DISC.length) + DISC.length) % DISC.length)
    setElapsed(0)
  }

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current)
      return
    }
    timer.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 < DISC[track].seconds) return e + 1
        // The disc rolls on: random order if asked, otherwise the next
        // track, stopping politely at the end.
        setTrack((current) => {
          if (random) return Math.floor(Math.random() * DISC.length)
          if (current + 1 >= DISC.length) {
            setPlaying(false)
            return current
          }
          return current + 1
        })
        return 0
      })
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, track, random])

  const button =
    "flex h-[26px] w-[34px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-2 text-xs"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-cdplayer
    >
      {/* The LED panel: track number and elapsed time, as it read. */}
      <div className="mb-2 flex items-center justify-between border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-black px-2 py-1 font-mono text-[#00ff66]">
        <span data-cd-track>[{String(track + 1).padStart(2, "0")}]</span>
        <span data-cd-time>{mmss(elapsed)}</span>
      </div>

      <div className="mb-2 flex gap-1">
        <button type="button" className={button} aria-label="Play" data-cd-play onClick={() => { setPlaying(true); play("click") }}>
          ▶
        </button>
        <button type="button" className={button} aria-label="Pause" data-cd-pause onClick={() => setPlaying(false)}>
          ‖
        </button>
        <button type="button" className={button} aria-label="Stop" data-cd-stop onClick={() => { setPlaying(false); setElapsed(0) }}>
          ■
        </button>
        <button type="button" className={button} aria-label="Previous track" data-cd-prev onClick={() => goTo(track - 1)}>
          ⏮
        </button>
        <button type="button" className={button} aria-label="Next track" data-cd-next onClick={() => goTo(track + 1)}>
          ⏭
        </button>
        <label className="ml-2 flex items-center gap-1">
          <input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} data-cd-random />
          Random Order
        </label>
      </div>

      <div className="mb-1">
        Artist: <span className="font-bold">{DISC[track].artist}</span>
      </div>
      <div className="mb-2">
        Title: <span className="font-bold">{DISC[track].title}</span>
      </div>

      <div className="mb-2 flex-1 overflow-auto border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
        <table className="w-full">
          <tbody>
            {DISC.map((t, i) => (
              <tr
                key={t.title}
                data-cd-row={i + 1}
                onClick={() => goTo(i)}
                onDoubleClick={() => { goTo(i); setPlaying(true) }}
                className={`cursor-default ${i === track ? "bg-[#000080] text-white" : ""}`}
              >
                <td className="w-[34px] px-2 py-[1px]">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-[1px]">
                  {t.artist} &mdash; {t.title}
                </td>
                <td className="px-2 py-[1px] text-right">{mmss(t.seconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <span>
          {DISC.length} tracks, total {mmss(total)}
        </span>
        <span data-cd-state>{playing ? "Playing" : "Stopped"}</span>
      </div>
    </div>
  )
}
