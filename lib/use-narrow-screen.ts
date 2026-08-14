"use client"

import { useEffect, useState } from "react"

/**
 * Whether the viewport is too narrow for a draggable desktop.
 *
 * A window manager is a poor fit for a phone: there is no room to drag a
 * window to, no second window worth seeing at once, and no right mouse
 * button. Rather than shrink the desktop until it is unusable, the shell
 * switches to one maximised window at a time and a grid of icons.
 *
 * 768px is the breakpoint because it is where a window at its minimum size
 * stops fitting alongside anything else, not because it is a common phone
 * width.
 */
const QUERY = "(max-width: 768px)"

export function useNarrowScreen(): boolean {
  // Server-rendered markup has no viewport, so it always starts wide and
  // corrects on mount. Starting narrow would flash the desktop layout away on
  // every desktop load, which is the more common case.
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return narrow
}
