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
  { id: "2560", label: "2560 by 1440 pixels", width: 2560 },
  { id: "3840", label: "3840 by 2160 pixels", width: 3840 },
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
  // The zoom runs in both directions: a resolution below the window makes
  // everything larger, and a 2K or 4K mode above it shrinks the shell for
  // more desktop area, which is exactly what more pixels bought.
  const zoom = window.innerWidth / res.width
  root.style.setProperty("zoom", String(zoom))
}
