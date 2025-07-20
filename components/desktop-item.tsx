"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface DesktopItemProps {
  id: string
  label: string
  icon: string
  type: "folder" | "shortcut" | "text-document" | "application"
  isSelected: boolean
  position?: { x: number; y: number }
  isNew?: boolean
  onClick: () => void
  onDoubleClick: () => void
  onRightClick: (e: React.MouseEvent) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onRename?: (id: string, newName: string) => void
}

export default function DesktopItem({
  id,
  label,
  icon,
  type,
  isSelected,
  position,
  isNew = false,
  onClick,
  onDoubleClick,
  onRightClick,
  onDragEnd,
  onRename,
}: DesktopItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position || { x: 0, y: 0 })
  const [isRenaming, setIsRenaming] = useState(isNew)
  const [editedLabel, setEditedLabel] = useState(label)
  const iconRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const positionRef = useRef(currentPosition)

  // Update position ref when currentPosition changes
  useEffect(() => {
    positionRef.current = currentPosition
  }, [currentPosition])

  // Update position if prop changes, but only when not dragging
  useEffect(() => {
    if (!isDragging && position && (position.x !== currentPosition.x || position.y !== currentPosition.y)) {
      setCurrentPosition(position)
    }
  }, [position, isDragging])

  // Update label if it changes from parent
  useEffect(() => {
    if (label !== editedLabel && !isRenaming) {
      setEditedLabel(label)
    }
  }, [label, isRenaming])

  // Focus on input when renaming
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left mouse button
    if (e.button !== 0) return

    // Don't start dragging if renaming
    if (isRenaming) return

    // Don't start dragging on double click (to prevent accidental drags)
    if (e.detail > 1) return

    // Prevent default to avoid text selection during drag
    e.preventDefault()

    // Calculate the offset from the mouse position to the icon's top-left corner
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    setIsDragging(true)
    onClick() // Select the icon when starting to drag
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    // Calculate new position based on mouse position and drag offset
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Get desktop boundaries to keep icons within bounds
    const desktop = document.getElementById("desktop")
    if (desktop) {
      const desktopRect = desktop.getBoundingClientRect()
      const iconRect = iconRef.current?.getBoundingClientRect()

      if (iconRect) {
        // Keep icon within desktop boundaries
        const maxX = desktopRect.width - iconRect.width
        const maxY = desktopRect.height - iconRect.height

        const boundedX = Math.max(0, Math.min(newX, maxX))
        const boundedY = Math.max(0, Math.min(newY, maxY))

        // Update the icon's position
        setCurrentPosition({ x: boundedX, y: boundedY })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)

      // Notify parent component of the new position
      onDragEnd(id, positionRef.current.x, positionRef.current.y)
    }
  }

  const handleRenameSubmit = () => {
    if (onRename && editedLabel.trim()) {
      onRename(id, editedLabel.trim())
    } else {
      // If empty, revert to original label
      setEditedLabel(label)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit()
    } else if (e.key === "Escape") {
      setEditedLabel(label)
      setIsRenaming(false)
    }
  }

  // Add and remove event listeners for mouse move and up
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("mouseup", handleGlobalMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging])

  // Handle clicks outside the rename input to submit
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isRenaming && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        handleRenameSubmit()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isRenaming, editedLabel])

  // Get icon based on type
  const getIconForType = () => {
    if (icon) return icon

    switch (type) {
      case "folder":
        return "/images/folder-icon.png" // Updated to use the new folder icon
      case "shortcut":
        return "/images/shortcut-icon.png"
      case "text-document":
        return "/images/notepad-icon.png" // Updated to use the new document icon
      default:
        return "/placeholder.svg?height=32&width=32"
    }
  }

  // Calculate width based on text length, with minimum and maximum constraints
  const getInputWidth = () => {
    const textLength = editedLabel.length
    // Base width on character count with some padding for larger text
    return Math.max(Math.min(textLength * 6 + 12, 140), 80) // min 80px, max 140px
  }

  // Get icon style based on type
  const getIconStyle = () => {
    const baseStyle = {
      imageRendering: "pixelated" as const,
      objectFit: "contain" as const,
    }

    if (type === "folder" || type === "text-document") {
      return {
        ...baseStyle,
        maxWidth: "45%",
        height: "auto",
      }
    }

    // Add specific styling for shortcut icons
    if (type === "shortcut") {
      return {
        ...baseStyle,
        maxWidth: "45%", // Increased from 40% to 45%
        height: "auto",
      }
    }

    if (isNew) {
      return {
        ...baseStyle,
        maxWidth: type === "folder" || type === "text-document" || type === "shortcut" ? "45%" : "100%",
        height: "auto",
      }
    }

    return baseStyle
  }

  return (
    <div
      ref={iconRef}
      className={`desktop-icon text-center cursor-pointer p-0.5 inline-block transition-transform absolute ${
        isDragging ? "opacity-70" : ""
      }`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        zIndex: isDragging ? 100 : 1,
        userSelect: "none", // Prevent text selection during drag
      }}
      onClick={(e) => {
        if (!isDragging && !isRenaming) {
          e.stopPropagation()
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        if (!isRenaming) {
          e.stopPropagation()
          onDoubleClick()
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isRenaming) {
          onRightClick(e)
        }
      }}
      data-id={id}
    >
      <div className="relative">
        <img
          src={getIconForType() || "/placeholder.svg"}
          alt={`${label} Icon`}
          className="w-20 h-20 mx-auto"
          draggable="false"
          style={getIconStyle()}
        />
        {isSelected && (
          <div
            className="absolute inset-0 bg-[#000080] opacity-50 mix-blend-multiply"
            style={{
              WebkitMaskImage: `url(${getIconForType()})`,
              maskImage: `url(${getIconForType()})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              ...(type === "folder" || type === "text-document"
                ? { maxWidth: "45%", height: "auto", margin: "0 auto" }
                : {}),
            }}
          />
        )}
      </div>

      {isRenaming ? (
        <div className="flex justify-center mt-1.5 mb-0">
          <div className="inline-block border border-black border-solid">
            <input
              ref={inputRef}
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRenameSubmit}
              className="text-xs bg-white text-black border-none outline-none p-0 text-center"
              style={{ width: `${getInputWidth()}px` }}
              maxLength={24}
            />
          </div>
        </div>
      ) : (
        <p
          className={`desktop-icon-text mt-1.5 mb-0 text-xs ${isSelected ? "border border-dotted border-white" : ""}`}
          draggable="false"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsRenaming(true)
          }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
