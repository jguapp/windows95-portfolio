"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import DesktopItem from "./desktop-item"
import ContextMenu from "./context-menu"
import DisplayProperties from "./display-properties"
import ItemProperties from "./item-properties"
import BlueScreenOfDeath from "./blue-screen-of-death"
import { isEmpty, recycle, subscribe, type RecycledItem } from "@/lib/recycle-bin"
import { MessageBoxHost, messageBox } from "@/components/win95-dialog"

// Add IconPosition type export
export interface IconPosition {
  [key: string]: { x: number; y: number }
}

// Add DesktopItem interface
export interface DesktopItemData {
  id: string
  label: string
  icon: string
  type: "folder" | "shortcut" | "text-document" | "application"
  shortcutTo?: string // Reference to original item if this is a shortcut
  isNew?: boolean // Add this property to track newly created items
}

// Update the existing interface
interface DesktopProps {
  onOpenWindow: (id: string) => void
}

// Update the DEFAULT_ICONS array to use the new icons
const DEFAULT_ICONS: DesktopItemData[] = [
  {
    id: "about-me",
    label: "About Me",
    icon: "/images/win95/about-me-32.png", // Updated icon path
    type: "application",
  },
  {
    id: "resume",
    label: "Resume",
    icon: "/images/win95/resume-32.png", // Updated Resume icon
    type: "application",
  },
  {
    id: "projects",
    label: "My Projects",
    icon: "/images/win95/projects-32.png", // New YouTube icon
    type: "application",
  },
  {
    id: "contact",
    label: "Mail",
    icon: "/images/win95/contact-32.png", // Updated Contact icon
    type: "application",
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: "/images/win95/gallery-32.png", // Updated Gallery icon
    type: "application",
  },
  {
    id: "games",
    label: "Games",
    icon: "/images/win95/games-32.png", // Updated Games icon
    type: "application",
  },
  {
    id: "winamp",
    label: "Winamp",
    icon: "/images/win95/winamp-32.png",
    type: "application",
  },
  {
    id: "paint",
    label: "Paint",
    icon: "/images/win95/paint-32.png", // Updated Paint icon
    type: "application",
  },
  {
    id: "calculator",
    label: "Calculator",
    icon: "/images/win95/calculator-32.png",
    type: "application",
  },
  {
    id: "guestbook",
    label: "Guestbook",
    icon: "/images/win95/guestbook-32.png",
    type: "application",
  },
  {
    id: "recycle-bin",
    label: "Recycle Bin",
    icon: "/images/win95/recycle-empty-32.png",
    type: "application",
  },
]

export default function Desktop({ onOpenWindow }: DesktopProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [iconPositions, setIconPositions] = useState<IconPosition>({})
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    type: "desktop" | "icon"
    iconId?: string
  }>({
    show: false,
    x: 0,
    y: 0,
    type: "desktop",
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [clipboard, setClipboard] = useState<DesktopItemData | null>(null)
  const [icons, setIcons] = useState<DesktopItemData[]>(DEFAULT_ICONS)
  const [nextItemId, setNextItemId] = useState(1)
  const [showProperties, setShowProperties] = useState(false)
  /** The item whose property sheet is open, if any. */
  const [propertiesFor, setPropertiesFor] = useState<DesktopItemData | null>(null)

  // Control Panel in the Start menu opens the only applet that exists here.
  useEffect(() => {
    const open = () => setShowProperties(true)
    window.addEventListener("openDisplayProperties", open)
    return () => window.removeEventListener("openDisplayProperties", open)
  }, [])
  const [showBSOD, setShowBSOD] = useState(false)
  const desktopRef = useRef<HTMLDivElement>(null)

  // Add the following state variables after the other state declarations
  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    endX: number
    endY: number
    isSelecting: boolean
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isSelecting: false,
  })

  // Constants for icon positioning
  // The Windows 95 desktop grid: a 75px cell with the icon at the top and up to
  // two lines of label under it.
  const ICON_SPACING_Y = 92
  /** The taskbar, which icons must not sit under. */
  const TASKBAR_H = 34
  const FIRST_COLUMN_X = 12
  const FIRST_ROW_Y = 12

  /**
   * Where the icons start out.
   *
   * Windows filled the left edge top to bottom and began a second column when
   * it ran out of screen. This did the first half and not the second, so ten
   * icons at 92px made a 932px column that ran off the bottom of anything
   * shorter than a desktop monitor, a phone especially.
   */
  const ICON_COLUMN_W = 84

  const initializeIconPositions = useCallback(() => {
    const defaultPositions: IconPosition = {}
    const order = [
      "about-me",
      "resume",
      "projects",
      "contact",
      "gallery",
      "games",
      "winamp",
      "paint",
      "calculator",
      "guestbook",
      "recycle-bin",
    ]

    // How many fit above the taskbar, with at least one so the maths holds on
    // a very short window.
    const available =
      (typeof window === "undefined" ? 900 : window.innerHeight) - TASKBAR_H - FIRST_ROW_Y
    const perColumn = Math.max(1, Math.floor(available / ICON_SPACING_Y))

    order.forEach((id, i) => {
      defaultPositions[id] = {
        x: FIRST_COLUMN_X + Math.floor(i / perColumn) * ICON_COLUMN_W,
        y: FIRST_ROW_Y + (i % perColumn) * ICON_SPACING_Y,
      }
    })

    return defaultPositions
  }, [])

  // Also update the resetToDefaultIcons function to use the same positioning
  const resetToDefaultIcons = useCallback(() => {
    setIcons(DEFAULT_ICONS)
    setIconPositions(initializeIconPositions())
    setNextItemId(1)
  }, [initializeIconPositions])

  // Check if clipboard has content
  const hasClipboardContent = clipboard !== null

  // Load saved background settings but reset icons on page refresh
  useEffect(() => {
    if (isInitialized) return

    try {
      // Always start from the default grid. Restoring saved positions meant an
      // icon dragged out of line stayed out of line for good, including the
      // Recycle Bin, and any icon added since the save had no position at all
      // and stacked on top of the first one.
      localStorage.removeItem("win95-icon-positions")
      resetToDefaultIcons()

      // Load saved background settings
      const savedBackground = localStorage.getItem("win95-background-image")
      const savedPattern = localStorage.getItem("win95-background-pattern")
      const savedColorScheme = localStorage.getItem("win95-color-scheme")

      // Apply saved background if it exists
      if (savedBackground && desktopRef.current) {
        const bgImage = savedBackground
        const pattern = savedPattern || "center"

        // Find the background image URL
        const backgroundImageObj = [
          {
            id: "windows-default",
            name: "Windows Default",
            url: "/images/wallpapers/teal.png",
          },
          {
            id: "clouds",
            name: "Clouds",
            url: "/images/wallpapers/clouds.png",
          },
          {
            id: "bricks",
            name: "Bricks",
            url: "/images/wallpapers/bricks.png",
          },
          {
            id: "maze",
            name: "Maze",
            url: "/images/wallpapers/maze.png",
          },
          {
            id: "waves",
            name: "Waves",
            url: "/images/wallpapers/waves.png",
          },
        ].find((bg) => bg.id === bgImage)

        if (backgroundImageObj) {
          desktopRef.current.style.backgroundImage = `url(${backgroundImageObj.url})`

          // Set background size and repeat based on pattern
          if (pattern === "center") {
            desktopRef.current.style.backgroundSize = "auto"
            desktopRef.current.style.backgroundRepeat = "no-repeat"
            desktopRef.current.style.backgroundPosition = "center"
          } else if (pattern === "tile") {
            desktopRef.current.style.backgroundSize = "auto"
            desktopRef.current.style.backgroundRepeat = "repeat"
            desktopRef.current.style.backgroundPosition = "top left"
          } else if (pattern === "stretch") {
            desktopRef.current.style.backgroundSize = "cover"
            desktopRef.current.style.backgroundRepeat = "no-repeat"
            desktopRef.current.style.backgroundPosition = "center"
          }
        }
      }

      // Apply saved color scheme
      if (savedColorScheme) {
        // Apply color scheme
        let desktopColor = "#008080" // Default teal

        switch (savedColorScheme) {
          case "brick":
            desktopColor = "#800000" // Maroon
            break
          case "desert":
            desktopColor = "#d2b48c" // Tan
            break
          case "eggplant":
            desktopColor = "#604080" // Purple
            break
          case "lilac":
            desktopColor = "#c8a2c8" // Light purple
            break
          case "maple":
            desktopColor = "#804000" // Brown
            break
          case "rose":
            desktopColor = "#ff80a0" // Pink
            break
          case "spruce":
            desktopColor = "#006040" // Dark green
            break
          case "wheat":
            desktopColor = "#f5deb3" // Wheat
            break
          case "wine":
            desktopColor = "#800020" // Burgundy
            break
          default: // Windows Standard
            desktopColor = "#008080" // Teal
            break
        }

        // Apply desktop color if no background image
        if (!savedBackground && desktopRef.current) {
          desktopRef.current.style.backgroundColor = desktopColor
        }

        // Set CSS variables
        document.documentElement.style.setProperty("--win95-desktop-color", desktopColor)
      }

      setIsInitialized(true)
    } catch (error) {
      console.error("Error loading data:", error)
      resetToDefaultIcons()
      setIsInitialized(true)
    }
  }, [isInitialized, resetToDefaultIcons, initializeIconPositions])

  const handleIconClick = (id: string) => {
    setSelectedIcon(id)
  }

  const handleDesktopClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the desktop
    if (e.target === desktopRef.current) {
      setSelectedIcon(null)
      closeContextMenu()
    }
  }

  const handleDesktopRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: "desktop",
    })
  }

  const handleIconRightClick = (e: React.MouseEvent, id: string) => {
    setSelectedIcon(id)
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: "icon",
      iconId: id,
    })
  }

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }))
  }

  const handleIconDragEnd = (id: string, x: number, y: number) => {
    // Update the position for this icon
    setIconPositions((prev) => {
      const newPositions = {
        ...prev,
        [id]: { x, y },
      }
      // Save positions to localStorage
      localStorage.setItem("win95-icon-positions", JSON.stringify(newPositions))
      return newPositions
    })
  }

  // Arrange icons functions
  const handleArrangeByName = () => {
    const sortedIcons = [...icons].sort((a, b) => a.label.localeCompare(b.label))
    const newPositions: IconPosition = {}

    sortedIcons.forEach((icon, index) => {
      newPositions[icon.id] = {
        x: FIRST_COLUMN_X,
        y: FIRST_ROW_Y + index * ICON_SPACING_Y,
      }
    })

    setIconPositions(newPositions)
    closeContextMenu()
  }

  const handleArrangeByType = () => {
    // Group by file extension (in a real app)
    // For this demo, we'll just sort by ID
    const sortedIcons = [...icons].sort((a, b) => a.id.localeCompare(b.id))
    const newPositions: IconPosition = {}

    sortedIcons.forEach((icon, index) => {
      newPositions[icon.id] = {
        x: FIRST_COLUMN_X,
        y: FIRST_ROW_Y + index * ICON_SPACING_Y,
      }
    })

    setIconPositions(newPositions)
    closeContextMenu()
  }

  const handleArrangeBySize = () => {
    // In a real app, we would sort by file size
    // For this demo, we'll just sort by label length
    const sortedIcons = [...icons].sort((a, b) => a.label.length - b.label.length)
    const newPositions: IconPosition = {}

    sortedIcons.forEach((icon, index) => {
      newPositions[icon.id] = {
        x: FIRST_COLUMN_X,
        y: FIRST_ROW_Y + index * ICON_SPACING_Y,
      }
    })

    setIconPositions(newPositions)
    closeContextMenu()
  }

  const handleArrangeByDate = () => {
    // In a real app, we would sort by date
    // For this demo, we'll just reverse the current order
    const sortedIcons = [...icons].reverse()
    const newPositions: IconPosition = {}

    sortedIcons.forEach((icon, index) => {
      newPositions[icon.id] = {
        x: FIRST_COLUMN_X,
        y: FIRST_ROW_Y + index * ICON_SPACING_Y,
      }
    })

    setIconPositions(newPositions)
    closeContextMenu()
  }

  // Auto arrange - grid layout
  const handleAutoArrange = () => {
    const newPositions: IconPosition = {}
    const iconWidth = 80
    const iconHeight = ICON_SPACING_Y
    const desktopPadding = FIRST_ROW_Y
    const iconsPerColumn = Math.floor((window.innerHeight - 100) / iconHeight)

    icons.forEach((icon, index) => {
      const column = Math.floor(index / iconsPerColumn)
      const row = index % iconsPerColumn

      newPositions[icon.id] = {
        x: desktopPadding + column * iconWidth,
        y: desktopPadding + row * iconHeight,
      }
    })

    setIconPositions(newPositions)
    closeContextMenu()
  }

  // Line up icons - reset to default positions
  const handleLineUpIcons = () => {
    // Reset icons to their original default positions
    const defaultPositions = initializeIconPositions()
    setIconPositions(defaultPositions)
    closeContextMenu()
  }

  // Copy the selected icon to clipboard
  const handleCopy = () => {
    if (selectedIcon) {
      const iconToCopy = icons.find((icon) => icon.id === selectedIcon)
      if (iconToCopy) {
        setClipboard(iconToCopy)
      }
    }
    closeContextMenu()
  }

  // Paste the clipboard content
  const handlePaste = () => {
    if (clipboard) {
      // Create a new ID for the pasted item
      const newId = `copy-${nextItemId}`

      // Create a copy of the clipboard item with a new ID but preserve the original application ID
      const newIcon: DesktopItemData = {
        ...clipboard,
        id: newId,
        label: `Copy of ${clipboard.label}`,
        // For application type, we want to keep the original ID for window opening
        // For other types, we create a normal copy
        shortcutTo: clipboard.type === "application" ? clipboard.id : undefined,
      }

      // Add the new icon to the desktop
      setIcons((prev) => [...prev, newIcon])

      // Position the new icon near the cursor
      setIconPositions((prev) => ({
        ...prev,
        [newId]: {
          x: Math.max(0, contextMenu.x - 20),
          y: Math.max(0, contextMenu.y - 20),
        },
      }))

      // Increment the ID counter
      setNextItemId((prev) => prev + 1)
    }
    closeContextMenu()
  }

  // Create a shortcut to the selected icon
  const handleCreateShortcut = () => {
    if (contextMenu.iconId) {
      const originalIcon = icons.find((icon) => icon.id === contextMenu.iconId)
      if (originalIcon) {
        // Create a new shortcut
        const shortcutId = `shortcut-${nextItemId}`
        const shortcut: DesktopItemData = {
          id: shortcutId,
          label: `Shortcut to ${originalIcon.label}`,
          icon: "/images/shortcut-icon.png",
          type: "shortcut",
          shortcutTo: originalIcon.id,
        }

        // Add the shortcut to the desktop
        setIcons((prev) => [...prev, shortcut])

        // Position the shortcut near the original icon
        const originalPos = iconPositions[originalIcon.id] || { x: FIRST_COLUMN_X, y: FIRST_ROW_Y }
        setIconPositions((prev) => ({
          ...prev,
          [shortcutId]: {
            x: originalPos.x + 30,
            y: originalPos.y + 30,
          },
        }))

        // Increment the ID counter
        setNextItemId((prev) => prev + 1)
      }
    }
    closeContextMenu()
  }

  // Delete the selected icon
  const handleDelete = () => {
    if (contextMenu.iconId) {
      // Move it to the Recycle Bin rather than destroying it, keeping its
      // position so Restore can put it back in the same spot.
      const doomed = icons.find((icon) => icon.id === contextMenu.iconId)
      if (doomed && doomed.id !== "recycle-bin") recycle(doomed, iconPositions)

      setIcons((prev) => prev.filter((icon) => icon.id !== contextMenu.iconId))

      // Remove the icon's position
      setIconPositions((prev) => {
        const newPositions = { ...prev }
        delete newPositions[contextMenu.iconId!]
        return newPositions
      })

      // Clear selection if the deleted icon was selected
      if (selectedIcon === contextMenu.iconId) {
        setSelectedIcon(null)
      }
    }
    closeContextMenu()
  }

  /** True while an icon is being dragged over the Recycle Bin. */
  const [binHover, setBinHover] = useState(false)

  /**
   * Drop an icon on the Recycle Bin.
   *
   * Same outcome as Delete from the context menu: the icon moves into the bin
   * with the position it had, so Restore can put it back where it was.
   */
  const handleDropInBin = (id: string) => {
    setBinHover(false)
    const doomed = icons.find((icon) => icon.id === id)
    if (!doomed || doomed.id === "recycle-bin") return

    recycle(doomed, iconPositions)
    setIcons((prev) => prev.filter((icon) => icon.id !== id))
    setIconPositions((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (selectedIcon === id) setSelectedIcon(null)
  }

  // The bin's artwork tracks whether it holds anything.
  const [binEmpty, setBinEmpty] = useState(true)
  useEffect(() => subscribe(() => setBinEmpty(isEmpty())), [])

  useEffect(() => {
    setIcons((prev) =>
      prev.map((icon) =>
        icon.id === "recycle-bin"
          ? {
              ...icon,
              icon: binEmpty ? "/images/win95/recycle-empty-32.png" : "/images/win95/recycle-full-32.png",
            }
          : icon,
      ),
    )
  }, [binEmpty])

  // Restoring from the bin puts the icon back where it was.
  useEffect(() => {
    const onRestore = (event: Event) => {
      const { item, position } = (event as CustomEvent<RecycledItem>).detail
      setIcons((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
      if (position) setIconPositions((prev) => ({ ...prev, [item.id]: position }))
    }
    window.addEventListener("recycleRestore", onRestore)
    return () => window.removeEventListener("recycleRestore", onRestore)
  }, [])

  // Check if all icons are deleted and trigger BSOD
  useEffect(() => {
    if (isInitialized && icons.length === 0) {
      setShowBSOD(true)
    }
  }, [icons, isInitialized])

  // Handle BSOD restart
  const handleRestart = () => {
    setShowBSOD(false)
    resetToDefaultIcons()
  }

  /** Right-clicking the desktop opens Display Properties, as it did. */
  const handleProperties = () => {
    setShowProperties(true)
    closeContextMenu()
  }

  /** Right-clicking an icon opens that item's own sheet instead. */
  const handleItemProperties = () => {
    const item = icons.find((i) => i.id === contextMenu.iconId)
    if (item) setPropertiesFor(item)
    closeContextMenu()
  }

  // New item functions
  const createNewItem = (type: "folder" | "shortcut" | "text-document", position: { x: number; y: number }) => {
    let label, id, icon

    // Set defaults based on type
    switch (type) {
      case "folder":
        label = "New Folder"
        id = `folder-${nextItemId}`
        icon = "/images/folder-icon.png" // Updated to use the new folder icon
        break
      case "shortcut":
        label = "New Shortcut"
        id = `shortcut-${nextItemId}`
        icon = "/images/shortcut-icon.png"
        break
      case "text-document":
        label = "New Text Document"
        id = `text-${nextItemId}`
        icon = "/images/notepad-icon.png" // Updated to use the new document icon
        break
    }

    // Add the new icon with isNew set to true
    const newIcon: DesktopItemData = {
      id,
      label,
      icon,
      type,
      isNew: true, // Set this to true for new items
    }

    setIcons((prev) => [...prev, newIcon])

    // Update icon positions to include the new icon
    setIconPositions((prev) => ({
      ...prev,
      [id]: position,
    }))

    // Set it as selected and increment the id counter
    setSelectedIcon(id)
    setNextItemId((prev) => prev + 1)
  }

  // Add this function to rename icons
  const handleRenameIcon = (id: string, newName: string) => {
    setIcons((prev) => prev.map((icon) => (icon.id === id ? { ...icon, label: newName } : icon)))
  }

  const handleNewFolder = () => {
    // Get center position relative to context menu
    const position = {
      x: Math.max(0, contextMenu.x - 20),
      y: Math.max(0, contextMenu.y - 20),
    }
    createNewItem("folder", position)
    closeContextMenu()
  }

  const handleNewShortcut = () => {
    // Get center position relative to context menu
    const position = {
      x: Math.max(0, contextMenu.x - 20),
      y: Math.max(0, contextMenu.y - 20),
    }
    createNewItem("shortcut", position)
    closeContextMenu()
  }

  const handleNewTextDocument = () => {
    // Get center position relative to context menu
    const position = {
      x: Math.max(0, contextMenu.x - 20),
      y: Math.max(0, contextMenu.y - 20),
    }
    createNewItem("text-document", position)
    closeContextMenu()
  }

  const handleIconDoubleClick = (id: string) => {
    // Find the clicked icon
    const clickedIcon = icons.find((icon) => icon.id === id)

    if (clickedIcon) {
      // If it's a shortcut or a copy of an application, open the original window
      if (clickedIcon.shortcutTo) {
        onOpenWindow(clickedIcon.shortcutTo)
      } else {
        // Otherwise open the window directly
        onOpenWindow(id)
      }

      // For folder type, show an alert
      if (clickedIcon.type === "folder") {
        messageBox({ title: "Folder", text: "This is a folder.", icon: "information" })
      }

      // For text document, open in Paint as a placeholder
      if (clickedIcon.type === "text-document") {
        onOpenWindow("paint")
      }
    }
  }

  // Define context menu items based on what was clicked
  const getContextMenuItems = () => {
    if (contextMenu.type === "desktop") {
      return [
        {
          label: "Arrange Icons",
          labelWithUnderline: (
            <>
              Arrange <u>I</u>cons
            </>
          ),
          submenu: true,
          submenuItems: [
            {
              label: "by Name",
              labelWithUnderline: (
                <>
                  by <u>N</u>ame
                </>
              ),
              action: handleArrangeByName,
            },
            {
              label: "by Type",
              labelWithUnderline: (
                <>
                  by <u>T</u>ype
                </>
              ),
              action: handleArrangeByType,
            },
            {
              label: "by Size",
              labelWithUnderline: (
                <>
                  by Si<u>z</u>e
                </>
              ),
              action: handleArrangeBySize,
            },
            {
              label: "by Date",
              labelWithUnderline: (
                <>
                  by <u>D</u>ate
                </>
              ),
              action: handleArrangeByDate,
              divider: true,
            },
            {
              label: "Auto Arrange",
              labelWithUnderline: (
                <>
                  <u>A</u>uto Arrange
                </>
              ),
              action: handleAutoArrange,
            },
          ],
        },
        {
          label: "Line up Icons",
          labelWithUnderline: (
            <>
              Lin<u>e</u> up Icons
            </>
          ),
          action: handleLineUpIcons,
          divider: true,
        },
        {
          label: "Paste",
          labelWithUnderline: (
            <>
              <u>P</u>aste
            </>
          ),
          action: handlePaste,
          disabled: !hasClipboardContent,
        },
        {
          label: "Paste Shortcut",
          labelWithUnderline: (
            <>
              Paste <u>S</u>hortcut
            </>
          ),
          action: handlePaste,
          disabled: !hasClipboardContent,
          divider: true,
        },
        {
          label: "New",
          labelWithUnderline: (
            <>
              Ne<u>w</u>
            </>
          ),
          submenu: true,
          submenuItems: [
            {
              label: "Folder",
              labelWithUnderline: (
                <>
                  <u>F</u>older
                </>
              ),
              action: handleNewFolder,
            },
            {
              label: "Shortcut",
              labelWithUnderline: (
                <>
                  <u>S</u>hortcut
                </>
              ),
              action: handleNewShortcut,
              divider: true,
            },
            {
              label: "Text Document",
              action: handleNewTextDocument,
            },
          ],
          divider: true,
        },
        {
          label: "Properties",
          labelWithUnderline: "Properties",
          action: handleProperties,
        },
      ]
    } else {
      // Icon context menu
      return [
        {
          label: "Open",
          labelWithUnderline: (
            <>
              <u>O</u>pen
            </>
          ),
          action: () => {
            if (contextMenu.iconId) {
              onOpenWindow(contextMenu.iconId)
              closeContextMenu()
            }
          },
        },
        {
          label: "Send To",
          labelWithUnderline: (
            <>
              Sen<u>d</u> To
            </>
          ),
          action: () => {
            messageBox({ title: "Send To", text: "The Send To menu would open here.", icon: "information" })
            closeContextMenu()
          },
        },
        {
          label: "Cut",
          labelWithUnderline: (
            <>
              Cu<u>t</u>
            </>
          ),
          action: () => {
            handleCopy()
            handleDelete()
          },
          divider: true,
        },
        {
          label: "Copy",
          labelWithUnderline: (
            <>
              <u>C</u>opy
            </>
          ),
          action: handleCopy,
        },
        {
          label: "Create Shortcut",
          labelWithUnderline: "Create Shortcut",
          action: handleCreateShortcut,
          divider: true,
        },
        {
          label: "Delete",
          labelWithUnderline: (
            <>
              <u>D</u>elete
            </>
          ),
          action: handleDelete,
          divider: true,
        },
        {
          label: "Rename",
          labelWithUnderline: (
            <>
              R<u>e</u>name
            </>
          ),
          action: () => {
            // Find the icon element and trigger rename
            const iconElement = document.querySelector(
              `[data-id="${contextMenu.iconId}"] .desktop-icon-text`,
            ) as HTMLElement
            if (iconElement) {
              iconElement.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
            }
            closeContextMenu()
          },
          divider: true,
        },
        {
          label: "Properties",
          labelWithUnderline: (
            <>
              P<u>r</u>operties
            </>
          ),
          action: handleItemProperties,
        },
      ]
    }
  }

  // Completely rewritten mouse event handlers for selection box
  const [isMouseDown, setIsMouseDown] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if clicking directly on the desktop background
    // Check if the click target is the desktop element itself
    if (e.target === desktopRef.current) {
      e.preventDefault() // Prevent default browser behavior

      // Set initial selection box coordinates
      const rect = desktopRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setSelectionBox({
          startX: x,
          startY: y,
          endX: x,
          endY: x,
          isSelecting: true,
        })

        setIsMouseDown(true)
        setSelectedIcon(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox.isSelecting && isMouseDown) {
      const rect = desktopRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setSelectionBox((prev) => ({
          ...prev,
          endX: x,
          endY: y,
        }))
      }
    }
  }

  const handleMouseUp = () => {
    if (selectionBox.isSelecting) {
      // Calculate the selection rectangle
      const selectionRect = {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        right: Math.max(selectionBox.startX, selectionBox.endX),
        bottom: Math.max(selectionBox.startY, selectionBox.endY),
      }

      // Find all icons that are within the selection rectangle
      const selectedIcons: string[] = []
      icons.forEach((icon) => {
        const iconPos = iconPositions[icon.id] || { x: 0, y: 0 }
        const iconRect = {
          left: iconPos.x,
          top: iconPos.y,
          right: iconPos.x + 70, // Approximate icon width
          bottom: iconPos.y + 80, // Approximate icon height
        }

        // Check if the icon intersects with the selection rectangle
        if (
          iconRect.left < selectionRect.right &&
          iconRect.right > selectionRect.left &&
          iconRect.top < selectionRect.bottom &&
          iconRect.bottom > selectionRect.top
        ) {
          selectedIcons.push(icon.id)
        }
      })

      // If multiple icons are selected, we could implement multi-select functionality
      // For now, just select the last icon in the selection
      if (selectedIcons.length > 0) {
        setSelectedIcon(selectedIcons[selectedIcons.length - 1])
      }

      // Reset the selection box
      setSelectionBox({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isSelecting: false,
      })

      setIsMouseDown(false)
    }
  }

  // Add a global mouse up handler to handle cases where the mouse is released outside the desktop
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (selectionBox.isSelecting) {
        setSelectionBox({
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          isSelecting: false,
        })
        setIsMouseDown(false)
      }
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [selectionBox.isSelecting])

  return (
    <>
      <div
        ref={desktopRef}
        id="desktop"
        className="w-full h-[calc(100vh-34px)] p-2.5 relative"
        onClick={handleDesktopClick}
        onContextMenu={handleDesktopRightClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundColor: "var(--win95-desktop-color, #008080)",
          backgroundImage: `url(/images/wallpapers/teal.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          overflow: "hidden", // Prevent scrolling when dragging to edges
        }}
      >
        {isInitialized &&
          icons.map((icon) => (
            <DesktopItem
              key={icon.id}
              id={icon.id}
              label={icon.label}
              icon={icon.icon}
              type={icon.type}
              isSelected={selectedIcon === icon.id || (icon.id === "recycle-bin" && binHover)}
              position={iconPositions[icon.id]}
              isNew={icon.isNew}
              onClick={() => handleIconClick(icon.id)}
              onDoubleClick={() => handleIconDoubleClick(icon.id)}
              onRightClick={(e) => handleIconRightClick(e, icon.id)}
              onDragEnd={handleIconDragEnd}
              onDropInBin={handleDropInBin}
              onDragOverBin={setBinHover}
              onRename={(id, newName) => {
                handleRenameIcon(id, newName)
                // Clear the isNew flag after renaming
                setIcons((prev) => prev.map((icon) => (icon.id === id ? { ...icon, isNew: false } : icon)))
              }}
            />
          ))}

        {/* Selection Box */}
        {selectionBox.isSelecting && (
          <div
            // Windows 95 drew a dotted marquee, nothing filled. The blue wash
            // is XP's look, a whole OS too late.
            className="absolute z-50 border border-dotted border-white mix-blend-difference"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
              pointerEvents: "none", // Allow mouse events to pass through
            }}
          />
        )}

        {/* Context Menu */}
        {contextMenu.show && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={closeContextMenu}
            menuItems={getContextMenuItems()}
          />
        )}
        {showProperties && <DisplayProperties onClose={() => setShowProperties(false)} />}
        {propertiesFor && (
          <ItemProperties item={propertiesFor} onClose={() => setPropertiesFor(null)} />
        )}
      </div>

      {/* Blue Screen of Death */}
      {showBSOD && <BlueScreenOfDeath onRestart={handleRestart} />}

      {/* Mounted once so any part of the shell can put up a message box. */}
      <MessageBoxHost />
    </>
  )
}
