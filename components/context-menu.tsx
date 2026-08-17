"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

import { markRightDismiss } from "@/lib/context-dismiss"

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
        // A right-click dismissal must not be reopened by the contextmenu
        // event that follows this same mousedown.
        if (e.button === 2) markRightDismiss()
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
      className="context-menu absolute z-50 select-none bg-[#c5c4c4] p-[4px_2px] outline outline-1 outline-white"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: 138,
        border: "2px solid #eeeded",
        borderRightColor: "#000000",
        borderRightWidth: 1,
        borderBottomColor: "#000000",
        borderBottomWidth: 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-0.5">
        {menuItems.map((item, index) => (
          <div key={index} onMouseEnter={() => handleMouseEnter(index)}>
            <button
              className={`relative w-full whitespace-nowrap text-left text-[12px] py-[2px] pl-6 pr-6 block ${
                item.disabled ? "text-[#8a8989]" : "hover:bg-[#040d91] hover:text-white"
              }`}
              onClick={() => {
                if (!item.disabled && !item.submenu && item.action) {
                  item.action()
                }
              }}
              disabled={item.disabled}
            >
              <span>{item.labelWithUnderline || item.label}</span>
              {item.submenu && <span className="absolute right-1 top-[5px] text-[9px]">▶</span>}
            </button>
            {item.divider && <div className="mx-0 my-1" style={{ borderBottom: "2.5px groove #eae8e8" }} />}

            {/* Submenu */}
            {item.submenu && activeSubmenu === index && item.submenuItems && (
              <div
                className="absolute select-none bg-[#c5c4c4] p-[4px_2px] outline outline-1 outline-white"
                style={{
                  left: "calc(100% - 4px)",
                  top: `${index * 22}px`,
                  minWidth: 138,
                  border: "2px solid #eeeded",
                  borderRightColor: "#000000",
                  borderRightWidth: 1,
                  borderBottomColor: "#000000",
                  borderBottomWidth: 1,
                }}
              >
                <div className="p-0.5">
                  {item.submenuItems.map((subItem, subIndex) => (
                    <div key={subIndex}>
                      <button
                        className={`w-full whitespace-nowrap text-left text-[12px] py-[2px] pl-6 pr-6 block ${
                          subItem.disabled ? "text-[#8a8989]" : "hover:bg-[#040d91] hover:text-white"
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
                        <div className="mx-0 my-1" style={{ borderBottom: "2.5px groove #eae8e8" }} />
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
