"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import Image from "next/image"

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
  const [textFont, setTextFont] = useState<string>("12px Arial")
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
      const ctx = canvas.getContext("2d")
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
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx) {
            tempCtx.fillStyle = "#FFFFFF"
            tempCtx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw the last state scaled to the new canvas size
            const img = new Image()
            const lastStateCanvas = document.createElement("canvas")
            lastStateCanvas.width = lastState.width
            lastStateCanvas.height = lastState.height
            const lastStateCtx = lastStateCanvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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
  const handleLineWidthSelect = (width: number) => {
    setLineWidth(width)
  }

  // Handle fill style selection
  const handleFillStyleSelect = (style: "solid" | "transparent") => {
    setFillStyle(style)
  }

  // Fill algorithm (flood fill)
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
    if (!ctx) return "#000000"

    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1]
      .toString(16)
      .padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`
    return hex
  }

  // Handle zoom (magnifier)
  const handleZoom = (x: number, y: number, zoomIn: boolean) => {
    const newZoom = zoomIn ? Math.min(zoomLevel * 2, 8) : Math.max(zoomLevel / 2, 0.25)
    setZoomLevel(newZoom)

    // Apply zoom to canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Save current state
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Clear canvas
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create temporary canvas for zooming
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = currentState.width
    tempCanvas.height = currentState.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    // Draw current state to temp canvas
    tempCtx.putImageData(currentState, 0, 0)

    // Draw zoomed image
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(newZoom, newZoom)
    ctx.translate(-x, -y)
    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()
  }

  // Create selection
  const createSelection = (x: number, y: number, width: number, height: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set airbrush properties
    ctx.fillStyle = color

    // Draw random dots in a circular area
    const radius = lineWidth * 5
    const density = lineWidth * 10

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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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
    if (!isDrawing || !startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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

    const ctx = canvas.getContext("2d")
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
      alert("Error saving file: " + e)
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
    <div className="flex flex-col h-full bg-[#c0c0c0] text-black">
      {/* Menu Bar */}
      <div className="menu-bar bg-[#c0c0c0] flex p-[4px_8px] gap-[10px] text-xs border-b border-[#808080]">
        <div className="relative group">
          <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">File</span>
          <div className="absolute hidden group-hover:block left-0 top-full bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[2px_2px_4px_rgba(0,0,0,0.3)] z-50 min-w-[150px]">
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={handleNew}>
              New
            </div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Open...</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer" onClick={handleSave}>
              Save
            </div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Save As...</div>
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
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Cut</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Copy</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Paste</div>
            <div className="border-t border-[#808080] my-1"></div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Clear Selection</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Select All</div>
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
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Flip/Rotate</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Stretch/Skew</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Invert Colors</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Attributes...</div>
            <div className="px-4 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Clear Image</div>
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

      <div className="flex flex-1 min-h-0">
        {/* Left Toolbar */}
        <div className="toolbar bg-[#c0c0c0] p-1 border-r border-[#808080] flex flex-col gap-1">
          {/* Drawing Tools */}
          <div className="grid grid-cols-2 gap-1">
            {/* Free-form Select */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "freeform" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("freeform")}
              title="Free-Form Select"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/paint/freeform.png"
                  alt="Free-Form Select"
                  width={32}
                  height={32}
                  className="pixelated"
                />
              </div>
            </button>

            {/* Select */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "select" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("select")}
              title="Select"
            >
              <div className="w-6 h-6 border border-dashed border-black"></div>
            </button>

            {/* Eraser */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "eraser" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("eraser")}
              title="Eraser"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/eraser.png" alt="Eraser" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Fill */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "fill" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("fill")}
              title="Fill"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/fill.png" alt="Fill" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Eyedropper */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "eyedropper" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("eyedropper")}
              title="Pick Color"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/paint/eyedropper.png"
                  alt="Pick Color"
                  width={32}
                  height={32}
                  className="pixelated"
                />
              </div>
            </button>

            {/* Magnifier */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "magnifier" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("magnifier")}
              title="Magnifier"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/magnifier.png" alt="Magnifier" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Pencil */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "pencil" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("pencil")}
              title="Pencil"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/pencil.png" alt="Pencil" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Brush */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "brush" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("brush")}
              title="Brush"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/brush.png" alt="Brush" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Airbrush */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "airbrush" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("airbrush")}
              title="Airbrush"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/airbrush.png" alt="Airbrush" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Text */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "text" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("text")}
              title="Text"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/text.png" alt="Text" width={32} height={32} className="pixelated" />
              </div>
            </button>
          </div>

          {/* Shapes */}
          <div className="grid grid-cols-2 gap-1 mt-1">
            {/* Line */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "line" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("line")}
              title="Line"
            >
              <div className="w-6 h-[1px] bg-black transform rotate-45"></div>
            </button>

            {/* Curve */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "curve" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("curve")}
              title="Curve"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/curve.png" alt="Curve" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Rectangle */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "rectangle" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("rectangle")}
              title="Rectangle"
            >
              <div className="w-6 h-4 border border-black"></div>
            </button>

            {/* Polygon */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0]  border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "polygon" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("polygon")}
              title="Polygon"
            >
              <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
                <Image src="/images/paint/polygon.png" alt="Polygon" width={32} height={32} className="pixelated" />
              </div>
            </button>

            {/* Ellipse */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "circle" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("circle")}
              title="Ellipse"
            >
              <div className="w-6 h-4 rounded-full border border-black"></div>
            </button>

            {/* Rounded Rectangle */}
            <button
              className={`w-10 h-10 flex items-center justify-center bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                tool === "roundedRect" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
              }`}
              onClick={() => handleToolSelect("roundedRect")}
              title="Rounded Rectangle"
            >
              <div className="w-6 h-4 rounded-md border border-black"></div>
            </button>
          </div>

          {/* Fill Style */}
          <div className="mt-2 border-t border-[#808080] pt-2">
            <div className="text-xs text-center mb-1">Fill Style</div>
            <div className="flex flex-col gap-1">
              <button
                className={`w-full h-6 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                  fillStyle === "transparent"
                    ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]"
                    : ""
                }`}
                onClick={() => handleFillStyleSelect("transparent")}
                title="No Fill"
              >
                <div className="w-4 h-4 border border-black mx-auto"></div>
              </button>
              <button
                className={`w-full h-6 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                  fillStyle === "solid" ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
                }`}
                onClick={() => handleFillStyleSelect("solid")}
                title="Solid Fill"
              >
                <div className="w-4 h-4 bg-black mx-auto"></div>
              </button>
            </div>
          </div>

          {/* Line Width */}
          <div className="mt-2 border-t border-[#808080] pt-2">
            <div className="text-xs text-center mb-1">Line Width</div>
            <div className="flex flex-col gap-1">
              <button
                className={`w-full h-6 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                  lineWidth === 1 ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
                }`}
                onClick={() => handleLineWidthSelect(1)}
                title="1px"
              >
                <div className="w-4 h-[1px] bg-black mx-auto"></div>
              </button>
              <button
                className={`w-full h-6 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                  lineWidth === 3 ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
                }`}
                onClick={() => handleLineWidthSelect(3)}
                title="3px"
              >
                <div className="w-4 h-[3px] bg-black mx-auto"></div>
              </button>
              <button
                className={`w-full h-6 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] ${
                  lineWidth === 5 ? "bg-[#d0d0d0] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]" : ""
                }`}
                onClick={() => handleLineWidthSelect(5)}
                title="5px"
              >
                <div className="w-4 h-[5px] bg-black mx-auto"></div>
              </button>
            </div>
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

      {/* Bottom Color Palette - Windows 95 Style */}
      <div className="bg-[#c0c0c0] border-t border-[#808080] flex items-start p-1">
        <div className="flex flex-col mr-1">
          {/* Current Colors - Primary/Secondary */}
          <div
            className="w-8 h-8 border border-[#404040] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#808080]"
            style={{ backgroundColor: color }}
          ></div>
          <div
            className="w-8 h-8 border border-[#404040] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#808080] mt-[1px]"
            style={{ backgroundColor: backgroundColor }}
          ></div>
        </div>

        <div className="flex flex-col border border-[#404040] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#808080]">
          {/* First row - Basic colors */}
          <div className="flex">
            <button
              className={`w-6 h-6 ${color === "#000000" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#000000" }}
              onClick={() => handleColorSelect("#000000")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#000000")}
              title="Black"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#808080" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#808080" }}
              onClick={() => handleColorSelect("#808080")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#808080")}
              title="Gray"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#800000" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#800000" }}
              onClick={() => handleColorSelect("#800000")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#800000")}
              title="Maroon"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#808000" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#808000" }}
              onClick={() => handleColorSelect("#808000")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#808000")}
              title="Olive"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#008000" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#008000" }}
              onClick={() => handleColorSelect("#008000")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#008000")}
              title="Green"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#008080" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#008080" }}
              onClick={() => handleColorSelect("#008080")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#008080")}
              title="Teal"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#000080" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#000080" }}
              onClick={() => handleColorSelect("#000080")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#000080")}
              title="Navy"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#800080" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#800080" }}
              onClick={() => handleColorSelect("#800080")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#800080")}
              title="Purple"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#808040" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#808040" }}
              onClick={() => handleColorSelect("#808040")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#808040")}
              title="Olive Green"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#004040" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#004040" }}
              onClick={() => handleColorSelect("#004040")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#004040")}
              title="Dark Teal"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#0000FF" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#0000FF" }}
              onClick={() => handleColorSelect("#0000FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#0000FF")}
              title="Blue"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#4040FF" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#4040FF" }}
              onClick={() => handleColorSelect("#4040FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#4040FF")}
              title="Blue-Purple"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#400040" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#400040" }}
              onClick={() => handleColorSelect("#400040")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#400040")}
              title="Dark Purple"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#804040" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#804040" }}
              onClick={() => handleColorSelect("#804040")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#804040")}
              title="Brown"
            ></button>
          </div>

          {/* Second row - Light colors */}
          <div className="flex">
            <button
              className={`w-6 h-6 ${color === "#FFFFFF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FFFFFF" }}
              onClick={() => handleColorSelect("#FFFFFF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FFFFFF")}
              title="White"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#C0C0C0" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#C0C0C0" }}
              onClick={() => handleColorSelect("#C0C0C0")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#C0C0C0")}
              title="Silver"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FF0000" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#FF0000" }}
              onClick={() => handleColorSelect("#FF0000")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FF0000")}
              title="Red"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FFFF00" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FFFF00" }}
              onClick={() => handleColorSelect("#FFFF00")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FFFF00")}
              title="Yellow"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#00FF00" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#00FF00" }}
              onClick={() => handleColorSelect("#00FF00")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#00FF00")}
              title="Lime"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#00FFFF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#00FFFF" }}
              onClick={() => handleColorSelect("#00FFFF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#00FFFF")}
              title="Cyan"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#0080FF" ? "border border-white" : ""}`}
              style={{ backgroundColor: "#0080FF" }}
              onClick={() => handleColorSelect("#0080FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#0080FF")}
              title="Light Blue"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FF00FF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FF00FF" }}
              onClick={() => handleColorSelect("#FF00FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FF00FF")}
              title="Magenta"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FFFF80" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FFFF80" }}
              onClick={() => handleColorSelect("#FFFF80")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FFFF80")}
              title="Light Yellow"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#80FFFF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#80FFFF" }}
              onClick={() => handleColorSelect("#80FFFF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#80FFFF")}
              title="Light Cyan"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#80C0FF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#80C0FF" }}
              onClick={() => handleColorSelect("#80C0FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#80C0FF")}
              title="Sky Blue"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#C0C0FF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#C0C0FF" }}
              onClick={() => handleColorSelect("#C0C0FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#C0C0FF")}
              title="Lavender"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FFC0FF" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FFC0FF" }}
              onClick={() => handleColorSelect("#FFC0FF")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FFC0FF")}
              title="Pink"
            ></button>
            <button
              className={`w-6 h-6 ${color === "#FFC0C0" ? "border border-black" : ""}`}
              style={{ backgroundColor: "#FFC0C0" }}
              onClick={() => handleColorSelect("#FFC0C0")}
              onContextMenu={(e) => handleBackgroundColorSelect(e, "#FFC0C0")}
              title="Light Red"
            ></button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-5 bg-[#c0c0c0] border-t border-[#808080] flex items-center text-xs px-2 justify-between">
        <span>{`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`}</span>
        <span>{`${isModified ? "●" : ""} ${fileName} - ${Math.round(zoomLevel * 100)}%`}</span>
      </div>
    </div>
  )
}
