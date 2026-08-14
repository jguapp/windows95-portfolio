"use client"

/**
 * Simulated screen resolutions.
 *
 * A lower resolution on a real monitor made everything larger: the same
 * pixels over the same glass. The browser equivalent is a zoom on the page
 * root, so choosing 640x480 scales the whole shell up as if the desktop only
 * had that many pixels to spend.
 *
 * "native" applies no zoom at all, and is the default.
 */
export interface Resolution {
  id: string
  label: string
  width: number | null
}

export const RESOLUTIONS: Resolution[] = [
  { id: "640", label: "640 by 480 pixels", width: 640 },
  { id: "800", label: "800 by 600 pixels", width: 800 },
  { id: "1024", label: "1024 by 768 pixels", width: 1024 },
  { id: "native", label: "Native resolution", width: null },
]

const KEY = "win95-resolution"

export function readResolution(): string {
  if (typeof window === "undefined") return "native"
  const saved = localStorage.getItem(KEY)
  return RESOLUTIONS.some((r) => r.id === saved) ? (saved as string) : "native"
}

/** Applies the zoom for a resolution id to the shell root and stores it. */
export function applyResolution(id: string) {
  const res = RESOLUTIONS.find((r) => r.id === id) ?? RESOLUTIONS[3]
  localStorage.setItem(KEY, res.id)
  const root = document.getElementById("shell-root") ?? document.body
  if (res.width === null) {
    root.style.removeProperty("zoom")
    return
  }
  // Never zoom below 1: simulating a resolution higher than the window would
  // shrink the desktop, which no monitor ever did.
  const zoom = Math.max(1, window.innerWidth / res.width)
  root.style.setProperty("zoom", String(zoom))
}
