"use client"

import { useEffect, useRef, useState } from "react"
import {
  SAVER_CHANGE_EVENT,
  makeSaver,
  readSaverSettings,
  type SaverSettings,
} from "@/lib/screensavers"

/**
 * The screensaver, after the desktop has been left alone.
 *
 * Which saver runs, and how long the desktop has to be idle first, comes from
 * the Screen Saver tab of Display Properties. The renderers live in
 * lib/screensavers so the dialog's preview monitor can run the very same code.
 *
 * It gets out of the way on any input at all, including a mouse move, because
 * a screensaver that needs dismissing is a bug rather than a feature.
 */
export default function Screensaver() {
  const [active, setActive] = useState(false)
  const [settings, setSettings] = useState<SaverSettings>({ saver: "starfield", waitMinutes: 2 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Pick up the stored choice, and follow changes made in Display Properties.
  useEffect(() => {
    const load = () => setSettings(readSaverSettings())
    load()
    window.addEventListener(SAVER_CHANGE_EVENT, load)
    return () => window.removeEventListener(SAVER_CHANGE_EVENT, load)
  }, [])

  // --- idle detection --------------------------------------------------------
  useEffect(() => {
    if (settings.saver === "none") {
      setActive(false)
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const idleMs = settings.waitMinutes * 60_000

    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setActive(true), idleMs)
    }
    const wake = () => {
      setActive((on) => (on ? false : on))
      arm()
    }

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const
    for (const e of events) window.addEventListener(e, wake, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      for (const e of events) window.removeEventListener(e, wake)
    }
  }, [settings])

  // --- drawing ---------------------------------------------------------------
  useEffect(() => {
    if (!active || settings.saver === "none") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // A visitor who has asked for less movement gets the black screen a real
    // saver would have shown, without the motion.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let frame = 0
    if (!still) {
      const saver = makeSaver(settings.saver)
      let last = performance.now()
      const loop = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        saver.step(ctx, canvas.width, canvas.height, dt)
        frame = requestAnimationFrame(loop)
      }
      frame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [active, settings])

  if (!active || settings.saver === "none") return null

  return (
    <div
      data-screensaver
      data-saver={settings.saver}
      className="fixed inset-0 z-[2000] cursor-none bg-black"
      aria-hidden
      onPointerDown={() => setActive(false)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
