"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"

// Dialog components
const SaveDialog = ({
  isOpen,
  onClose,
  onSave,
}: { isOpen: boolean; onClose: () => void; onSave: (filename: string) => void }) => {
  const [filename, setFilename] = useState("Resume-Joel-Vasquez")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-80 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Save As</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm mb-1">File name:</label>
            <div className="flex">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm"
              />
              <span className="ml-1 text-sm pt-1">.html</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Save as type:</label>
            <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm">
              <option>HTML Document (*.html)</option>
              <option disabled>Word Document (*.doc)</option>
              <option disabled>PDF Document (*.pdf)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={() => onSave(`${filename}.html`)}
            >
              Save
            </button>
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const OpenDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-80 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Open</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm mb-1">Look in:</label>
            <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm">
              <option>My Documents</option>
            </select>
          </div>

          <div className="mb-4 border border-[#808080] shadow-[inset_1px_1px_#404040] h-32 overflow-auto p-1">
            <div className="flex items-center p-1 hover:bg-[#000080] hover:text-white">
              <img src="https://v0.blob.com/word-icon.png" alt="Word Doc" className="w-4 h-4 mr-2" />
              <span className="text-sm">Resume-Joel-Vasquez.doc</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">File name:</label>
            <input
              type="text"
              value="Resume-Joel-Vasquez.doc"
              className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Files of type:</label>
            <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm">
              <option>Word Documents (*.doc)</option>
              <option>All Files (*.*)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Open
            </button>
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PrintDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-96 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Print</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm mb-1">Printer:</label>
            <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm">
              <option>HP LaserJet 4L</option>
            </select>
          </div>

          <div className="mb-4 border border-[#808080] p-2">
            <div className="text-sm font-bold mb-2">Print Range</div>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" name="printRange" className="mr-1" defaultChecked />
                <span className="text-sm">All</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="printRange" className="mr-1" />
                <span className="text-sm">Selection</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="printRange" className="mr-1" />
                <span className="text-sm">Pages</span>
              </label>
            </div>
          </div>

          <div className="mb-4 border border-[#808080] p-2">
            <div className="text-sm font-bold mb-2">Copies</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Number of copies:</span>
              <input
                type="number"
                min="1"
                defaultValue="1"
                className="w-16 border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Print
            </button>
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SpellCheckDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-96 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Spelling and Grammar</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm mb-1">Not in Dictionary:</div>
            <div className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm bg-white h-12 overflow-auto">
              <span className="text-red-600">ColorStack</span> Baruch Chapter
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm mb-1">Suggestions:</div>
            <select className="w-full border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm h-24">
              <option>Color Stack</option>
              <option>Color-Stack</option>
              <option>Color Stacks</option>
            </select>
          </div>

          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <button className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm">
                Ignore
              </button>
              <button className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm">
                Ignore All
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm">
                Change
              </button>
              <button className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm">
                Change All
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm">
                Add
              </button>
              <button
                className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const InsertTableDialog = ({
  isOpen,
  onClose,
  onInsert,
}: { isOpen: boolean; onClose: () => void; onInsert: (rows: number, columns: number) => void }) => {
  const [rows, setRows] = useState(2)
  const [columns, setColumns] = useState(2)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-80 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Insert Table</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm mb-1">Table size</label>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm">Number of rows:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-16 border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm">Number of columns:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  className="w-16 border border-[#808080] shadow-[inset_1px_1px_#404040] px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={() => {
                onInsert(rows, columns)
                onClose()
              }}
            >
              OK
            </button>
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ColorPickerDialog = ({
  isOpen,
  onClose,
  onSelectColor,
}: { isOpen: boolean; onClose: () => void; onSelectColor: (color: string) => void }) => {
  const colors = [
    "#000000",
    "#800000",
    "#008000",
    "#808000",
    "#000080",
    "#800080",
    "#008080",
    "#c0c0c0",
    "#808080",
    "#ff0000",
    "#00ff00",
    "#ffff00",
    "#0000ff",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-64 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Colors</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm mb-2">Basic colors:</div>
            <div className="grid grid-cols-8 gap-1">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className="w-6 h-6 border border-[#808080]"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onSelectColor(color)
                    onClose()
                  }}
                ></button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const HelpDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="w-96 bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-10">
        {/* Title bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
          <span className="text-sm">Microsoft Word Help</span>
          <button
            className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <img src="/images/word-icons/lamp.ico" alt="Help" className="w-6 h-6 mr-2" />
              <span className="text-sm font-bold">Microsoft Word Help</span>
            </div>
            <div className="border border-[#808080] shadow-[inset_1px_1px_#404040] p-2 bg-white h-48 overflow-auto text-sm">
              <p className="mb-2">Welcome to Microsoft Word Help.</p>
              <p className="mb-2">
                To get help on a specific topic, please use the search box or browse the help topics.
              </p>
              <p className="mb-2">This is a simulated help dialog for the Windows 95 Portfolio project.</p>
              <p>All toolbar buttons now have functionality in this resume editor!</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MenuDropdown = ({
  isOpen,
  onClose,
  items,
  position,
}: {
  isOpen: boolean
  onClose: () => void
  items: { label: string; action?: () => void; divider?: boolean; disabled?: boolean }[]
  position: { top: number; left: number }
}) => {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0" onClick={onClose}></div>
      <div
        className="absolute bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] z-50"
        style={{ top: position.top, left: position.left }}
      >
        {items.map((item, index) => (
          <div key={index}>
            {item.divider && <div className="border-t border-[#808080] my-1"></div>}
            <div
              className={`px-4 py-1 text-sm ${
                item.disabled ? "text-[#808080]" : "hover:bg-[#000080] hover:text-white cursor-pointer"
              }`}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action()
                  onClose()
                }
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function Resume() {
  // Helper function to convert font size to the HTML font size value (1-7)
  const getFontSizeValue = (size: number): string => {
    // Map pixel sizes to HTML font size values (approximate)
    if (size <= 8) return "1"
    if (size <= 10) return "2"
    if (size <= 12) return "3"
    if (size <= 14) return "4"
    if (size <= 16) return "5"
    if (size <= 18) return "6"
    return "7"
  }

  const [fontFamily, setFontFamily] = useState("Times New Roman")
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textColor, setTextColor] = useState("#000000")
  const [textAlign, setTextAlign] = useState("left")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [openDialogOpen, setOpenDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [spellCheckDialogOpen, setSpellCheckDialogOpen] = useState(false)
  const [insertTableDialogOpen, setInsertTableDialogOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [zoomLevel, setZoomLevel] = useState("100%")
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [clipboardContent, setClipboardContent] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState("")

  const resumeRef = useRef<HTMLDivElement>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  // Save current state to undo stack
  useEffect(() => {
    if (resumeRef.current) {
      const currentContent = resumeRef.current.innerHTML
      setUndoStack((prev) => [...prev.slice(-9), currentContent])
    }
  }, [fontFamily, fontSize, isBold, isItalic, isUnderline, textColor, textAlign])

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection && selection.toString()) {
        setSelectedText(selection.toString())
      } else {
        setSelectedText("")
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [])

  // Inside the Resume component, after the existing useEffect hooks, add:
  useEffect(() => {
    if (resumeRef.current) {
      // Apply font family and size to all content
      const elements = resumeRef.current.querySelectorAll('[contenteditable="true"]')
      elements.forEach((el) => {
        el.style.fontFamily = fontFamily
        el.style.fontSize = `${fontSize}px`
      })
    }
  }, [fontFamily, fontSize]) // Run when these values change

  const saveResume = () => {
    setSaveDialogOpen(true)
  }

  const handleSave = (filename: string) => {
    if (!resumeRef.current) return

    // Create a styled HTML version of the resume
    const resumeContent = resumeRef.current.innerHTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume - Joel Vasquez</title>
        <style>
          body {
            font-family: ${fontFamily}, serif;
            font-size: ${fontSize}px;
            line-height: 1.5;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { text-align: center; font-size: 1.5em; margin-bottom: 4px; }
          h2 { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px; }
          a { color: #0000FF; text-decoration: underline; }
          .header-info { text-align: center; margin-bottom: 16px; }  text-decoration: underline; }
          .header-info { text-align: center; margin-bottom: 16px; }
          .section { margin-bottom: 16px; }
          .flex-between { display: flex; justify-content: space-between; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        ${resumeContent}
      </body>
      </html>
    `

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" })

    // Create a download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename

    // Trigger the download
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Close the dialog
    setSaveDialogOpen(false)
  }

  const handleNewDocument = () => {
    if (resumeRef.current) {
      if (confirm("Do you want to create a new document? Any unsaved changes will be lost.")) {
        resumeRef.current.innerHTML = `
          <div class="max-w-4xl mx-auto">
            <h1 class="text-center text-xl font-bold mb-1" contentEditable suppressContentEditableWarning>New Document</h1>
            <p contentEditable suppressContentEditableWarning>Start typing your document here...</p>
          </div>
        `
      }
    }
  }

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const currentState = undoStack.pop()
      if (currentState && resumeRef.current) {
        setRedoStack((prev) => [...prev, currentState])
        const previousState = undoStack[undoStack.length - 1]
        resumeRef.current.innerHTML = previousState
      }
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop()
      if (nextState && resumeRef.current) {
        setUndoStack((prev) => [...prev, nextState])
        resumeRef.current.innerHTML = nextState
      }
    }
  }

  const handleCut = () => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString()
      setClipboardContent(selectedText)
      document.execCommand("cut")
    }
  }

  const handleCopy = () => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString()
      setClipboardContent(selectedText)
      document.execCommand("copy")
    }
  }

  const handlePaste = () => {
    if (clipboardContent) {
      document.execCommand("paste")
    }
  }

  const handleInsertTable = (rows: number, columns: number) => {
    if (resumeRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)

        // Create table HTML
        let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
        for (let i = 0; i < rows; i++) {
          tableHTML += "<tr>"
          for (let j = 0; j < columns; j++) {
            tableHTML += '<td style="border: 1px solid #000; padding: 5px;">Cell</td>'
          }
          tableHTML += "</tr>"
        }
        tableHTML += "</table>"

        // Insert table at cursor position
        const tableElement = document.createElement("div")
        tableElement.innerHTML = tableHTML
        range.deleteContents()
        range.insertNode(tableElement)
      }
    }
  }

  const handleInsertExcel = () => {
    alert("This would insert an Excel worksheet in a real Word 95 application.")
  }

  const handleColumns = () => {
    alert("This would open the columns dialog in a real Word 95 application.")
  }

  const handleDrawing = () => {
    alert("This would open the drawing tools in a real Word 95 application.")
  }

  const handleTextColor = (color: string) => {
    setTextColor(color)
    document.execCommand("foreColor", false, color)
  }

  const handleAlignment = (align: string) => {
    setTextAlign(align)
    document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`, false, "")
  }

  const handleBullets = () => {
    document.execCommand("insertUnorderedList", false, "")
  }

  const handleNumbering = () => {
    document.execCommand("insertOrderedList", false, "")
  }

  const handleIndent = () => {
    document.execCommand("indent", false, "")
  }

  const handleOutdent = () => {
    document.execCommand("outdent", false, "")
  }

  const handleBorders = () => {
    alert("This would open the borders dialog in a real Word 95 application.")
  }

  const handleZoomChange = (zoom: string) => {
    setZoomLevel(zoom)
    if (resumeRef.current) {
      const zoomValue = Number.parseInt(zoom.replace("%", "")) / 100
      resumeRef.current.style.transform = `scale(${zoomValue})`
      resumeRef.current.style.transformOrigin = "top center"
    }
  }

  const handleMenuClick = (menuName: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setMenuPosition({ top: rect.bottom, left: rect.left })
    setActiveMenu(activeMenu === menuName ? null : menuName)
  }

  const getMenuItems = (menuName: string) => {
    switch (menuName) {
      case "File":
        return [
          { label: "New...", action: handleNewDocument },
          { label: "Open...", action: () => setOpenDialogOpen(true) },
          { label: "Save", action: saveResume },
          { label: "Save As...", action: () => setSaveDialogOpen(true) },
          { divider: true },
          { label: "Print...", action: () => setPrintDialogOpen(true) },
          {
            label: "Print Preview...",
            action: () => alert("This would open Print Preview in a real Word 95 application."),
          },
          { divider: true },
          { label: "Exit", action: () => alert("This would close Word in a real Word 95 application.") },
        ]
      case "Edit":
        return [
          { label: "Undo", action: handleUndo, disabled: undoStack.length <= 1 },
          { label: "Redo", action: handleRedo, disabled: redoStack.length === 0 },
          { divider: true },
          { label: "Cut", action: handleCut, disabled: !selectedText },
          { label: "Copy", action: handleCopy, disabled: !selectedText },
          { label: "Paste", action: handlePaste, disabled: !clipboardContent },
          { divider: true },
          { label: "Select All", action: () => document.execCommand("selectAll", false, "") },
        ]
      case "View":
        return [
          { label: "Normal", action: () => {} },
          { label: "Page Layout", action: () => {} },
          { label: "Outline", action: () => {} },
          { divider: true },
          { label: "Toolbars", action: () => {} },
          { label: "Ruler", action: () => {} },
          { label: "Status Bar", action: () => {} },
        ]
      case "Insert":
        return [
          { label: "Break...", action: () => {} },
          { label: "Page Numbers...", action: () => {} },
          { divider: true },
          { label: "Table...", action: () => setInsertTableDialogOpen(true) },
          { label: "Picture...", action: () => {} },
          { divider: true },
          { label: "Date and Time...", action: () => {} },
        ]
      case "Format":
        return [
          { label: "Font...", action: () => {} },
          { label: "Paragraph...", action: () => {} },
          { label: "Bullets and Numbering...", action: () => {} },
          { divider: true },
          { label: "Borders and Shading...", action: () => {} },
          { label: "Columns...", action: () => {} },
        ]
      case "Tools":
        return [
          { label: "Spelling and Grammar...", action: () => setSpellCheckDialogOpen(true) },
          { label: "Word Count...", action: () => {} },
          { divider: true },
          { label: "Options...", action: () => {} },
        ]
      case "Table":
        return [
          { label: "Insert Table...", action: () => setInsertTableDialogOpen(true) },
          { label: "Insert Rows...", action: () => {} },
          { label: "Insert Columns...", action: () => {} },
          { divider: true },
          { label: "Delete Cells...", action: () => {} },
        ]
      case "Window":
        return [
          { label: "New Window", action: () => {} },
          { label: "Arrange All", action: () => {} },
          { divider: true },
          { label: "1 Resume.doc", action: () => {} },
        ]
      case "Help":
        return [
          { label: "Contents and Index...", action: () => setHelpDialogOpen(true) },
          { label: "Search for Help on...", action: () => {} },
          { divider: true },
          { label: "About Microsoft Word...", action: () => {} },
        ]
      default:
        return []
    }
  }

  // Add this after the other useEffect hooks but before the return statement
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.getAttribute("contenteditable") === "true") {
        // Update the current font family and size based on the focused element
        if (target.style.fontFamily) {
          setFontFamily(target.style.fontFamily.replace(/['"]/g, ""))
        }
        if (target.style.fontSize) {
          const size = Number.parseInt(target.style.fontSize)
          if (!isNaN(size)) {
            setFontSize(size)
          }
        }
      }
    }

    document.addEventListener("focusin", handleFocus)
    return () => {
      document.removeEventListener("focusin", handleFocus)
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-white overflow-auto">
      {/* Title Bar - Matches Word 95 exactly */}
      <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between text-xs w-full">
        <div className="flex items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tumblr_f2c27a91f54419385ed432fef515e294_f510d5e9_540-iY50eOOB2pUgfjVFWc4SmarteRXT2r.png"
            alt="Word 95"
            className="w-4 h-4 mr-1"
          />
          <span>Microsoft Word - Resume.doc</span>
        </div>
        <div className="controls flex gap-[5px]">
          <button
            className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[10px] text-center font-bold leading-3 p-0 hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
            onClick={(e) => {
              e.stopPropagation()
              const event = new CustomEvent("windowAction", { detail: { action: "minimize", id: "resume" } })
              window.dispatchEvent(event)
            }}
          >
            _
          </button>
          <button
            className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[10px] text-center font-bold leading-3 p-0 hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
            onClick={(e) => {
              e.stopPropagation()
              console.log("Maximize button clicked in resume")
              // Use a more direct approach to dispatch the event
              window.dispatchEvent(
                new CustomEvent("windowAction", {
                  detail: {
                    action: "maximize",
                    id: "resume",
                  },
                }),
              )
            }}
          >
            □
          </button>
          <button
            className="w-4 h-4 bg-[#c0c0c0] border-[#ffffff] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#000000] cursor-pointer text-black text-[10px] text-center font-bold leading-3 p-0 hover:bg-[#000080] hover:text-white hover:shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
            onClick={(e) => {
              e.stopPropagation()
              const event = new CustomEvent("windowAction", { detail: { action: "close", id: "resume" } })
              window.dispatchEvent(event)
            }}
          >
            X
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div
        ref={menuBarRef}
        className="menu-bar bg-[#c0c0c0] flex p-[2px] gap-1 text-[11px] border-b border-[#808080] w-full items-center"
      >
        {/* Word icon */}
        <img src="/images/word-icon.png" alt="Word" className="w-6 h-6 ml-1 mr-1" />

        {/* Menu items with underlined access keys */}
        <span
          className={`cursor-pointer px-1 ${activeMenu === "File" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("File", e)}
        >
          <u>F</u>ile
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Edit" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Edit", e)}
        >
          <u>E</u>dit
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "View" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("View", e)}
        >
          <u>V</u>iew
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Insert" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Insert", e)}
        >
          <u>I</u>nsert
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Format" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Format", e)}
        >
          F<u>o</u>rmat
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Tools" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Tools", e)}
        >
          <u>T</u>ools
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Table" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Table", e)}
        >
          T<u>a</u>ble
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Window" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Window", e)}
        >
          <u>W</u>indow
        </span>
        <span
          className={`cursor-pointer px-1 ${activeMenu === "Help" ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"}`}
          onClick={(e) => handleMenuClick("Help", e)}
        >
          <u>H</u>elp
        </span>
      </div>

      {/* Standard Toolbar */}
      <div className="toolbar bg-[#c0c0c0] flex items-center p-1 border-b border-[#808080] gap-0 w-full">
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleNewDocument}
          title="New"
        >
          <img src="/images/word-icons/blank-sheet.ico" alt="New" className="w-4 h-4" />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => setOpenDialogOpen(true)}
          title="Open"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_open-CHIqGUQ4aQ5mErt2lq80XyfGibQo2u.png"
            alt="Open"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={saveResume}
          title="Save"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_save-yfYPJ54E6ahel52K4NqpQaG39q7Mkg.png"
            alt="Save"
            className="w-4 h-4"
          />
        </button>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => setPrintDialogOpen(true)}
          title="Print"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_print-kWToX75IB1eUdCUbFibknTYSa6PLXl.png"
            alt="Print"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => alert("This would open Print Preview in a real Word 95 application.")}
          title="Print Preview"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_printpreview-bp8aTTUCeXg0AGOnSiqQUNx9tnG398.png"
            alt="Print Preview"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => setSpellCheckDialogOpen(true)}
          title="Spell Check"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_spelling-OSIqYKty2R0URAdwCLTKy0EcmxANIM.png"
            alt="Spell Check"
            className="w-4 h-4"
          />
        </button>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleCut}
          title="Cut"
          disabled={!selectedText}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_cut-R7MmBjJcI3eJ3hvuXDN3atEYPmTLxv.png"
            alt="Cut"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleCopy}
          title="Copy"
          disabled={!selectedText}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_copy-EE3hf1v4OudPqGTN2drU4uAlHsivQv.png"
            alt="Copy"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handlePaste}
          title="Paste"
          disabled={!clipboardContent}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_paste-AgNRiDUctLG8Pmpqk7F1Ezw7P6Dl3n.png"
            alt="Paste"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => alert("This would open the format painter in a real Word 95 application.")}
          title="Format Painter"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_formatpaintbrush-HmjAgYA8HdHB71nhX9qhRxbrFHR87q.png"
            alt="Format Painter"
            className="w-4 h-4"
          />
        </button>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <div className="flex">
          <button
            className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-r-0"
            onClick={handleUndo}
            title="Undo"
            disabled={undoStack.length <= 1}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_undo-xvVLrKkw0CGASx8Z8K3L6WxOsJqIGk.png"
              alt="Undo"
              className="w-4 h-4"
            />
          </button>
          <button
            className="w-3 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-l-0"
            onClick={() => alert("This would show a list of actions to undo in a real Word 95 application.")}
            title="Undo List"
            disabled={undoStack.length <= 1}
          >
            <span className="text-xs">▼</span>
          </button>
        </div>
        <div className="flex">
          <button
            className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-r-0"
            onClick={handleRedo}
            title="Redo"
            disabled={redoStack.length === 0}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_redo-CNFRFCOLWnpmZLws1zYA8ybO6aytPv.png"
              alt="Redo"
              className="w-4 h-4"
            />
          </button>
          <button
            className="w-3 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-l-0"
            onClick={() => alert("This would show a list of actions to redo in a real Word 95 application.")}
            title="Redo List"
            disabled={redoStack.length === 0}
          >
            <span className="text-xs">▼</span>
          </button>
        </div>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => setInsertTableDialogOpen(true)}
          title="Insert Table"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sc_inserttable-dpCYxbaLwrwh4cOsaoot9N4Fx1WJLC.png"
            alt="Insert Table"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => handleAlignment("justify")}
          title="Justify Text"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_alignblock-k41cmsnvIV4sMnGrGTHt4K4oIvYbBq.png"
            alt="Justify Text"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleDrawing}
          title="Drawing"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_insertdraw-rLxQyFsz9YgnaJsvDU4isoNqx301Rw.png"
            alt="Drawing"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => alert("This would show control codes in a real Word 95 application.")}
          title="Control Codes"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_controlcodes-CnmZaoaIjaB0GxCOctnjE73jz3oHtL.png"
            alt="Control Codes"
            className="w-4 h-4"
          />
        </button>
      </div>

      {/* Formatting Toolbar */}
      <div className="toolbar bg-[#c0c0c0] flex items-center p-1 border-b border-[#808080] gap-0 w-full">
        <select
          className="w-32 h-6 bg-white border border-[#808080] shadow-[inset_1px_1px_#404040] px-1 text-[11px]"
          value="Normal"
          onChange={(e) => {
            // This would apply different predefined styles in a real Word app
            alert("This would apply a style in a real Word 95 application.")
          }}
        >
          <option>Normal</option>
          <option>Heading 1</option>
          <option>Heading 2</option>
          <option>Heading 3</option>
        </select>
        <select
          className="w-36 h-6 bg-white border border-[#808080] shadow-[inset_1px_1px_#404040] px-1 text-[11px]"
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value)

            // Apply to selected text
            const selection = window.getSelection()
            if (selection && !selection.isCollapsed) {
              document.execCommand("fontName", false, e.target.value)
            } else {
              // If no selection, apply to editable elements for future typing
              if (resumeRef.current) {
                const editableElements = resumeRef.current.querySelectorAll('[contenteditable="true"]')
                editableElements.forEach((el) => {
                  el.style.fontFamily = e.target.value
                })
              }
            }
          }}
        >
          {/* Serif Fonts */}
          <option style={{ fontFamily: "Times New Roman" }}>Times New Roman</option>
          <option style={{ fontFamily: "Georgia" }}>Georgia</option>
          <option style={{ fontFamily: "Garamond" }}>Garamond</option>
          <option style={{ fontFamily: "Palatino" }}>Palatino</option>
          <option style={{ fontFamily: "Baskerville" }}>Baskerville</option>
          <option style={{ fontFamily: "Cambria" }}>Cambria</option>

          {/* Sans-Serif Fonts */}
          <option style={{ fontFamily: "Arial" }}>Arial</option>
          <option style={{ fontFamily: "Helvetica" }}>Helvetica</option>
          <option style={{ fontFamily: "Verdana" }}>Verdana</option>
          <option style={{ fontFamily: "Tahoma" }}>Tahoma</option>
          <option style={{ fontFamily: "Trebuchet MS" }}>Trebuchet MS</option>
          <option style={{ fontFamily: "Calibri" }}>Calibri</option>
          <option style={{ fontFamily: "Geneva" }}>Geneva</option>
          <option style={{ fontFamily: "Segoe UI" }}>Segoe UI</option>

          {/* Monospace Fonts */}
          <option style={{ fontFamily: "Courier New" }}>Courier New</option>
          <option style={{ fontFamily: "Consolas" }}>Consolas</option>
          <option style={{ fontFamily: "Lucida Console" }}>Lucida Console</option>
          <option style={{ fontFamily: "Monaco" }}>Monaco</option>

          {/* Decorative Fonts */}
          <option style={{ fontFamily: "Comic Sans MS" }}>Comic Sans MS</option>
          <option style={{ fontFamily: "Impact" }}>Impact</option>
          <option style={{ fontFamily: "Arial Black" }}>Arial Black</option>
          <option style={{ fontFamily: "Century Gothic" }}>Century Gothic</option>
        </select>
        <select
          className="w-12 h-6 bg-white border border-[#808080] shadow-[inset_1px_1px_#404040] px-1 text-[11px]"
          value={fontSize}
          onChange={(e) => {
            const newSize = Number(e.target.value)
            setFontSize(newSize)

            // Apply to selected text
            const selection = window.getSelection()
            if (selection && !selection.isCollapsed) {
              document.execCommand("fontSize", false, getFontSizeValue(newSize))

              // Fix the actual size since execCommand fontSize uses 1-7 values
              const fontElements = document.getElementsByTagName("font")
              for (let i = 0; i < fontElements.length; i++) {
                if (fontElements[i].size) {
                  fontElements[i].style.fontSize = `${newSize}px`
                }
              }
            } else {
              // If no selection, apply to editable elements for future typing
              if (resumeRef.current) {
                const editableElements = resumeRef.current.querySelectorAll('[contenteditable="true"]')
                editableElements.forEach((el) => {
                  el.style.fontSize = `${newSize}px`
                })
              }
            }
          }}
        >
          <option>8</option>
          <option>9</option>
          <option>10</option>
          <option>11</option>
          <option>12</option>
          <option>14</option>
          <option>16</option>
          <option>18</option>
        </select>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            isBold ? "bg-[#808080]" : ""
          }`}
          onClick={() => {
            setIsBold(!isBold)
            document.execCommand("bold", false, "")
          }}
          title="Bold"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_bold-t8yYeMAuIIvN8RB04H3VRyCvlA54Od.png"
            alt="Bold"
            className="w-4 h-4"
          />
        </button>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            isItalic ? "bg-[#808080]" : ""
          }`}
          onClick={() => {
            setIsItalic(!isItalic)
            document.execCommand("italic", false, "")
          }}
          title="Italic"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_italic-1GDUNnhzWyoh0NgyWgpacWUjycuzke.png"
            alt="Italic"
            className="w-4 h-4"
          />
        </button>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            isUnderline ? "bg-[#808080]" : ""
          }`}
          onClick={() => {
            setIsUnderline(!isUnderline)
            document.execCommand("underline", false, "")
          }}
          title="Underline"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_underline-sXt3lqrvXyRNTk3JtYmyQMMp9bB1xO.png"
            alt="Underline"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => setColorPickerOpen(true)}
          title="Text Color"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/text%20color-gvsxk6HzYsIV7CgJlUQn3U7sgEjJBc.png"
            alt="Text Color"
            className="w-4 h-4"
          />
        </button>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            textAlign === "left" ? "bg-[#808080]" : ""
          }`}
          onClick={() => handleAlignment("left")}
          title="Align Left"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_alignleft-SEZvT86YUbG1dpMeW9bClJ7bcFF6NM.png"
            alt="Align Left"
            className="w-4 h-4"
          />
        </button>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            textAlign === "center" ? "bg-[#808080]" : ""
          }`}
          onClick={() => handleAlignment("center")}
          title="Align Center"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_alignhorizontalcenter-uTzxSuoOucjxFa0gYhhowcs60QdVD0.png"
            alt="Align Center"
            className="w-4 h-4"
          />
        </button>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            textAlign === "right" ? "bg-[#808080]" : ""
          }`}
          onClick={() => handleAlignment("right")}
          title="Align Right"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_alignright-jlb8qGmy9hLOhZ3aLESd4YBz7EhiAn.png"
            alt="Align Right"
            className="w-4 h-4"
          />
        </button>
        <button
          className={`w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center ${
            textAlign === "justify" ? "bg-[#808080]" : ""
          }`}
          onClick={() => handleAlignment("justify")}
          title="Justify"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_alignblock-RAkTVGENJ9WwFCiG0SJUbeWDoXIOTa.png"
            alt="Justify"
            className="w-4 h-4"
          />
        </button>
        <div className="border-l-2 border-[#808080] h-6 mx-1"></div>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleBullets}
          title="Bullets"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_defaultbullet-9Nl2Mnx6wan4McEZ1ecBBcv73wjOYw.png"
            alt="Bullets"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleNumbering}
          title="Numbering"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_defaultnumbering-z4K9cBfWQbIJK8FhIBvAQ7A8z06157.png"
            alt="Numbering"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleOutdent}
          title="Decrease Indent"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_decrementindent-21Cb8YlGvlDyOoWdkV1T5obPz8effI.png"
            alt="Decrease Indent"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleIndent}
          title="Increase Indent"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_incrementindent-eTVvBNnQCvflrdiePIt50k6aV8chtp.png"
            alt="Increase Indent"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleColumns}
          title="Columns"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_formatcolumns-QzZQeuBKk4XrK17NX0KbpA1oEtNzbh.png"
            alt="Columns"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={handleBorders}
          title="Borders"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lc_setborderstyle-54X5u6FAXktA6BhHwSgUElBQPicb6F.png"
            alt="Borders"
            className="w-4 h-4"
          />
        </button>
      </div>

      {/* Ruler */}
      <div className="h-5 bg-[#c0c0c0] border-b border-[#808080] relative">
        <div className="absolute top-3 left-0 w-full h-2 flex">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className={`border-l border-[#404040] ${i % 10 === 0 ? "h-2" : i % 5 === 0 ? "h-1.5" : "h-1"}`}
              style={{ width: "0.125rem" }}
            ></div>
          ))}
        </div>
      </div>

      {/* Document Content */}
      <div
        ref={resumeRef}
        className="document flex-1 overflow-auto p-6 bg-white"
        style={{
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight: isBold ? "bold" : "normal",
          fontStyle: isItalic ? "italic" : "normal",
          textDecoration: isUnderline ? "underline" : "none",
          color: textColor,
          textAlign: textAlign,
          transform: `scale(${Number.parseInt(zoomLevel.replace("%", "")) / 100})`,
          transformOrigin: "top center",
        }}
      >
        {/* We're not using contentEditable on the parent div anymore */}

        <div className="max-w-4xl mx-auto">
          <h1 className="text-center text-xl font-bold mb-1" contentEditable suppressContentEditableWarning>
            Joel Vasquez
          </h1>
          <p className="text-center mb-4" contentEditable suppressContentEditableWarning>
            New York, NY | 347-608-1406 | jfvasq1@gmail.com |{" "}
            <a
              href="https://linkedin.com/in/jvasquezcs"
              className="text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin.com/in/jvasquezcs
            </a>{" "}
            |{" "}
            <a
              href="https://github.com/jguapp"
              className="text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/jguapp
            </a>{" "}
            |{" "}
            <a
              href="https://builtbyjoel.vercel.app"
              className="text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              builtbyjoel.vercel.app
            </a>
          </p>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              EDUCATION
            </h2>
            <div contentEditable suppressContentEditableWarning>
              <p className="flex justify-between">
                <strong>Baruch College, Weismann School of Arts and Sciences</strong>
                <span>New York, NY</span>
              </p>
              <p className="flex justify-between">
                <em>Bachelor of Science in Computer Science, Minor in Mathematics</em>
                <span>Expected December 2026</span>
              </p>
              <p>
                <strong>Relevant Coursework:</strong> Data Structures & Algorithms, Object-Oriented Programming, Systems
                Analysis & Design, Database Management Systems, Operating Systems, Computer Networking, Computer
                Architecture, Cloud Computing
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              TECHNICAL SKILLS AND CERTIFICATIONS
            </h2>
            <div contentEditable suppressContentEditableWarning>
              <p>
                <strong>Programming Languages:</strong> Python, R, C++, SQL, HTML/CSS, JavaScript, Swift, Kotlin
              </p>
              <p>
                <strong>Frameworks and Libraries:</strong> MySQL, Pandas, NumPy, TensorFlow, React, Flask, Redis,
                scikit-learn
              </p>
              <p>
                <strong>Developer Tools:</strong> AWS, Azure, Git, Docker, PowerBI, Linux
              </p>
              <p>
                <strong>Certifications:</strong> CompTIA ITF+, CompTIA A+, CodePath Technical Interview Prep, CodePath
                iOS Development
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              PROFESSIONAL EXPERIENCE
            </h2>
            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Data Engineer</strong> | Python, R
                </p>
                <p>November 2023 - Present</p>
              </div>
              <div className="flex justify-between">
                <p>
                  <strong>CUNY Institute for Demographic Research</strong>
                </p>
                <p>New York, NY</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Spearhead critical data support on a research project for urban growth models, directly impacting
                  policy and planning decisions for <strong>145</strong> countries representing <strong>80%</strong> of
                  the world's population.
                </li>
                <li>
                  Develop R and Python scripts to automate data cleaning processes, reducing preprocessing time and
                  improving data quality for over <strong>1000</strong> files.
                </li>
                <li>
                  Specialize in converting demographic data from <strong>145</strong> PDFs into structured Excel
                  spreadsheets, enhancing data accessibility and reducing manual data entry time by <strong>75%</strong>
                  .
                </li>
              </ul>
            </div>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Front-End Developer</strong> | HTML, CSS, JavaScript
                </p>
                <p>February 2024 - May 2024</p>
              </div>
              <div className="flex justify-between">
                <p>
                  <strong>Reach Into Cultural Heights</strong>
                </p>
                <p>New York, NY</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Designed and implemented a search bar on the company website, improving user navigation and
                  accessibility by <strong>30%</strong>, as measured by user engagement metrics.
                </li>
                <li>
                  Enhanced AI chatbot performance by integrating <strong>ChatGPT-4</strong> in place of{" "}
                  <strong>GPT-2</strong>, improving response accuracy by <strong>50%</strong> as validated through A/B
                  testing.
                </li>
                <li>
                  Led data analysis for a new digital after-school program, identifying <strong>4</strong> key user
                  behavior patterns that drove an increase in platform engagement and <strong>70%</strong> improvement
                  in user retention.
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              PERSONAL PROJECTS
            </h2>
            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Bloomberg Real-Time News Feed</strong> | React, Flask, Redis
                </p>
                <a href="#" className="text-blue-800 underline">
                  GitHub
                </a>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Developed a fullstack web application using React, Flask, and Redis as part of a{" "}
                  <strong>Bloomberg</strong>-hosted Tech Lab.
                </li>
                <li>
                  Designed and deployed a scalable containerized environment with <strong>Docker</strong> and Docker
                  Compose, reducing deployment setup time by <strong>40%</strong> and ensuring seamless integration
                  between frontend and backend services.
                </li>
                <li>
                  Built an interactive, real-time UI with React, implementing features like live news updates,
                  increasing user engagement by <strong>25%</strong> while mastering <strong>CI/CD pipelines</strong>{" "}
                  and automated testing.
                </li>
              </ul>
            </div>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>IMDB Reviews Sentiment Classifier</strong> | Python, NumPy, TensorFlow
                </p>
                <a href="#" className="text-blue-800 underline">
                  GitHub
                </a>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Achieved <strong>82%</strong> test accuracy on IMDB sentiment classification by developing a custom
                  deep learning model using stacked Bidirectional LSTMs, outperforming baseline logistic regression by
                  over <strong>20%</strong>.
                </li>
                <li>
                  Engineered an NLP pipeline to preprocess and classify <strong>500MB+</strong> of raw text data,
                  optimizing sequence padding and tokenizer efficiency to reduce training time by <strong>30%</strong>{" "}
                  while preserving high accuracy.
                </li>
                <li>
                  Improved sentiment comprehension and classification precision by <strong>15%</strong> using stacked{" "}
                  <strong>Bidirectional LSTM</strong> layers, reducing false positives/negatives by <strong>20%</strong>{" "}
                  through better context retention.
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              LEADERSHIP EXPERIENCE
            </h2>
            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>ColorStack Baruch Chapter</strong> | Vice President
                </p>
                <p>January 2024 - Present</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Expanded ColorStack Baruch Chapter from <strong>4</strong> founding members to over{" "}
                  <strong>200</strong> active participants in two semesters, cultivating a diverse community of
                  underrepresented students in tech.
                </li>
                <li>
                  Organized <strong>10+</strong> hands-on coding workshops for <strong>70</strong> participants, with{" "}
                  <strong>80%</strong> reporting improved job readiness in web development, cloud computing, and
                  database management.
                </li>
                <li>
                  Established relationships with <strong>5</strong> tech companies, including <strong>Bloomberg</strong>{" "}
                  and <strong>Protiviti</strong>, resulting in job and internship opportunities through targeted mock
                  case studies, networking events, and interview prep sessions.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SaveDialog isOpen={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} onSave={handleSave} />
      <OpenDialog isOpen={openDialogOpen} onClose={() => setOpenDialogOpen(false)} />
      <PrintDialog isOpen={printDialogOpen} onClose={() => setPrintDialogOpen(false)} />
      <SpellCheckDialog isOpen={spellCheckDialogOpen} onClose={() => setSpellCheckDialogOpen(false)} />
      <InsertTableDialog
        isOpen={insertTableDialogOpen}
        onClose={() => setInsertTableDialogOpen(false)}
        onInsert={handleInsertTable}
      />
      <ColorPickerDialog
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        onSelectColor={handleTextColor}
      />
      <HelpDialog isOpen={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />

      {/* Menu Dropdowns */}
      {activeMenu && (
        <MenuDropdown
          isOpen={true}
          onClose={() => setActiveMenu(null)}
          items={getMenuItems(activeMenu)}
          position={menuPosition}
        />
      )}
    </div>
  )
}
