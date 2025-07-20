"use client"

import { useEffect, useState } from "react"

export default function FontChecker() {
  const [fontLoaded, setFontLoaded] = useState(true)
  const [fontError, setFontError] = useState("")

  useEffect(() => {
    // Check if the font is loaded
    document.fonts.ready.then(() => {
      const testElement = document.createElement("span")
      testElement.style.fontFamily = "'MS Sans Serif', sans-serif"
      testElement.textContent = "Test"
      document.body.appendChild(testElement)

      // Get computed style
      const computedStyle = window.getComputedStyle(testElement)
      const loadedFontFamily = computedStyle.fontFamily

      // If the font isn't MS Sans Serif, it's not loaded
      if (!loadedFontFamily.includes("MS Sans Serif")) {
        setFontLoaded(false)
        setFontError(`Font not loaded. Using: ${loadedFontFamily}`)
      }

      document.body.removeChild(testElement)
    })
  }, [])

  if (!fontLoaded) {
    return (
      <div className="fixed bottom-10 right-10 bg-red-500 text-white p-4 rounded shadow-lg z-[9999]">
        <p className="font-bold">Windows 95 Font Not Loaded!</p>
        <p className="text-sm mt-1">The MS Sans Serif font could not be loaded.</p>
        <p className="text-sm mt-1">Error: {fontError}</p>
        <p className="text-sm mt-1">Please check that the font file exists at:</p>
        <code className="block bg-red-700 p-1 mt-1 text-xs">/public/fonts/ms-sans-serif.woff2</code>
        <a
          href="https://github.com/csswizardry/fonts/blob/master/microsoft/MS-Sans-Serif-8pt.woff2"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 bg-blue-500 text-white p-2 text-center rounded text-sm"
        >
          Download Font File
        </a>
        <p className="text-xs mt-2">After downloading, rename to ms-sans-serif.woff2 and place in public/fonts/</p>
      </div>
    )
  }

  return null
}
