"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CUSTOM_WALLPAPER_ID, WALLPAPERS, getSessionWallpaperId, readCustomWallpaper, setCustomWallpaper as storeCustomWallpaper, setSessionWallpaperId, wallpaperUrl } from "@/lib/wallpapers"
import { COLOR_SCHEMES, applyScheme } from "@/lib/color-schemes"
import { RESOLUTIONS, applyResolution, readResolution } from "@/lib/resolution"
import { CloseIcon } from "@/components/win95-controls"

interface DisplayPropertiesProps {
  onClose: () => void
  /** Which tab to open on. The tray's resolution button asks for Settings. */
  initialTab?: string
}

// The shared wallpaper set; the desktop's restore path reads the same list.
const backgroundImages = WALLPAPERS

// The shared scheme table; the desktop's boot restore reads the same one.
const colorSchemes = COLOR_SCHEMES

export default function DisplayProperties({ onClose, initialTab }: DisplayPropertiesProps) {
  // Load current settings from localStorage or use defaults
  const [activeTab, setActiveTab] = useState(initialTab ?? "background")
  const [selectedBackground, setSelectedBackground] = useState(() => {
    // The session's choice, never storage: a refresh reverts wallpaper.
    return getSessionWallpaperId() || "windows-default"
  })
  const [resolution, setResolution] = useState<string>(() => readResolution())
  const [selectedColorScheme, setSelectedColorScheme] = useState(() => {
    const saved = localStorage.getItem("win95-color-scheme")
    return saved || "windows-standard"
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dialogPosition, setDialogPosition] = useState({ x: 50, y: 50 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  /** A bitmap the visitor supplied, if there is one stored. */
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Read after mount: localStorage during render would not match the server.
  useEffect(() => setCustomWallpaper(readCustomWallpaper()), [])

  // Apply background image to desktop when it changes
  useEffect(() => {
    const desktop = document.getElementById("desktop")
    if (desktop && selectedBackground) {
      // wallpaperUrl resolves the shipped set and the visitor's own upload.
      const url = wallpaperUrl(selectedBackground)
      if (url) {
        desktop.style.backgroundImage = `url(${url})`
        // Wallpaper tiles; Center and Stretch did not exist in 1995.
        desktop.style.backgroundSize = "auto"
        desktop.style.backgroundRepeat = "repeat"
        desktop.style.backgroundPosition = "top left"

        setSessionWallpaperId(selectedBackground)
      }
    }
  }, [selectedBackground])

  // Applying a scheme writes the CSS variables the chrome reads.
  useEffect(() => {
    const scheme = applyScheme(selectedColorScheme)
    // Only repaint the desktop when no wallpaper is covering it.
    const desktop = document.getElementById("desktop")
    if (desktop && (!selectedBackground || selectedBackground === "none")) {
      desktop.style.backgroundColor = scheme.desktop
    }
    localStorage.setItem("win95-color-scheme", selectedColorScheme)
    // selectedBackground is read only to decide whether a scheme may repaint
    // the desktop; changing wallpaper has its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorScheme])

  // Desktop area: the slider maps onto the resolution table and applies as
  // it moves, the way the wallpaper preview does.
  useEffect(() => {
    applyResolution(resolution)
  }, [resolution])

  // Start dragging the dialog
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()

    setIsDragging(true)
    const dialogRect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - dialogRect.left,
      y: e.clientY - dialogRect.top,
    })
  }

  // Handle dialog dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Ensure dialog stays within viewport
      const maxX = window.innerWidth - 500 // approximate dialog width
      const maxY = window.innerHeight - 400 // approximate dialog height

      setDialogPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Update the handleApply function to apply all settings at once
  const handleApply = () => {
    // The scheme persists; the wallpaper lives for the session only.
    setSessionWallpaperId(selectedBackground)
    localStorage.setItem("win95-color-scheme", selectedColorScheme)

    // Apply background image
    const desktop = document.getElementById("desktop")
    if (desktop && selectedBackground) {
      const url = wallpaperUrl(selectedBackground)
      if (url) {
        desktop.style.backgroundImage = `url(${url})`
        // Wallpaper tiles; Center and Stretch did not exist in 1995.
        desktop.style.backgroundSize = "auto"
        desktop.style.backgroundRepeat = "repeat"
        desktop.style.backgroundPosition = "top left"
      }
    }
  }

  const handleSave = () => {
    handleApply()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="absolute bg-[#c0c0c0] border-t-2 border-l-2 border-[#ffffff] border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
        style={{
          width: 420,
          maxHeight: "90vh",
          top: `${dialogPosition.y}px`,
          left: `${dialogPosition.x}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center cursor-move"
          onMouseDown={startDrag}
        >
          <span className="text-sm font-bold">Display Properties</span>
          <button
            className="w-4 h-4 shrink-0 bg-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] cursor-pointer text-black p-0 flex items-center justify-center hover:bg-[#dfdfdf] active:shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff]"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="background" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#c0c0c0] flex border-t border-[#808080] overflow-x-auto">
            <TabsTrigger
              value="background"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:border-b-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "background" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "background" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "background" ? "1px solid #808080" : "none",
                borderTop: activeTab === "background" ? "1px solid #ffffff" : "none",
              }}
            >
              Background
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "appearance" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "appearance" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "appearance" ? "1px solid #808080" : "none",
                borderTop: activeTab === "appearance" ? "1px solid #ffffff" : "none",
              }}
            >
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="py-1 px-3 text-xs border-none rounded-none data-[state=active]:bg-[#c0c0c0] data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:font-bold"
              style={{
                borderBottom: activeTab === "settings" ? "none" : "1px solid #808080",
                borderLeft: activeTab === "settings" ? "1px solid #ffffff" : "none",
                borderRight: activeTab === "settings" ? "1px solid #808080" : "none",
                borderTop: activeTab === "settings" ? "1px solid #ffffff" : "none",
              }}
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Background Tab */}
          <TabsContent
            value="background"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex">
              <div className="flex-1 pr-2">
                <div className="mb-3">
                  <label className="block text-xs mb-1">Wallpaper:</label>
                  <select
                    data-wallpaper-select
                    className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs"
                    value={selectedBackground}
                    onChange={(e) => setSelectedBackground(e.target.value)}
                  >
                    {backgroundImages.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name}
                      </option>
                    ))}
                    {customWallpaper && <option value={CUSTOM_WALLPAPER_ID}>(My Bitmap)</option>}
                  </select>
                </div>

                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    data-wallpaper-random
                    className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-2 py-1 text-xs"
                    style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
                    onClick={() => {
                      // Surprise Me: any wallpaper but the one already on.
                      const others = backgroundImages.filter((bg) => bg.id !== selectedBackground)
                      const pick = others[Math.floor(Math.random() * others.length)]
                      if (pick) setSelectedBackground(pick.id)
                    }}
                  >
                    Surprise Me
                  </button>
                  <button
                    type="button"
                    data-wallpaper-browse
                    className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-2 py-1 text-xs"
                    style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse...
                  </button>
                  <input
                    ref={fileInputRef}
                    data-wallpaper-file
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      // Read as a data URL, held in memory for the
                      // session; wallpaper reverts on refresh by design.
                      const reader = new FileReader()
                      reader.onload = () => {
                        const url = String(reader.result ?? "")
                        if (!url.startsWith("data:image/")) return
                        try {
                          /*
                            Both stores matter: the lib's session memory is
                            what wallpaperUrl resolves when the desktop
                            paints, and the local state is what previews it
                            in this dialog. The local setter shadows the
                            import's name, hence the alias.
                          */
                          storeCustomWallpaper(url)
                          setCustomWallpaper(url)
                          setSelectedBackground(CUSTOM_WALLPAPER_ID)
                        } catch {
                          window.alert("That image could not be read as wallpaper.")
                        }
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ""
                    }}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="w-32 h-32 border border-[#808080] shadow-[inset_1px_1px_#000000] bg-[#008080] relative">
                <div
                  className="absolute inset-2 border border-[#000000]"
                  style={{
                    backgroundImage: `url(${wallpaperUrl(selectedBackground) ?? ""})`,
                    backgroundSize: "auto",
                    backgroundRepeat: "repeat",
                    backgroundPosition: "top left",
                  }}
                >
                  {/* Mini desktop icons */}
                  <div className="w-4 h-4 bg-white absolute left-1 top-1"></div>
                  <div className="w-4 h-4 bg-white absolute left-6 top-1"></div>
                  <div className="w-4 h-4 bg-white absolute left-1 top-6"></div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent
            value="appearance"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex">
              <div className="flex-1 pr-2">
                <div className="mb-3">
                  <label className="block text-xs mb-1">Color Scheme:</label>
                  <select
                    className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs"
                    value={selectedColorScheme}
                    onChange={(e) => setSelectedColorScheme(e.target.value)}
                  >
                    {colorSchemes.map((cs) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Item:</label>
                  <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                    <option>Desktop</option>
                    <option>Active Window</option>
                    <option>Inactive Window</option>
                    <option>Menu</option>
                    <option>Window Text</option>
                    <option>Menu Bar</option>
                    <option>Tooltip</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs mb-1">Size:</label>
                  <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                    <option>Normal</option>
                    <option>Large</option>
                    <option>Extra Large</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="w-32 h-32 border border-[#808080] shadow-[inset_1px_1px_#000000] bg-[#008080] relative">
                {/* Mini Windows 95 preview */}
                <div className="absolute top-1 left-1 right-1 h-5 bg-[#000080]">
                  <div className="absolute top-1 right-1 w-2 h-2 bg-[#c0c0c0]"></div>
                </div>
                <div className="absolute top-7 left-1 w-7 h-20 bg-[#c0c0c0]"></div>
                <div className="absolute bottom-1 left-1 right-1 h-3 bg-[#c0c0c0]"></div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="p-4 mt-0 border-none focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="text-xs mb-3">
              The display settings shown below may not match your monitor's capabilities. Refer to your monitor's
              documentation for more information.
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-1">Color palette:</label>
              <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#000000] bg-white p-1 text-xs">
                <option>256 Color</option>
                <option>High Color (16 bit)</option>
                <option>True Color (24 bit)</option>
                <option>True Color (32 bit)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-1">Desktop area:</label>
              {/* A list, not a slider: four discrete modes deserve four rows. */}
              <div className="border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
                {RESOLUTIONS.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    data-resolution-option={res.id}
                    onClick={() => setResolution(res.id)}
                    className={`block w-full px-2 py-[2px] text-left text-xs ${
                      resolution === res.id ? "bg-[#000080] text-white" : "text-black"
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-center text-xs" data-resolution-label>
                {RESOLUTIONS.find((r) => r.id === resolution)?.label}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-3 py-1 text-xs"
                style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
              >
                Advanced Properties...
              </button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Button Bar */}
        <div className="px-4 py-3 flex justify-end gap-2">
          <button
            className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={handleSave}
          >
            OK
          </button>
          <button
            className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-[#c0c0c0] border border-t-white border-l-white border-r-black border-b-black px-4 py-1"
            style={{ boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080" }}
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
