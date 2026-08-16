"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

/**
 * Scales a fixed-size board to fill whatever window it sits in.
 *
 * The card games lay their tables out at one design size, which left them
 * floating in a corner of a maximised window. This measures the available
 * space and scales the whole table to fit, preserving aspect, so the board
 * fills the window at any size the way the originals did.
 */
export default function FitBoard({
  w,
  h,
  children,
}: {
  w: number
  h: number
  children: React.ReactNode
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setScale(Math.max(0.2, Math.min(rect.width / w, rect.height / h)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h])

  return (
    <div ref={outerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}
