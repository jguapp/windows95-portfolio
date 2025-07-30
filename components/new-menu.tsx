"use client"

import { useEffect, useRef } from "react"

interface NewMenuProps {
  x: number
  y: number
  onClose: () => void
  onSelect: (type: string) => void
}

export default function NewMenu({ x, y, onClose, onSelect }: NewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Adjust position if menu would go off screen
  const adjustedX = x + 200 > window.innerWidth ? x - 200 : x
  const adjustedY = y + 150 > window.innerHeight ? y - 150 : y

  const menuItems = [
    {
      type: "Folder",
      label: (
        <>
          <u>F</u>older
        </>
      ),
    },
    {
      type: "Shortcut",
      label: (
        <>
          <u>S</u>hortcut
        </>
      ),
    },
    {
      type: "Text Document",
      label: (
        <>
          <u>T</u>ext Document
        </>
      ),
    },
    {
      type: "Bitmap Image",
      label: (
        <>
          <u>B</u>itmap Image
        </>
      ),
    },
  ]

  return (
    <div
      ref={menuRef}
      className="absolute z-50"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      <div className="bg-[#c0c0c0] border-t-2 border-l-2 border-[#dfdfdf] border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] shadow-md">
        <div className="p-0.5">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full text-left px-2 py-0.5 text-sm hover:bg-[#000080] hover:text-white flex items-center"
              onClick={() => {
                onSelect(item.type)
                onClose()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
