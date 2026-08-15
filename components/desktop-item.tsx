"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

/** Windows 95 drew desktop icons at 32x32, and so does this. */
const ICON_PX = 32
/**
 * The cell a desktop icon occupies.
 *
 * Each item used to be as wide as its own label, so "Paint" sat in a narrow box
 * and "My Projects" in a wide one, and because the image is centred in its box
 * the icons themselves never lined up down the column. A fixed cell, with the
 * label wrapping inside it, is what Windows 95 used and what makes a column
 * look like a column.
 */
const CELL_PX = 75
/*
  Every icon occupies the same box, whatever its label.

  A one-line label made a 62px tall icon and a two-line label an 82px one,
  against a fixed vertical pitch. The result was uneven: generous air under
  Mail and Gallery, while My Projects and Recycle Bin overlapped the icon
  below by four pixels. Windows 95 gave each icon an identical cell and let
  the label use up to two lines inside it, which is what this does.
*/
const CELL_H = 76
/** Two lines at the 17px line height the labels render at. */
const LABEL_H = 34

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
  /** Called when this icon is released over the Recycle Bin. */
  onDropInBin?: (id: string) => void
  /** Reports whether the icon being dragged is currently over the bin. */
  onDragOverBin?: (over: boolean) => void
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
  onDropInBin,
  onDragOverBin,
}: DesktopItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position || { x: 0, y: 0 })
  const [isRenaming, setIsRenaming] = useState(isNew)
  const [editedLabel, setEditedLabel] = useState(label)
  const iconRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const positionRef = useRef(currentPosition)
  /** Last pointer position, so the drop target can be resolved on mouse up. */
  const pointerRef = useRef({ x: 0, y: 0 })
  const overBinRef = useRef(false)

  // Update position ref when currentPosition changes
  useEffect(() => {
    positionRef.current = currentPosition
  }, [currentPosition])

  // Update position if prop changes, but only when not dragging
  useEffect(() => {
    if (!isDragging && position && (position.x !== currentPosition.x || position.y !== currentPosition.y)) {
      setCurrentPosition(position)
    }
    // currentPosition is the value being compared against, not an input: it
    // would re-fire this effect on its own result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, isDragging])

  // Update label if it changes from parent
  useEffect(() => {
    if (label !== editedLabel && !isRenaming) {
      setEditedLabel(label)
    }
    // Same shape: editedLabel is what the effect writes, so depending on it
    // would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * Whether the pointer is over the Recycle Bin.
   *
   * elementsFromPoint rather than elementFromPoint, because the icon being
   * dragged sits under the cursor and would otherwise be the only hit.
   */
  const pointerOverBin = (x: number, y: number) => {
    if (id === "recycle-bin") return false
    return document.elementsFromPoint(x, y).some((el) => el.closest('[data-id="recycle-bin"]'))
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    pointerRef.current = { x: e.clientX, y: e.clientY }
    const over = pointerOverBin(e.clientX, e.clientY)
    if (over !== overBinRef.current) {
      overBinRef.current = over
      onDragOverBin?.(over)
    }

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
    if (!isDragging) return
    setIsDragging(false)

    if (overBinRef.current) {
      overBinRef.current = false
      onDragOverBin?.(false)
      // Dropped on the bin, so it is deleted rather than moved and its old
      // position is what Restore will put it back to.
      onDropInBin?.(id)
      return
    }

    // Notify parent component of the new position
    onDragEnd(id, positionRef.current.x, positionRef.current.y)
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
    // The move and up handlers are redefined every render; re-subscribing on
    // each would drop a drag in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // handleRenameSubmit is recreated each render; the listener only needs the
    // one captured when the rename began.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * Icons are true 32x32 bitmaps now, so they are drawn at 32px.
   *
   * The old artwork was 540x500 renders with roughly half the canvas empty,
   * which is why each type needed its own percentage to look the right size
   * and why they came out soft next to the crisp text. A 32px icon drawn at
   * 32px with nearest-neighbour scaling is what Windows 95 put on the desktop.
   */
  const getIconStyle = () => ({
    imageRendering: "pixelated" as const,
    objectFit: "contain" as const,
    width: ICON_PX,
    height: ICON_PX,
  })

  return (
    <div
      ref={iconRef}
      className={`desktop-icon text-center cursor-pointer p-0.5 transition-transform absolute ${
        isDragging ? "opacity-70" : ""
      }`}
      style={{
        width: CELL_PX,
        height: CELL_H,
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
          className="mx-auto"
          draggable="false"
          style={getIconStyle()}
        />
        {isSelected && (
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 bg-[#000080] opacity-50 mix-blend-multiply"
            style={{
              width: ICON_PX,
              height: ICON_PX,
              WebkitMaskImage: `url(${getIconForType()})`,
              maskImage: `url(${getIconForType()})`,
              WebkitMaskSize: `${ICON_PX}px ${ICON_PX}px`,
              maskSize: `${ICON_PX}px ${ICON_PX}px`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
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
          className={`desktop-icon-text mt-1 mb-0 break-words leading-tight text-xs ${
            isSelected ? "border border-dotted border-white" : ""
          }`}
          style={{ height: LABEL_H, overflow: "hidden" }}
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
