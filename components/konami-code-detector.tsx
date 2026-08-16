"use client"

import { useEffect, useCallback } from "react"
import { track } from "@vercel/analytics"

interface KonamiCodeDetectorProps {
  onCodeEntered: () => void
}

/** The sequence, hoisted so it is not a fresh array on every render. */
const KONAMI_CODE = [
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

export default function KonamiCodeDetector({ onCodeEntered }: KonamiCodeDetectorProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyPressed = event.key.toLowerCase()
      const konamiCodeElement = document.getElementById("konami-code-progress")

      if (!konamiCodeElement) return

      const currentProgress = Number.parseInt(konamiCodeElement.getAttribute("data-progress") || "0")
      const expectedKey = KONAMI_CODE[currentProgress].toLowerCase()

      if (keyPressed === expectedKey) {
        // Correct key in sequence
        const newProgress = currentProgress + 1
        konamiCodeElement.setAttribute("data-progress", newProgress.toString())

        // If completed the sequence
        if (newProgress === KONAMI_CODE.length) {
          konamiCodeElement.setAttribute("data-progress", "0")
          /*
            The one thing worth measuring: how many visitors find the secret.
            track() is a no-op off Vercel, so this costs nothing locally and
            carries no personal data either way.
          */
          try {
            track("konami_code")
          } catch {
            // Analytics is never worth breaking the easter egg over.
          }
          onCodeEntered()
        }
      } else {
        // Incorrect key, reset progress
        konamiCodeElement.setAttribute("data-progress", "0")
      }
    },
    [onCodeEntered],
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
