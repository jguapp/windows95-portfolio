"use client"

import { useEffect, useState } from "react"

interface BlueScreenOfDeathProps {
  onRestart: () => void
}

export default function BlueScreenOfDeath({ onRestart }: BlueScreenOfDeathProps) {
  const [countdown, setCountdown] = useState(10)

  // Separate useEffect for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Separate useEffect for restart when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      // Use setTimeout to ensure this happens after render is complete
      const restartTimer = setTimeout(() => {
        onRestart()
      }, 100)
      return () => clearTimeout(restartTimer)
    }
  }, [countdown, onRestart])

  // Handle key press to restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        onRestart()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onRestart])

  // Random funny error codes
  const errorCode =
    "0x" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0")
  const memoryAddress =
    "0x" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0")

  // Random funny error messages
  const errorMessages = [
    "KEYBOARD_NOT_FOUND: Press F1 to continue",
    "ERROR_COFFEE_NOT_FOUND: User error. Please insert caffeine and try again",
    "UNEXPECTED_ERROR: Everything is actually fine, we just wanted to see a blue screen",
    "USER_ERROR: Replace user and press any key to continue",
    "ERROR_TOO_MANY_WINDOWS_OPEN: Your desktop is experiencing climate change",
    "SYSTEM32_DELETED: Nice job, you've broken the internet",
    "ERROR_404: Your desktop icons ran away and couldn't be found",
    "FATAL_ERROR: Your computer is having an existential crisis",
  ]

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)]

  return (
    <div
      className="fixed inset-0 bg-[#0000AA] text-white font-mono flex flex-col items-center justify-center z-[9999] cursor-pointer select-none"
      onClick={onRestart}
    >
      <div className="w-full max-w-3xl p-8 text-center">
        <div className="text-4xl mb-6">:(</div>
        <div className="text-2xl mb-6 font-bold">WINDOWS</div>
        <div className="text-xl mb-8">
          A fatal exception {errorCode} has occurred at {memoryAddress} in VXD VMM(01) + 00010E36.
        </div>
        <div className="text-xl mb-6">{randomMessage}</div>
        <div className="text-xl mb-8">The current application will be terminated.</div>
        <div className="text-xl mb-8 border-t border-b border-white py-4">
          * Press any key to terminate the current application.
          <br />* Press CTRL+ALT+DEL to restart your computer. You will lose any unsaved information in all
          applications.
          <br />* If this is the first time you've seen this error screen, don't worry, it won't be the last.
        </div>
        <div className="text-xl mb-8">
          You deleted all your desktop icons. Press any key or click anywhere to restart.
        </div>
        <div className="text-sm mt-16 animate-pulse">Automatically restarting in {countdown} seconds...</div>
        <div className="text-xs mt-4 opacity-70">Technical information for nerds: KERNEL_DATA_INPAGE_ERROR</div>
      </div>
    </div>
  )
}
