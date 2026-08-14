"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * The screensaver, after the desktop has been left alone.
 *
 * Windows 95 shipped Flying Windows as the default and a starfield beside it.
 * This is the starfield: points seeded around the centre and pushed outward,
 * which is how the original faked flying through space on hardware that could
 * not do anything more expensive.
 *
 * It gets out of the way on any input at all, including a mouse move, because
 * a screensaver that needs to be dismissed is a bug rather than a feature.
 */
interface ScreensaverProps {
  /** How long the desktop has to be idle first. */
  idleMs?: number
}

interface Star {
  x: number
  y: number
  z: number
}

const STAR_COUNT = 260
/** How fast the field comes at you. Higher is faster. */
const SPEED = 0.55

export default function Screensaver({ idleMs = 120_000 }: ScreensaverProps) {
  const [active, setActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  const stars = useRef<Star[]>([])

  // --- idle detection --------------------------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setActive(true), idleMs)
    }

    const wake = () => {
      setActive((on) => {
        if (on) return false
        return on
      })
      arm()
    }

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const
    for (const e of events) window.addEventListener(e, wake, { passive: true })
    arm()

    return () => {
      clearTimeout(timer)
      for (const e of events) window.removeEventListener(e, wake)
    }
  }, [idleMs])

  // --- the field -------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2

    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = "#ffffff"

    for (const star of stars.current) {
      star.z -= SPEED
      // Past the eye, so send it back to the far distance somewhere new.
      if (star.z <= 1) {
        star.x = Math.random() * 2 - 1
        star.y = Math.random() * 2 - 1
        star.z = 100
      }

      const k = 128 / star.z
      const px = cx + star.x * k * w * 0.5
      const py = cy + star.y * k * h * 0.5
      if (px < 0 || px >= w || py < 0 || py >= h) {
        star.z = 100
        continue
      }

      // Nearer stars are bigger, which is the whole of the depth cue.
      const size = Math.max(1, Math.round((1 - star.z / 100) * 3))
      ctx.fillRect(Math.round(px), Math.round(py), size, size)
    }

    frame.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    if (!active) return

    // Respect a visitor who has asked for less movement: show the black screen
    // a real screensaver would, without the motion.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    stars.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 99 + 1,
    }))

    if (still) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    } else {
      frame.current = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener("resize", resize)
    }
  }, [active, draw])

  if (!active) return null

  return (
    <div
      data-screensaver
      className="fixed inset-0 z-[2000] cursor-none bg-black"
      aria-hidden
      // Any click also dismisses it, which the window-level listener already
      // covers; this is here so the element itself is never a dead spot.
      onPointerDown={() => setActive(false)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
