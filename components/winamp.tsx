"use client"

import { useEffect, useRef } from "react"

/** The owner's fifteen, as listed on the profile: artist, then title. */
const PLAYLIST: [string, string][] = [
  ["The Strokes", "Last Nite"],
  ["Arctic Monkeys", "Do I Wanna Know"],
  ["Radiohead", "Karma Police"],
  ["Mac Miller", "Self Care"],
  ["Kendrick Lamar", "Money Trees"],
  ["Bob Dylan", "Like a Rolling Stone"],
  ["Marvin Gaye", "What's Going On"],
  ["Faye Webster", "Kingston"],
  ["Stevie Wonder", "Superstition"],
  ["Queen", "Don't Stop Me Now"],
  ["Michael Jackson", "Rock with You"],
  ["Billy Joel", "Vienna"],
  ["Tame Impala", "The Less I Know the Better"],
  ["The Strokes", "Reptilia"],
  ["Arctic Monkeys", "505"],
]


/**
 * Winamp, the real one.
 *
 * Webamp is a faithful reimplementation of Winamp 2.9 that renders the actual
 * skin engine in the browser. It is the one dependency on this desktop that
 * was taken rather than built, because a pixel-correct Winamp is a project on
 * its own and the library is MIT-licensed and maintained.
 *
 * The library is imported only when the window is first opened, so its weight
 * is paid by the visitor who asked for it rather than by everyone.
 *
 * There is no music in the repository, so the opening track is synthesised on
 * the spot: a short chiptune loop rendered through an OfflineAudioContext and
 * wrapped as a WAV blob. Visitors can drop their own MP3s straight onto the
 * playlist, which Webamp supports natively.
 */
interface WinampProps {
  onClose: () => void
}

/** Renders a little square-wave loop and returns it as a WAV blob URL. */
async function synthesiseTrack(): Promise<string> {
  const rate = 44100
  const seconds = 24
  const ctx = new OfflineAudioContext(1, rate * seconds, rate)

  // A four-bar chip loop: lead, bass, and a noise hat.
  const lead = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 523.25]
  const bass = [130.81, 130.81, 164.81, 164.81, 196, 196, 164.81, 130.81]
  const beat = seconds / 32

  for (let bar = 0; bar < 4; bar++) {
    for (let i = 0; i < 8; i++) {
      const t = (bar * 8 + i) * beat
      // Lead
      const osc = ctx.createOscillator()
      osc.type = "square"
      osc.frequency.value = lead[(i + bar) % lead.length]
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.08, t)
      g.gain.exponentialRampToValueAtTime(0.005, t + beat * 0.9)
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + beat * 0.9)
      // Bass
      const bosc = ctx.createOscillator()
      bosc.type = "triangle"
      bosc.frequency.value = bass[i]
      const bg = ctx.createGain()
      bg.gain.setValueAtTime(0.1, t)
      bg.gain.exponentialRampToValueAtTime(0.01, t + beat)
      bosc.connect(bg).connect(ctx.destination)
      bosc.start(t)
      bosc.stop(t + beat)
    }
  }

  const rendered = await ctx.startRendering()

  // PCM 16-bit WAV encoding, the simplest container there is.
  const samples = rendered.getChannelData(0)
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buf)
  const writeStr = (at: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(at + i, str.charCodeAt(i))
  }
  writeStr(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, "WAVE")
  writeStr(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, "data")
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s * 0x7fff, true)
  }
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }))
}

export default function Winamp({ onClose }: WinampProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    let webamp: { dispose: () => void } | null = null
    let disposed = false
    let trackUrl: string | null = null

    ;(async () => {
      const [{ default: Webamp }, url] = await Promise.all([import("webamp"), synthesiseTrack()])
      if (disposed) {
        URL.revokeObjectURL(url)
        return
      }
      trackUrl = url

      /*
        The playlist: the synthesised opener, then the owner's actual taste.
        Each entry points at a drop-in slot in /audio/winamp; the repo ships
        silent placeholders under those names, so the titles always list and
        overwriting a file with the real recording is the whole installation.
      */
      const instance = new Webamp({
        initialTracks: [
          {
            metaData: { artist: "Joel Vasquez", title: "Boot Sector Boogie" },
            url,
            duration: 24,
          },
          ...PLAYLIST.map(([artist, title], i) => ({
            metaData: { artist, title },
            url: encodeURI(`/audio/winamp/${String(i + 1).padStart(2, "0")} - ${artist} - ${title}.mp3`),
          })),
        ],
      })
      webamp = instance
      instance.onClose(() => onCloseRef.current())
      if (containerRef.current) await instance.renderWhenReady(containerRef.current)
    })()

    return () => {
      disposed = true
      webamp?.dispose()
      if (trackUrl) URL.revokeObjectURL(trackUrl)
    }
  }, [])

  // Webamp renders its own draggable windows inside this container. The
  // container itself must not eat the desktop's clicks, so it is inert while
  // everything Webamp puts inside it accepts them again.
  return (
    <div
      ref={containerRef}
      data-winamp
      className="pointer-events-none fixed inset-0 z-[500] [&_#webamp]:pointer-events-auto"
    />
  )
}
