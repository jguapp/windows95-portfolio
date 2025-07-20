"use client"

import { useEffect } from "react"

interface BootSequenceProps {
  onBootComplete: () => void
}

export default function BootSequence({ onBootComplete }: BootSequenceProps) {
  // Simple timeout to simulate boot time
  useEffect(() => {
    // Show the startup screen for 4 seconds before completing
    const timer = setTimeout(() => {
      onBootComplete()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onBootComplete])

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {/* Full screen image container */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/windows%2095-mmqEeIl3qCWNCeO8bYCHtNmzr1CgtU.webp"
          alt="Windows 95"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
