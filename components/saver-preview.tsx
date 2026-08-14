"use client"

import { useEffect, useRef } from "react"
import { makeSaver, type SaverId } from "@/lib/screensavers"

/**
 * The little monitor on the Screen Saver tab.
 *
 * It runs the real renderer at the canvas's own size, so what the preview
 * shows is what full screen does, not a mock-up of it.
 */
export default function SaverPreview({ id }: { id: SaverId }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const saver = makeSaver(id)
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      saver.step(ctx, canvas.width, canvas.height, dt)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [id])

  return <canvas ref={ref} data-saver-preview={id} className="block h-full w-full" />
}
