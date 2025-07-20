"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface DesktopIconProps {
  id: string
  label: string
  icon: string
  isSelected: boolean
  position?: { x: number; y: number }
  onClick: () => void
  onDoubleClick: () => void
  onRightClick: (e: React.MouseEvent) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

export default function DesktopIcon({
  id,
  label,
  icon,
  isSelected,
  position,
  onClick,
  onDoubleClick,
  onRightClick,
  onDragEnd,
}: DesktopIconProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState(position || { x: 0, y: 0 })
  const iconRef = useRef<HTMLDivElement>(null)
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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left mouse button
    if (e.button !== 0) return

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
  }, [isDragging, dragOffset]) // Remove currentPosition from dependencies

  return (
    <div
      ref={iconRef}
      className={`desktop-icon text-center cursor-pointer p-0.5 inline-block transition-transform absolute ${
        isSelected ? "highlighted bg-[#000080]" : "bg-transparent"
      } ${isDragging ? "opacity-70" : ""}`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        zIndex: isDragging ? 100 : 1,
        userSelect: "none", // Prevent text selection during drag
      }}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onRightClick(e)
      }}
      data-id={id}
    >
      <img src={icon || "/placeholder.svg"} alt={`${label} Icon`} className="w-12 h-12 mx-auto" draggable="false" />
      <p
        className={`desktop-icon-text mt-1.5 mb-0 text-xs ${isSelected ? "border border-dotted border-white" : ""}`}
        draggable="false"
      >
        {label}
      </p>
    </div>
  )
}
