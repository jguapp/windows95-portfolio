"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface MenuItem {
  label: string
  labelWithUnderline?: React.ReactNode
  action?: () => void
  divider?: boolean
  disabled?: boolean
  submenu?: boolean
  submenuItems?: MenuItem[]
}

interface ContextMenuProps {
  x: number
  y: number
  menuItems: MenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, menuItems, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null)

  // Adjust position if menu would appear off-screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      // Check if menu extends beyond right edge
      if (x + menuRect.width > windowWidth) {
        menuRef.current.style.left = `${windowWidth - menuRect.width - 5}px`
      }

      // Check if menu extends beyond bottom edge
      if (y + menuRect.height > windowHeight) {
        menuRef.current.style.top = `${windowHeight - menuRect.height - 5}px`
      }
    }
  }, [x, y])

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const handleMouseEnter = (index: number) => {
    if (menuItems[index].submenu) {
      setActiveSubmenu(index)
    } else {
      setActiveSubmenu(null)
    }
  }

  return (
    <div
      ref={menuRef}
      className="context-menu absolute bg-[#c0c0c0] border-t-2 border-l-2 border-[#dfdfdf] border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] shadow-md z-50"
      style={{ left: `${x}px`, top: `${y}px`, width: "160px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-0.5">
        {menuItems.map((item, index) => (
          <div key={index} onMouseEnter={() => handleMouseEnter(index)}>
            <button
              className={`w-full text-left px-2 py-0.5 text-sm flex items-center justify-between ${
                item.disabled ? "text-gray-500" : "hover:bg-[#000080] hover:text-white"
              }`}
              onClick={() => {
                if (!item.disabled && !item.submenu && item.action) {
                  item.action()
                }
              }}
              disabled={item.disabled}
            >
              <span>{item.labelWithUnderline || item.label}</span>
              {item.submenu && <span className="ml-2">▶</span>}
            </button>
            {item.divider && <hr className="my-0.5 border-t border-[#808080] border-b border-b-[#dfdfdf]" />}

            {/* Submenu */}
            {item.submenu && activeSubmenu === index && item.submenuItems && (
              <div
                className="absolute bg-[#c0c0c0] border-t-2 border-l-2 border-[#dfdfdf] border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] shadow-md"
                style={{
                  left: "155px",
                  top: `${index * 21}px`,
                  width: "160px",
                }}
              >
                <div className="p-0.5">
                  {item.submenuItems.map((subItem, subIndex) => (
                    <div key={subIndex}>
                      <button
                        className={`w-full text-left px-2 py-0.5 text-sm flex items-center ${
                          subItem.disabled ? "text-gray-500" : "hover:bg-[#000080] hover:text-white"
                        }`}
                        onClick={() => {
                          if (!subItem.disabled && subItem.action) {
                            subItem.action()
                          }
                        }}
                        disabled={subItem.disabled}
                      >
                        {subItem.labelWithUnderline || subItem.label}
                      </button>
                      {subItem.divider && (
                        <hr className="my-0.5 border-t border-[#808080] border-b border-b-[#dfdfdf]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
