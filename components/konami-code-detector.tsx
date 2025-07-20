"use client"

import { useEffect, useCallback } from "react"

interface KonamiCodeDetectorProps {
  onCodeEntered: () => void
}

export default function KonamiCodeDetector({ onCodeEntered }: KonamiCodeDetectorProps) {
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyPressed = event.key.toLowerCase()
      const konamiCodeElement = document.getElementById("konami-code-progress")

      if (!konamiCodeElement) return

      const currentProgress = Number.parseInt(konamiCodeElement.getAttribute("data-progress") || "0")
      const expectedKey = konamiCode[currentProgress].toLowerCase()

      if (keyPressed === expectedKey) {
        // Correct key in sequence
        const newProgress = currentProgress + 1
        konamiCodeElement.setAttribute("data-progress", newProgress.toString())

        // If completed the sequence
        if (newProgress === konamiCode.length) {
          konamiCodeElement.setAttribute("data-progress", "0")
          onCodeEntered()
        }
      } else {
        // Incorrect key, reset progress
        konamiCodeElement.setAttribute("data-progress", "0")
      }
    },
    [onCodeEntered, konamiCode],
  )

  useEffect(() => {
    // Create a hidden element to track progress
    const progressElement = document.createElement("div")
    progressElement.id = "konami-code-progress"
    progressElement.setAttribute("data-progress", "0")
    progressElement.style.display = "none"
    document.body.appendChild(progressElement)

    // Add event listener
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (document.getElementById("konami-code-progress")) {
        document.getElementById("konami-code-progress")?.remove()
      }
    }
  }, [handleKeyDown])

  return null
}
