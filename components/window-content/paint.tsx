"use client"

import { useState, useRef, useEffect } from "react"
import { PALETTE, TOOLS, ToolGlyph } from "./paint-parts"
import { CUSTOM_WALLPAPER_ID, CUSTOM_WALLPAPER_KEY } from "@/lib/wallpapers"
import type React from "react"
import { messageBox } from "@/components/win95-dialog"

type Tool =
  | "pencil"
  | "brush"
  | "eraser"
  | "line"
  | "rectangle"
  | "circle"
  | "fill"
  | "text"
  | "eyedropper"
  | "magnifier"
  | "curve"
  | "polygon"
  | "roundedRect"
  | "select"
  | "freeform"
  | "airbrush"

type Color = string
type Point = { x: number; y: number }
type SelectionArea = { x: number; y: number; width: number; height: number } | null
type CurvePoint = Point | null
type PolygonPoints = Point[]

export default function Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const [tool, setTool] = useState<Tool>("pencil")
  /** Where the pointer is on the canvas, for the status bar. */
  const [cursorPos, setCursorPos] = useState<Point | null>(null)
  const [color, setColor] = useState<Color>("#000000")
  const [backgroundColor, setBackgroundColor] = useState<Color>("#FFFFFF")
  const [lineWidth, setLineWidth] = useState<number>(1)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [startPos, setStartPos] = useState<Point | null>(null)
  const [fileName, setFileName] = useState<string>("Untitled.bmp")
  const [isModified, setIsModified] = useState<boolean>(false)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [selectionArea, setSelectionArea] = useState<SelectionArea>(null)
  const [selectionContent, setSelectionContent] = useState<ImageData | null>(null)
  const [isMovingSelection, setIsMovingSelection] = useState<boolean>(false)
  const [textInput, setTextInput] = useState<string>("")
  const [textPosition, setTextPosition] = useState<Point | null>(null)
  /** The text tool's face and size, chosen in the tool options panel. */
  const [fontFamily, setFontFamily] = useState<string>("Arial")
  const [fontSize, setFontSize] = useState<number>(12)
  const textFont = `${fontSize}px ${fontFamily}`
  /** Airbrush spray width: the three nozzles Paint offered. */
  const [sprayRadius, setSprayRadius] = useState<number>(9)
  /** The clipboard, and the dialogs Image opens. */
  const [clipboard, setClipboard] = useState<ImageData | null>(null)
  const [showFlip, setShowFlip] = useState<boolean>(false)
  const [showStretch, setShowStretch] = useState<boolean>(false)
  const [showTextInput, setShowTextInput] = useState<boolean>(false)
  const [curvePoints, setCurvePoints] = useState<CurvePoint[]>([null, null, null])
  const [curveStage, setCurveStage] = useState<number>(0)
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoints>([])
  const [isPolygonComplete, setIsPolygonComplete] = useState<boolean>(false)
  const [fillStyle, setFillStyle] = useState<"solid" | "transparent">("transparent")

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const container = canvas.parentElement
      if (!container) return

      // Set canvas to a much larger size (3x the container size)
      canvas.width = Math.max(container.clientWidth * 3, 2000)
      canvas.height = Math.max(container.clientHeight * 3, 1500)

      // Get context and set default styles
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      // Fill with white background (only if first initialization)
      if (undoStack.length === 0) {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        saveState()
      } else {
        // Restore the last state
        const lastState = undoStack[undoStack.length - 1]
        if (lastState) {
          // Create a temporary canvas to scale the image
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = canvas.width
          tempCanvas.height = canvas.height
          const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })
          if (tempCtx) {
            tempCtx.fillStyle = "#FFFFFF"
            tempCtx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw the last state scaled to the new canvas size
            const lastStateCanvas = document.createElement("canvas")
            lastStateCanvas.width = lastState.width
            lastStateCanvas.height = lastState.height
            const lastStateCtx = lastStateCanvas.getContext("2d", { willReadFrequently: true })
            if (lastStateCtx) {
              lastStateCtx.putImageData(lastState, 0, 0)
              tempCtx.drawImage(lastStateCanvas, 0, 0, lastState.width, lastState.height)
              ctx.drawImage(tempCanvas, 0, 0)
              saveState()
            }
          }
        }
      }
    }

    // Initial resize
    resizeCanvas()

    // Add resize event listener
    window.addEventListener("resize", resizeCanvas)

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
    // The first snapshot only. undoStack is what this seeds, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle text input focus when shown
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [showTextInput])

  // Save current canvas state
  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack((prev) => [...prev, imageData])
    setRedoStack([])
  }

  // Handle undo
  const handleUndo = () => {
    if (undoStack.length <= 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Save current state to redo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setRedoStack((prev) => [...prev, currentState])

    // Remove current state from undo stack
    const newUndoStack = [...undoStack]
    newUndoStack.pop()
    setUndoStack(newUndoStack)

    // Restore previous state
    if (newUndoStack.length > 0) {
      ctx.putImageData(newUndoStack[newUndoStack.length - 1], 0, 0)
    }
  }

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Get last state from redo stack
    const newRedoStack = [...redoStack]
    const stateToRestore = newRedoStack.pop()
    setRedoStack(newRedoStack)

    // Save current state to undo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack((prev) => [...prev, currentState])

    // Restore state
    if (stateToRestore) {
      ctx.putImageData(stateToRestore, 0, 0)
    }
  }

  // Handle tool selection
  const handleToolSelect = (selectedTool: Tool) => {
    // Reset tool-specific states when changing tools
    if (selectedTool !== "text") {
      setShowTextInput(false)
    }

    if (selectedTool !== "curve") {
      setCurvePoints([null, null, null])
      setCurveStage(0)
    }

    if (selectedTool !== "polygon") {
      setPolygonPoints([])
      setIsPolygonComplete(false)
    }

    if (selectedTool !== "select" && selectedTool !== "freeform") {
      commitSelection()
    }

    setTool(selectedTool)
  }

  // Handle color selection
  const handleColorSelect = (selectedColor: Color) => {
    setColor(selectedColor)
  }

  // Handle background color selection (right-click)
  const handleBackgroundColorSelect = (e: React.MouseEvent, selectedColor: Color) => {
    e.preventDefault()
    setBackgroundColor(selectedColor)
    return false
  }

  // Handle line width selection
  // Handle fill style selection
  // Fill algorithm (flood fill)
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert color string to RGBA
    const fillColorRGB = hexToRgb(fillColor)
    if (!fillColorRGB) return

    // Get the color at the start position
    const startPos = (startY * canvas.width + startX) * 4
    const startR = data[startPos]
    const startG = data[startPos + 1]
    const startB = data[startPos + 2]
    const startA = data[startPos + 3]

    // If target color is the same as fill color, return
    if (startR === fillColorRGB.r && startG === fillColorRGB.g && startB === fillColorRGB.b) {
      return
    }

    // Queue for flood fill
    const queue: [number, number][] = []
    queue.push([startX, startY])

    while (queue.length > 0) {
      const [x, y] = queue.shift()!
      const pos = (y * canvas.width + x) * 4

      // Check if this pixel is the target color
      if (
        data[pos] === startR &&
        data[pos + 1] === startG &&
        data[pos + 2] === startB &&
        data[pos + 3] === startA &&
        x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height
      ) {
        // Set the color
        data[pos] = fillColorRGB.r
        data[pos + 1] = fillColorRGB.g
        data[pos + 2] = fillColorRGB.b
        data[pos + 3] = 255

        // Add neighbors to queue
        queue.push([x + 1, y])
        queue.push([x - 1, y])
        queue.push([x, y + 1])
        queue.push([x, y - 1])
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0)
  }

  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  // Get color at position (eyedropper)
  const getColorAtPosition = (x: number, y: number): string => {
    const canvas = canvasRef.current
    if (!canvas) return "#000000"

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return "#000000"

    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1]
      .toString(16)
      .padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`
    return hex
  }

  /*
    The magnifier is a view, not an edit.

    The canvas element carries a CSS transform driven by zoomLevel and the
    pointer math divides by it, so setting the level is the entire job. This
    used to also redraw the bitmap scaled, which baked every zoom into the
    drawing; zooming back out then shrank the already-scaled pixels and the
    original was gone for good.
  */
  const handleZoom = (_x: number, _y: number, zoomIn: boolean) => {
    setZoomLevel((z) => (zoomIn ? Math.min(z * 2, 8) : Math.max(z / 2, 1)))
  }

  // Create selection
  const createSelection = (x: number, y: number, width: number, height: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Ensure positive width and height
    const selX = width < 0 ? x + width : x
    const selY = height < 0 ? y + height : y
    const selWidth = Math.abs(width)
    const selHeight = Math.abs(height)

    // Save selection area
    setSelectionArea({ x: selX, y: selY, width: selWidth, height: selHeight })

    // Get selection content
    const content = ctx.getImageData(selX, selY, selWidth, selHeight)
    setSelectionContent(content)

    // Draw selection marquee
    drawSelectionMarquee()
  }

  // Draw selection marquee
  const drawSelectionMarquee = () => {
    if (!selectionArea) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Restore canvas without selection marquee
    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    }

    // Draw dashed rectangle around selection
    ctx.save()
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.strokeRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height)
    ctx.restore()
  }

  // Move selection
  const moveSelection = (x: number, y: number) => {
    if (!selectionArea || !selectionContent || !startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Calculate new position
    const dx = x - startPos.x
    const dy = y - startPos.y

    // Restore canvas without selection
    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    }

    // Draw selection at new position
    ctx.putImageData(selectionContent, selectionArea.x + dx, selectionArea.y + dy)

    // Update selection area
    setSelectionArea({
      x: selectionArea.x + dx,
      y: selectionArea.y + dy,
      width: selectionArea.width,
      height: selectionArea.height,
    })

    // Update start position
    setStartPos({ x, y })

    // Draw selection marquee
    drawSelectionMarquee()
  }

  // Commit selection (apply it permanently)
  const commitSelection = () => {
    if (!selectionArea || !selectionContent) {
      setSelectionArea(null)
      setSelectionContent(null)
      setIsMovingSelection(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Restore canvas without selection marquee
    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    }

    // Draw selection at its current position
    ctx.putImageData(selectionContent, selectionArea.x, selectionArea.y)

    // Save state
    saveState()

    // Reset selection
    setSelectionArea(null)
    setSelectionContent(null)
    setIsMovingSelection(false)
  }

  /** The 2d context, or null when there is no canvas yet. */
  const context = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null

  /**
   * Copy, and Cut, which copies then paints the hole white.
   *
   * A selection carries its pixels in selectionContent already, so Copy is
   * a handoff. With nothing selected, both take the whole bitmap, which is
   * what Paint did with Select All in force.
   */
  const copySelection = (cut: boolean) => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return

    const area = selectionArea
    const data = area ? ctx.getImageData(area.x, area.y, area.width, area.height) : ctx.getImageData(0, 0, canvas.width, canvas.height)
    setClipboard(data)

    if (cut) {
      ctx.fillStyle = backgroundColor
      if (area) ctx.fillRect(area.x, area.y, area.width, area.height)
      else ctx.fillRect(0, 0, canvas.width, canvas.height)
      setSelectionArea(null)
      setSelectionContent(null)
      saveState()
      setIsModified(true)
    }
  }

  /** Pastes at the top left, as Paint did, and leaves it selected to drag. */
  const pasteClipboard = () => {
    const ctx = context()
    if (!ctx || !clipboard) return
    ctx.putImageData(clipboard, 0, 0)
    saveState()
    setIsModified(true)
    setSelectionArea({ x: 0, y: 0, width: clipboard.width, height: clipboard.height })
    setSelectionContent(clipboard)
    setTool("select")
  }

  /** Clear Selection: the selected pixels go, the rest stays. */
  const clearSelection = () => {
    const ctx = context()
    if (!ctx || !selectionArea) return
    ctx.fillStyle = backgroundColor
    ctx.fillRect(selectionArea.x, selectionArea.y, selectionArea.width, selectionArea.height)
    setSelectionArea(null)
    setSelectionContent(null)
    saveState()
    setIsModified(true)
  }

  const selectAll = () => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return
    setTool("select")
    setSelectionArea({ x: 0, y: 0, width: canvas.width, height: canvas.height })
    setSelectionContent(ctx.getImageData(0, 0, canvas.width, canvas.height))
  }

  /**
   * Flip, mirror and rotate, from the Image menu.
   *
   * Every transform draws the bitmap into a scratch canvas under the right
   * matrix and copies it back, which keeps one code path for all six and
   * cannot drift between them.
   */
  const transformImage = (mode: "horizontal" | "vertical" | "rotate90" | "rotate180" | "rotate270") => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return

    const quarter = mode === "rotate90" || mode === "rotate270"
    const scratch = document.createElement("canvas")
    scratch.width = quarter ? canvas.height : canvas.width
    scratch.height = quarter ? canvas.width : canvas.height
    const sctx = scratch.getContext("2d")
    if (!sctx) return

    sctx.fillStyle = backgroundColor
    sctx.fillRect(0, 0, scratch.width, scratch.height)
    sctx.save()
    if (mode === "horizontal") {
      sctx.translate(canvas.width, 0)
      sctx.scale(-1, 1)
    } else if (mode === "vertical") {
      sctx.translate(0, canvas.height)
      sctx.scale(1, -1)
    } else if (mode === "rotate90") {
      sctx.translate(scratch.width, 0)
      sctx.rotate(Math.PI / 2)
    } else if (mode === "rotate180") {
      sctx.translate(scratch.width, scratch.height)
      sctx.rotate(Math.PI)
    } else {
      sctx.translate(0, scratch.height)
      sctx.rotate(-Math.PI / 2)
    }
    sctx.drawImage(canvas, 0, 0)
    sctx.restore()

    // The canvas keeps its own size: a quarter turn on a non-square bitmap
    // lands centred rather than resizing the window's drawing area.
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(scratch, Math.round((canvas.width - scratch.width) / 2), Math.round((canvas.height - scratch.height) / 2))
    saveState()
    setIsModified(true)
    setShowFlip(false)
  }

  /** Stretch by percent and skew by degrees, both axes at once. */
  const stretchSkew = (opts: { sx: number; sy: number; hx: number; hy: number }) => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return

    const snapshot = document.createElement("canvas")
    snapshot.width = canvas.width
    snapshot.height = canvas.height
    snapshot.getContext("2d")?.drawImage(canvas, 0, 0)

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    // tan of the skew angle is the shear factor, which is what the original
    // dialog's "degrees" meant.
    const shearX = Math.tan((opts.hx * Math.PI) / 180)
    const shearY = Math.tan((opts.hy * Math.PI) / 180)
    ctx.transform(opts.sx / 100, shearY, shearX, opts.sy / 100, 0, 0)
    ctx.drawImage(snapshot, 0, 0)
    ctx.restore()
    saveState()
    setIsModified(true)
    setShowStretch(false)
  }

  const invertColors = () => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = 255 - data.data[i]
      data.data[i + 1] = 255 - data.data[i + 1]
      data.data[i + 2] = 255 - data.data[i + 2]
    }
    ctx.putImageData(data, 0, 0)
    saveState()
    setIsModified(true)
  }

  const clearImage = () => {
    const canvas = canvasRef.current
    const ctx = context()
    if (!canvas || !ctx) return
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveState()
    setIsModified(true)
  }

  /**
   * Set As Wallpaper (Tiled).
   *
   * Paint wrote the bitmap to the Windows directory and pointed the desktop
   * at it. Here it goes to the same slot Display Properties fills from an
   * upload, and the desktop repaints immediately.
   */
  const setAsWallpaper = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    try {
      localStorage.setItem(CUSTOM_WALLPAPER_KEY, url)
      localStorage.setItem("win95-background-image", CUSTOM_WALLPAPER_ID)
    } catch {
      messageBox({ title: "Paint", text: "That drawing is too large to store as wallpaper.", icon: "error" })
      return
    }
    const desktop = document.getElementById("desktop")
    if (desktop) {
      desktop.style.backgroundImage = `url(${url})`
      desktop.style.backgroundSize = "auto"
      desktop.style.backgroundRepeat = "repeat"
      desktop.style.backgroundPosition = "top left"
    }
    messageBox({ title: "Paint", text: "The drawing is now your wallpaper, tiled.", icon: "information" })
  }

  // Handle text input
  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
  }

  // Apply text to canvas
  const applyText = () => {
    if (!textPosition || !textInput) {
      setShowTextInput(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set text properties
    ctx.font = textFont
    ctx.fillStyle = color
    ctx.textBaseline = "top"

    // Draw text
    const lines = textInput.split("\n")
    const lineHeight = Number.parseInt(textFont.split("px")[0]) * 1.2

    lines.forEach((line, index) => {
      ctx.fillText(line, textPosition.x, textPosition.y + index * lineHeight)
    })

    // Save state
    saveState()

    // Reset text input
    setShowTextInput(false)
    setTextInput("")
    setTextPosition(null)
  }

  // Draw curve
  const drawCurve = () => {
    if (curvePoints[0] === null || curvePoints[1] === null || curvePoints[2] === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Restore canvas to last state
    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    }

    // Draw curve
    ctx.beginPath()
    ctx.moveTo(curvePoints[0].x, curvePoints[0].y)
    ctx.quadraticCurveTo(curvePoints[1].x, curvePoints[1].y, curvePoints[2].x, curvePoints[2].y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  // Draw polygon
  const drawPolygon = (isComplete = false) => {
    if (polygonPoints.length < 2) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Restore canvas to last state
    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    }

    // Draw polygon
    ctx.beginPath()
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y)

    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y)
    }

    // Close the polygon if complete
    if (isComplete) {
      ctx.closePath()
    }

    // Fill if needed
    if (fillStyle === "solid" && isComplete) {
      ctx.fillStyle = color
      ctx.fill()
    }

    // Stroke
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  // Draw airbrush effect
  const drawAirbrush = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set airbrush properties
    ctx.fillStyle = color

    // The nozzle sets the spread; the dot count follows its area so a
    // wide spray is not also a thin one.
    const radius = sprayRadius
    const density = Math.round(radius * 1.6)

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * radius

      const dotX = x + Math.cos(angle) * distance
      const dotY = y + Math.sin(angle) * distance

      ctx.beginPath()
      ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Handle free-form selection
  const handleFreeformSelection = (x: number, y: number) => {
    // This is a simplified version - in a real implementation,
    // you would track the path and create a mask for the selection
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    if (!startPos) {
      // Start a new path
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else {
      // Continue the path
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    setIsModified(true)

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / zoomLevel)
    const y = Math.floor((e.clientY - rect.top) / zoomLevel)
    setStartPos({ x, y })

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Handle different tools
    switch (tool) {
      case "fill":
        floodFill(x, y, color)
        saveState()
        break

      case "eyedropper":
        const pickedColor = getColorAtPosition(x, y)
        setColor(pickedColor)
        break

      case "magnifier":
        handleZoom(x, y, e.button === 0) // Left click to zoom in, right click to zoom out
        break

      case "text":
        setTextPosition({ x, y })
        setShowTextInput(true)
        break

      case "curve":
        if (curveStage === 0) {
          // First point
          setCurvePoints([{ x, y }, null, null])
          setCurveStage(1)
        } else if (curveStage === 1) {
          // End point
          setCurvePoints([curvePoints[0], null, { x, y }])
          setCurveStage(2)
        } else if (curveStage === 2) {
          // Control point
          setCurvePoints([curvePoints[0], { x, y }, curvePoints[2]])
          drawCurve()
          saveState()
          setCurvePoints([null, null, null])
          setCurveStage(0)
        }
        break

      case "polygon":
        if (!isPolygonComplete) {
          if (polygonPoints.length === 0) {
            // First point
            setPolygonPoints([{ x, y }])
          } else {
            // Check if close to starting point to complete polygon
            const startPoint = polygonPoints[0]
            const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))

            if (distance < 10 && polygonPoints.length > 2) {
              // Complete polygon
              setIsPolygonComplete(true)
              drawPolygon(true)
              saveState()
              setPolygonPoints([])
              setIsPolygonComplete(false)
            } else {
              // Add new point
              setPolygonPoints([...polygonPoints, { x, y }])
              drawPolygon()
            }
          }
        }
        break

      case "select":
        // Check if clicking inside existing selection
        if (
          selectionArea &&
          x >= selectionArea.x &&
          x <= selectionArea.x + selectionArea.width &&
          y >= selectionArea.y &&
          y <= selectionArea.y + selectionArea.height
        ) {
          setIsMovingSelection(true)
        } else {
          // Start new selection
          commitSelection()
        }
        break

      case "freeform":
        handleFreeformSelection(x, y)
        break

      case "airbrush":
        drawAirbrush(x, y)
        break

      case "pencil":
      case "brush":
      case "eraser":
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color
        ctx.lineWidth = tool === "brush" ? lineWidth * 3 : lineWidth
        break

      default:
        break
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Read the position first: Paint reported the cursor whenever it was over
    // the canvas, not only while the button was down.
    const surface = canvasRef.current
    if (surface) {
      const bounds = surface.getBoundingClientRect()
      setCursorPos({
        x: Math.floor((e.clientX - bounds.left) / zoomLevel),
        y: Math.floor((e.clientY - bounds.top) / zoomLevel),
      })
    }

    if (!isDrawing || !startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / zoomLevel)
    const y = Math.floor((e.clientY - rect.top) / zoomLevel)

    // Handle different tools
    switch (tool) {
      case "pencil":
      case "brush":
      case "eraser":
        ctx.lineTo(x, y)
        ctx.stroke()
        break

      case "airbrush":
        drawAirbrush(x, y)
        break

      case "select":
        if (isMovingSelection) {
          moveSelection(x, y)
        } else {
          // Draw selection preview
          const width = x - startPos.x
          const height = y - startPos.y

          // Restore canvas to last state
          if (undoStack.length > 0) {
            ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
          }

          // Draw selection rectangle
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.strokeRect(startPos.x, startPos.y, width, height)
          ctx.setLineDash([])
        }
        break

      case "freeform":
        handleFreeformSelection(x, y)
        break

      case "line":
      case "rectangle":
      case "circle":
      case "roundedRect":
        // Draw preview
        // Restore canvas to last state
        if (undoStack.length > 0) {
          ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
        }

        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth

        if (tool === "line") {
          ctx.beginPath()
          ctx.moveTo(startPos.x, startPos.y)
          ctx.lineTo(x, y)
          ctx.stroke()
        } else if (tool === "rectangle") {
          const width = x - startPos.x
          const height = y - startPos.y

          if (fillStyle === "solid") {
            ctx.fillStyle = color
            ctx.fillRect(startPos.x, startPos.y, width, height)
          }

          ctx.strokeRect(startPos.x, startPos.y, width, height)
        } else if (tool === "circle") {
          const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
          ctx.beginPath()
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)

          if (fillStyle === "solid") {
            ctx.fillStyle = color
            ctx.fill()
          }

          ctx.stroke()
        } else if (tool === "roundedRect") {
          const width = x - startPos.x
          const height = y - startPos.y
          const radius = Math.min(10, Math.abs(width) / 4, Math.abs(height) / 4)

          ctx.beginPath()
          ctx.moveTo(startPos.x + radius, startPos.y)
          ctx.lineTo(startPos.x + width - radius, startPos.y)
          ctx.quadraticCurveTo(startPos.x + width, startPos.y, startPos.x + width, startPos.y + radius)
          ctx.lineTo(startPos.x + width, startPos.y + height - radius)
          ctx.quadraticCurveTo(
            startPos.x + width,
            startPos.y + height,
            startPos.x + width - radius,
            startPos.y + height,
          )
          ctx.lineTo(startPos.x + radius, startPos.y + height)
          ctx.quadraticCurveTo(startPos.x, startPos.y + height, startPos.x, startPos.y + height - radius)
          ctx.lineTo(startPos.x, startPos.y + radius)
          ctx.quadraticCurveTo(startPos.x, startPos.y, startPos.x + radius, startPos.y)
          ctx.closePath()

          if (fillStyle === "solid") {
            ctx.fillStyle = color
            ctx.fill()
          }

          ctx.stroke()
        }
        break

      default:
        break
    }
  }

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / zoomLevel)
    const y = Math.floor((e.clientY - rect.top) / zoomLevel)

    // Handle different tools
    switch (tool) {
      case "line":
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(x, y)
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.stroke()
        saveState()
        break

      case "rectangle":
        const width = x - startPos.x
        const height = y - startPos.y

        if (fillStyle === "solid") {
          ctx.fillStyle = color
          ctx.fillRect(startPos.x, startPos.y, width, height)
        }

        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.strokeRect(startPos.x, startPos.y, width, height)
        saveState()
        break

      case "circle":
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        ctx.beginPath()
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)

        if (fillStyle === "solid") {
          ctx.fillStyle = color
          ctx.fill()
        }

        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.stroke()
        saveState()
        break

      case "roundedRect":
        const rWidth = x - startPos.x
        const rHeight = y - startPos.y
        const rRadius = Math.min(10, Math.abs(rWidth) / 4, Math.abs(rHeight) / 4)

        ctx.beginPath()
        ctx.moveTo(startPos.x + rRadius, startPos.y)
        ctx.lineTo(startPos.x + rWidth - rRadius, startPos.y)
        ctx.quadraticCurveTo(startPos.x + rWidth, startPos.y, startPos.x + rWidth, startPos.y + rRadius)
        ctx.lineTo(startPos.x + rWidth, startPos.y + rHeight - rRadius)
        ctx.quadraticCurveTo(
          startPos.x + rWidth,
          startPos.y + rHeight,
          startPos.x + rWidth - rRadius,
          startPos.y + rHeight,
        )
        ctx.lineTo(startPos.x + rRadius, startPos.y + rHeight)
        ctx.quadraticCurveTo(startPos.x, startPos.y + rHeight, startPos.x, startPos.y + rHeight - rRadius)
        ctx.lineTo(startPos.x, startPos.y + rRadius)
        ctx.quadraticCurveTo(startPos.x, startPos.y, startPos.x + rRadius, startPos.y)
        ctx.closePath()

        if (fillStyle === "solid") {
          ctx.fillStyle = color
          ctx.fill()
        }

        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.stroke()
        saveState()
        break

      case "select":
        if (!isMovingSelection) {
          createSelection(startPos.x, startPos.y, x - startPos.x, y - startPos.y)
        }
        setIsMovingSelection(false)
        break

      case "freeform":
        // Complete the free-form selection
        ctx.closePath()
        ctx.stroke()
        // In a real implementation, you would create a mask from the path
        // and extract the selection
        break

      case "pencil":
      case "brush":
      case "eraser":
      case "airbrush":
        saveState()
        break

      default:
        break
    }

    setIsDrawing(false)
    setStartPos(null)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    // The status bar has nothing to report once the pointer is off the canvas.
    setCursorPos(null)
    if (isDrawing) {
      setIsDrawing(false)

      // For tools that need to save state on mouse leave
      if (tool === "pencil" || tool === "brush" || tool === "eraser" || tool === "airbrush") {
        saveState()
      }
    }
  }

  // Handle new file
  const handleNew = () => {
    if (isModified) {
      const confirm = window.confirm("Do you want to save changes to " + fileName + "?")
      if (confirm) {
        handleSave()
      }
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Clear canvas with white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setFileName("Untitled.bmp")
    setIsModified(false)
    setUndoStack([])
    setRedoStack([])
    saveState()
  }

  // Handle save
  /** Puts the drawing on the desktop as an icon, where it persists. */
  const handleSaveToDesktop = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      window.dispatchEvent(
        new CustomEvent("createDesktopIcon", {
          detail: { label: fileName.replace(/\.[a-z0-9]+$/i, ""), dataUrl: canvas.toDataURL("image/png") },
        }),
      )
      setIsModified(false)
      messageBox({ title: "Paint", text: `${fileName} is on the desktop now, and it will still be there tomorrow.`, icon: "information" })
    } catch (e) {
      messageBox({ title: "Paint", text: "Error saving to the desktop: " + e, icon: "error" })
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Create a temporary link element
      const link = document.createElement("a")
      link.download = fileName
      link.href = canvas.toDataURL("image/png")

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsModified(false)
    } catch (e) {
      messageBox({ title: "Paint", text: "Error saving file: " + e, icon: "error" })
    }
  }

  // Handle exit
  const handleExit = () => {
    if (isModified) {
      const confirm = window.confirm("Do you want to save changes to " + fileName + "?")
      if (confirm) {
        handleSave()
      }
    }
    // Close the window
    const event = new CustomEvent("close", { detail: { id: "paint" } })
    window.dispatchEvent(event)
  }

  return (
    <div className="relative flex flex-col h-full bg-[#c0c0c0] text-black">
      {/* Menu Bar */}
      <div className="menu-bar bg-[#c0c0c0] flex p-[4px_8px] gap-[10px] text-xs border-b border-[#808080]">
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">File</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={handleNew}>
              New
            </div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Open...</div>
            <div
              className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer"
              data-save-desktop
              onClick={handleSaveToDesktop}
            >
              Save to Desktop
            </div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={handleSave}>
              Save
            </div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Save As...</div>
            <div className="border-t border-[#808080] my-1"></div>
            <div
              data-set-wallpaper
              className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer"
              onClick={setAsWallpaper}
            >
              Set As Wallpaper (Tiled)
            </div>
            <div className="border-t border-[#808080] my-1"></div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Print...</div>
            <div className="border-t border-[#808080] my-1"></div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={handleExit}>
              Exit
            </div>
          </div>
        </div>
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">Edit</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div
              className={`px-4 py-1 text-xs ${undoStack.length > 1 ? "hover:bg-[#000080] hover:text-white cursor-pointer" : "text-[#808080]"}`}
              onClick={undoStack.length > 1 ? handleUndo : undefined}
            >
              Undo
            </div>
            <div
              className={`px-4 py-1 text-xs ${redoStack.length > 0 ? "hover:bg-[#000080] hover:text-white cursor-pointer" : "text-[#808080]"}`}
              onClick={redoStack.length > 0 ? handleRedo : undefined}
            >
              Redo
            </div>
            <div className="border-t border-[#808080] my-1"></div>
            <div data-edit-cut className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => copySelection(true)}>
              Cut
            </div>
            <div data-edit-copy className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => copySelection(false)}>
              Copy
            </div>
            <div
              data-edit-paste
              className={`px-4 py-1 text-xs ${clipboard ? "hover:bg-[#000080] hover:text-white cursor-pointer" : "text-[#808080]"}`}
              onClick={clipboard ? pasteClipboard : undefined}
            >
              Paste
            </div>
            <div className="border-t border-[#808080] my-1"></div>
            <div data-edit-clear className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={clearSelection}>
              Clear Selection
            </div>
            <div data-edit-all className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={selectAll}>
              Select All
            </div>
          </div>
        </div>
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">View</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Tool Box</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Color Box</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Status Bar</div>
            <div className="border-t border-[#808080] my-1"></div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Zoom</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">View Bitmap</div>
          </div>
        </div>
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">Image</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div data-image-flip className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowFlip(true)}>
              Flip/Rotate...
            </div>
            <div data-image-stretch className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowStretch(true)}>
              Stretch/Skew...
            </div>
            <div data-image-invert className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={invertColors}>
              Invert Colors
            </div>
            <div data-image-clear className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={clearImage}>
              Clear Image
            </div>
          </div>
        </div>
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">Colors</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Edit Colors...</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Get Colors...</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Save Colors...</div>
          </div>
        </div>
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">Help</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Help Topics</div>
            <div className="border-t border-[#808080] my-1"></div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">About Paint</div>
          </div>
        </div>
      </div>

      {/* Flip and Rotate, the six the original offered. */}
      {showFlip && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/30" onClick={() => setShowFlip(false)}>
          <div
            data-flip-dialog
            className="w-[260px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#000080] px-2 py-[3px] font-bold text-white">Flip and Rotate</div>
            <div className="grid gap-1 p-3">
              {(
                [
                  ["Flip horizontal", "horizontal"],
                  ["Flip vertical", "vertical"],
                  ["Rotate 90\u00b0", "rotate90"],
                  ["Rotate 180\u00b0", "rotate180"],
                  ["Rotate 270\u00b0", "rotate270"],
                ] as const
              ).map(([label, mode]) => (
                <button
                  key={mode}
                  type="button"
                  data-flip={mode}
                  onClick={() => transformImage(mode)}
                  className="h-[23px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowFlip(false)}
                className="mt-1 h-[23px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stretch and Skew, percent and degrees, as the original asked. */}
      {showStretch && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/30" onClick={() => setShowStretch(false)}>
          <form
            data-stretch-dialog
            className="w-[300px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const num = (name: string, fallback: number) => {
                const value = Number((form.elements.namedItem(name) as HTMLInputElement)?.value)
                return Number.isFinite(value) ? value : fallback
              }
              stretchSkew({
                sx: Math.max(1, Math.min(500, num("sx", 100))),
                sy: Math.max(1, Math.min(500, num("sy", 100))),
                hx: Math.max(-89, Math.min(89, num("hx", 0))),
                hy: Math.max(-89, Math.min(89, num("hy", 0))),
              })
            }}
          >
            <div className="bg-[#000080] px-2 py-[3px] font-bold text-white">Stretch and Skew</div>
            <div className="p-3">
              <div className="mb-2 font-bold">Stretch</div>
              {(
                [
                  ["Horizontal", "sx", "%"],
                  ["Vertical", "sy", "%"],
                ] as const
              ).map(([label, name, unit]) => (
                <label key={name} className="mb-1 flex items-center gap-2">
                  <span className="w-[70px]">{label}:</span>
                  <input
                    name={name}
                    defaultValue={100}
                    className="w-14 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 text-right"
                  />
                  <span>{unit}</span>
                </label>
              ))}
              <div className="mb-2 mt-3 font-bold">Skew</div>
              {(
                [
                  ["Horizontal", "hx", "Degrees"],
                  ["Vertical", "hy", "Degrees"],
                ] as const
              ).map(([label, name, unit]) => (
                <label key={name} className="mb-1 flex items-center gap-2">
                  <span className="w-[70px]">{label}:</span>
                  <input
                    name={name}
                    defaultValue={0}
                    className="w-14 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 text-right"
                  />
                  <span>{unit}</span>
                </label>
              ))}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="submit"
                  data-stretch-ok
                  className="h-[23px] min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowStretch(false)}
                  className="h-[23px] min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/*
          Tool palette.

          Sixteen tools in a 2-wide grid, the selected one drawn pressed in, and
          the options for that tool underneath: Paint showed a different panel
          for each, and the panel is how you pick a brush size or decide whether
          a shape is filled. It was seventy hand-written buttons before, each
          repeating the same class string, which is why several of them disagreed
          about what "selected" looked like.
        */}
        <div className="toolbar flex w-[120px] shrink-0 flex-col gap-1 border-r border-[#808080] bg-[#c0c0c0] p-1">
          <div className="grid grid-cols-2 gap-[2px]" data-tools>
            {TOOLS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                title={entry.label}
                aria-label={entry.label}
                data-tool={entry.id}
                data-selected={tool === entry.id ? "" : undefined}
                onClick={() => handleToolSelect(entry.id)}
                className="flex h-[53px] w-[53px] items-center justify-center bg-[#c0c0c0]"
                style={{
                  boxShadow:
                    tool === entry.id
                      ? "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #000000"
                      : "inset -1px -1px 0 0 #000000, inset 1px 1px 0 0 #ffffff, inset -2px -2px 0 0 #808080, inset 2px 2px 0 0 #dfdfdf",
                }}
              >
                <ToolGlyph tool={entry.id} />
              </button>
            ))}
          </div>

          {/* Whatever the chosen tool needs */}
          <div
            data-tool-options
            className="mt-1 flex min-h-[64px] flex-col items-center gap-1 p-1"
            style={{ boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff" }}
          >
            {(tool === "brush" || tool === "airbrush") &&
              [1, 3, 5, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  data-size={size}
                  aria-label={`Size ${size}`}
                  onClick={() => setLineWidth(size)}
                  className="flex h-[14px] w-[44px] items-center justify-center"
                  style={{ backgroundColor: lineWidth === size ? "#000080" : "transparent" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: size * 2 + 4,
                      height: size * 2 + 4,
                      borderRadius: "50%",
                      backgroundColor: lineWidth === size ? "#ffffff" : "#000000",
                    }}
                  />
                </button>
              ))}

            {tool === "eraser" &&
              [4, 8, 14, 22].map((size) => (
                <button
                  key={size}
                  type="button"
                  data-size={size}
                  aria-label={`Size ${size}`}
                  onClick={() => setLineWidth(size)}
                  className="flex h-[26px] w-[52px] items-center justify-center"
                  style={{ backgroundColor: lineWidth === size ? "#000080" : "transparent" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: size,
                      height: size,
                      backgroundColor: lineWidth === size ? "#ffffff" : "#000000",
                    }}
                  />
                </button>
              ))}

            {tool === "airbrush" && (
              <div className="flex flex-col items-center gap-1" data-spray-options>
                {[5, 9, 16].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    data-spray={radius}
                    aria-label={`Spray ${radius}`}
                    onClick={() => setSprayRadius(radius)}
                    className="flex h-[30px] w-[52px] items-center justify-center"
                    style={{ backgroundColor: sprayRadius === radius ? "#000080" : "transparent" }}
                  >
                    {/* A sketch of the spread each nozzle throws. */}
                    <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`} aria-hidden>
                      {Array.from({ length: radius * 2 }).map((_, i) => {
                        const angle = (i / (radius * 2)) * Math.PI * 2 * 3
                        const dist = (i % radius) * 0.9
                        return (
                          <circle
                            key={i}
                            cx={radius + Math.cos(angle) * dist}
                            cy={radius + Math.sin(angle) * dist}
                            r={0.7}
                            fill={sprayRadius === radius ? "#ffffff" : "#000000"}
                          />
                        )
                      })}
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {tool === "text" && (
              <div className="flex w-full flex-col gap-1 px-1" data-font-options>
                <select
                  data-font-family
                  aria-label="Font"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full border border-[#808080] bg-white text-[10px]"
                >
                  {["Arial", "Times New Roman", "Courier New", "Comic Sans MS", "MS Sans Serif"].map((face) => (
                    <option key={face} value={face}>
                      {face}
                    </option>
                  ))}
                </select>
                <select
                  data-font-size
                  aria-label="Font size"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full border border-[#808080] bg-white text-[10px]"
                >
                  {[8, 10, 12, 14, 18, 24, 36, 48].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(tool === "line" || tool === "curve") &&
              [1, 2, 3, 5, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  data-size={size}
                  aria-label={`Width ${size}`}
                  onClick={() => setLineWidth(size)}
                  className="flex h-[12px] w-[44px] items-center justify-center"
                  style={{ backgroundColor: lineWidth === size ? "#000080" : "transparent" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: 34,
                      height: size,
                      backgroundColor: lineWidth === size ? "#ffffff" : "#000000",
                    }}
                  />
                </button>
              ))}

            {(tool === "rectangle" || tool === "circle" || tool === "roundedRect" || tool === "polygon") &&
              (["transparent", "solid"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  data-fill={style}
                  aria-label={style === "solid" ? "Filled" : "Outline"}
                  onClick={() => setFillStyle(style)}
                  className="flex h-[18px] w-[44px] items-center justify-center"
                  style={{ backgroundColor: fillStyle === style ? "#000080" : "transparent" }}
                >
                  <span
                    style={{
                      display: "block",
                      width: 26,
                      height: 12,
                      border: "1px solid #000000",
                      backgroundColor: style === "solid" ? "#000000" : "transparent",
                    }}
                  />
                </button>
              ))}

            {tool === "magnifier" &&
              [1, 2, 4, 8].map((step) => (
                <button
                  key={step}
                  type="button"
                  data-zoom={step}
                  aria-label={`${step}x`}
                  onClick={() => setZoomLevel(step)}
                  className="h-[14px] w-[44px] text-[10px]"
                  style={{
                    backgroundColor: zoomLevel === step ? "#000080" : "transparent",
                    color: zoomLevel === step ? "#ffffff" : "#000000",
                  }}
                >
                  {step}x
                </button>
              ))}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-[#c0c0c0] p-2 overflow-auto relative">
          <canvas
            ref={canvasRef}
            className="bg-white border-2 border-[#808080] shadow-[inset_1px_1px_#404040,inset_-1px_-1px_#ffffff] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
          ></canvas>

          {/* Text Input Overlay */}
          {showTextInput && (
            <div
              className="absolute bg-white border border-black"
              style={{
                left: textPosition ? textPosition.x : 0,
                top: textPosition ? textPosition.y : 0,
                minWidth: "100px",
                minHeight: "50px",
              }}
            >
              <textarea
                ref={textInputRef}
                className="w-full h-full p-1 outline-none resize-both"
                value={textInput}
                onChange={handleTextInput}
                onBlur={applyText}
                style={{ fontFamily: textFont.split("px ")[1], fontSize: textFont.split("px")[0] + "px" }}
              />
            </div>
          )}
        </div>
      </div>

      {/*
        Colour palette.

        Two rows of twenty-eight with the foreground and background pair to
        their left, which is the Windows 95 arrangement. Left-click sets the
        foreground, right-click the background, and the status bar shows where
        the cursor is on the canvas.
      */}
      <div className="flex items-start gap-2 border-t border-white bg-[#c0c0c0] p-1">
        <div className="relative h-[32px] w-[34px] shrink-0" data-current-colors>
          <div
            className="absolute left-0 top-0 h-[20px] w-[20px]"
            style={{
              backgroundColor: color,
              boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #000000",
            }}
            data-foreground
          />
          <div
            className="absolute bottom-0 right-0 h-[20px] w-[20px]"
            style={{
              backgroundColor: backgroundColor,
              boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #000000",
            }}
            data-background
          />
        </div>

        <div
          data-palette
          className="grid shrink-0 grid-flow-col grid-rows-2"
          style={{ boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff" }}
        >
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              title={swatch}
              data-swatch={swatch}
              className="h-[14px] w-[14px] border border-[#808080]"
              style={{ backgroundColor: swatch }}
              onClick={() => handleColorSelect(swatch)}
              onContextMenu={(e) => handleBackgroundColorSelect(e, swatch)}
            />
          ))}
        </div>

        <div className="flex flex-1 gap-2 self-end pb-[2px]">
          <span
            data-status
            className="min-w-[120px] px-2"
            style={{ boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff" }}
          >
            {cursorPos ? `${cursorPos.x},${cursorPos.y}` : ""}
          </span>
          <span
            data-selection-size
            className="min-w-[120px] px-2"
            style={{ boxShadow: "inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff" }}
          >
            {selectionArea ? `${Math.abs(selectionArea.width)} x ${Math.abs(selectionArea.height)}` : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
