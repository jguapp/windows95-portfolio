"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Motion helpers shared by the games.
 *
 * Windows 95 animation was short and mechanical, so everything here is built
 * around brief, linear-ish motion rather than long modern easing. Two rules
 * hold throughout: animation never changes what a game does, and anyone who
 * asks for reduced motion gets the end state immediately.
 */

/** True when the visitor has asked the OS to keep motion to a minimum. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return reduced
}

/**
 * Runs `step` once per animation frame with the seconds elapsed since the last
 * one, which keeps speed independent of frame rate. The callback lives in a ref
 * so a fresh closure each render does not restart the loop.
 *
 * Frames are clamped to 50ms. A backgrounded tab can hand back a gap of
 * seconds, and without the clamp a ball would jump straight through a paddle.
 */
export function useAnimationFrame(step: (dt: number) => void, running = true) {
  const latest = useRef(step)
  latest.current = step

  useEffect(() => {
    if (!running) return
    let frame = 0
    let previous = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05)
      previous = now
      latest.current(dt)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])
}

/** Ease-out for card and piece travel: quick off the mark, soft on arrival. */
export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}
