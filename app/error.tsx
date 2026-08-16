"use client"

import { useEffect } from "react"

/**
 * The error boundary wears the blue screen.
 *
 * A React crash on this desk should look like what a crash looked like in
 * 1995. Any key or a click attempts the restart, which here means React's
 * reset: the tree re-renders and the desk comes back.
 */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const onKey = () => reset()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reset])

  return (
    <div
      onClick={reset}
      className="flex h-screen w-full cursor-pointer flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#0000AA", color: "#c0c0c0", fontFamily: '"Courier New", monospace' }}
    >
      <p className="mb-6 px-3 text-lg font-bold" style={{ backgroundColor: "#c0c0c0", color: "#0000AA" }}>
        Windows
      </p>
      <div className="max-w-[620px] text-sm leading-relaxed">
        <p className="mb-4">
          A fatal exception has occurred in the desktop. The current application will be terminated.
        </p>
        <p className="mb-4">
          {"* The error was: "}
          {error.message?.slice(0, 120) || "unknown"}
          {error.digest ? ` (${error.digest})` : ""}
        </p>
        <p className="mb-4">
          * Press any key to restart the desktop. Your saved files and settings are unaffected.
        </p>
        <p className="animate-pulse">Press any key to continue _</p>
      </div>
    </div>
  )
}
