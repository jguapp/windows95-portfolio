"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { CloseIcon, MaximizeIcon, MinimizeIcon } from "@/components/win95-controls"
import { messageBox } from "@/components/win95-dialog"

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
            <CloseIcon />
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
            <CloseIcon />
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
            <CloseIcon />
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
              onClick={() => {
                /*
                  A real print, scoped by the stylesheet: with the printing
                  attribute set, everything but the document page is hidden and
                  the clipping ancestors open up so the resume paginates. The
                  attribute comes off again whether the visitor prints or
                  cancels, via afterprint.
                */
                onClose()
                document.body.setAttribute("data-printing", "resume")
                const done = () => {
                  document.body.removeAttribute("data-printing")
                  window.removeEventListener("afterprint", done)
                }
                window.addEventListener("afterprint", done)
                setTimeout(() => window.print(), 50)
              }}
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
            <CloseIcon />
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
            <CloseIcon />
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
            <CloseIcon />
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
            <CloseIcon />
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
  // Divider entries carry no label.
  items: { label?: string; action?: () => void; divider?: boolean; disabled?: boolean }[]
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

/**
 * The page, and the margins the ruler draws.
 *
 * Wider than a strict 8.5in sheet on purpose: the real resume runs narrow
 * margins and packs each bullet onto fewer lines, and at letter width with an
 * inch either side the same text wrapped two or three times more often than
 * the document it is copying.
 *
 * PAGE_MARGIN has to match the page's own padding or the ruler lies about
 * where the text starts, which it did: it was drawing one-inch margins over a
 * page padded by 40.
 */
const PAGE_WIDTH = 1120
const PAGE_PADDING = 44
const PAGE_MARGIN = PAGE_PADDING

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
  const [textAlign, setTextAlign] = useState<React.CSSProperties["textAlign"]>("left")
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
  /** Where the caret is, for the status bar. Word always showed this. */
  const [caret, setCaret] = useState({ line: 1, col: 1 })

  /**
   * Reads the caret out of the selection.
   *
   * Line is counted by how many block elements precede the one holding the
   * caret, which is as close to Word's idea of a line as a contentEditable
   * document gets without laying out the text itself.
   */
  const updateCaret = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const node = selection.anchorNode
    if (!node) return

    const page = resumeRef.current
    if (!page || !page.contains(node)) return

    const block = (node.nodeType === 3 ? node.parentElement : (node as HTMLElement))?.closest(
      "p, li, h1, h2, h3, div",
    )
    const blocks = [...page.querySelectorAll("p, li, h1, h2, h3")]
    const index = block ? blocks.indexOf(block as HTMLElement) : -1
    setCaret({ line: index >= 0 ? index + 1 : 1, col: selection.anchorOffset + 1 })
  }
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
      const elements = resumeRef.current.querySelectorAll<HTMLElement>('[contenteditable="true"]')
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

  const handleColumns = () => {
    messageBox({ title: "Microsoft Word", text: "This would open the columns dialog in a real Word 95 application.", icon: "information" })
  }

  const handleDrawing = () => {
    messageBox({ title: "Microsoft Word", text: "This would open the drawing tools in a real Word 95 application.", icon: "information" })
  }

  const handleTextColor = (color: string) => {
    setTextColor(color)
    document.execCommand("foreColor", false, color)
  }

  const handleAlignment = (align: "left" | "center" | "right" | "justify") => {
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
    messageBox({ title: "Microsoft Word", text: "This would open the borders dialog in a real Word 95 application.", icon: "information" })
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
            action: () => messageBox({ title: "Microsoft Word", text: "This would open Print Preview in a real Word 95 application.", icon: "information" }),
          },
          { divider: true },
          { label: "Exit", action: () => messageBox({ title: "Microsoft Word", text: "This would close Word in a real Word 95 application.", icon: "information" }) },
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
            src="/images/blob/tumblr-f2c27a91f54419385ed432fef515e294-f510d5e9-540.png"
            alt="Word 95"
            className="w-4 h-4 mr-1"
          />
          <span>Microsoft Word - Resume.doc</span>
        </div>
        <div className="controls flex gap-[5px]">
          <button
            className="w-4 h-4 shrink-0 bg-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] cursor-pointer text-black p-0 flex items-center justify-center hover:bg-[#dfdfdf] active:shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff]"
            aria-label="Minimize"
            onClick={(e) => {
              e.stopPropagation()
              window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "minimize", id: "resume" } }))
            }}
          >
            <MinimizeIcon />
          </button>
          <button
            className="w-4 h-4 shrink-0 bg-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] cursor-pointer text-black p-0 flex items-center justify-center hover:bg-[#dfdfdf] active:shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff]"
            aria-label="Maximize"
            onClick={(e) => {
              e.stopPropagation()
              window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "maximize", id: "resume" } }))
            }}
          >
            <MaximizeIcon />
          </button>
          <button
            className="w-4 h-4 shrink-0 bg-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] cursor-pointer text-black p-0 flex items-center justify-center hover:bg-[#dfdfdf] active:shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff]"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation()
              window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "resume" } }))
            }}
          >
            <CloseIcon />
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
      <div
        data-toolbar
        className="toolbar bg-[#c0c0c0] flex items-center p-1 border-b border-[#808080] gap-0 w-full"
      >
        {/* Grab handle: Word's toolbars could be torn off, and every one wore
            this two-line ridge at its left edge. */}
        <span className="mr-1 h-[20px] w-[4px] shrink-0 border-l border-l-white border-r border-r-[#808080]" />
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
            src="/images/blob/lc-open.png"
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
            src="/images/blob/lc-save.png"
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
            src="/images/blob/lc-print.png"
            alt="Print"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => messageBox({ title: "Microsoft Word", text: "This would open Print Preview in a real Word 95 application.", icon: "information" })}
          title="Print Preview"
        >
          <img
            src="/images/blob/lc-printpreview.png"
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
            src="/images/blob/lc-spelling.png"
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
            src="/images/blob/lc-cut.png"
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
            src="/images/blob/lc-copy.png"
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
            src="/images/blob/lc-paste.png"
            alt="Paste"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => messageBox({ title: "Microsoft Word", text: "This would open the format painter in a real Word 95 application.", icon: "information" })}
          title="Format Painter"
        >
          <img
            src="/images/blob/lc-formatpaintbrush.png"
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
              src="/images/blob/lc-undo.png"
              alt="Undo"
              className="w-4 h-4"
            />
          </button>
          <button
            className="w-3 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-l-0"
            onClick={() => messageBox({ title: "Microsoft Word", text: "This would show a list of actions to undo in a real Word 95 application.", icon: "information" })}
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
              src="/images/blob/lc-redo.png"
              alt="Redo"
              className="w-4 h-4"
            />
          </button>
          <button
            className="w-3 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center border-l-0"
            onClick={() => messageBox({ title: "Microsoft Word", text: "This would show a list of actions to redo in a real Word 95 application.", icon: "information" })}
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
            src="/images/blob/sc-inserttable.png"
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
            src="/images/blob/lc-alignblock.png"
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
            src="/images/blob/lc-insertdraw.png"
            alt="Drawing"
            className="w-4 h-4"
          />
        </button>
        <button
          className="w-6 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#404040] flex items-center justify-center"
          onClick={() => messageBox({ title: "Microsoft Word", text: "This would show control codes in a real Word 95 application.", icon: "information" })}
          title="Control Codes"
        >
          <img
            src="/images/blob/lc-controlcodes.png"
            alt="Control Codes"
            className="w-4 h-4"
          />
        </button>
      </div>

      {/* Formatting Toolbar */}
      <div
        data-toolbar
        className="toolbar bg-[#c0c0c0] flex items-center p-1 border-b border-[#808080] gap-0 w-full"
      >
        {/* Grab handle: Word's toolbars could be torn off, and every one wore
            this two-line ridge at its left edge. */}
        <span className="mr-1 h-[20px] w-[4px] shrink-0 border-l border-l-white border-r border-r-[#808080]" />
        <select
          className="w-32 h-6 bg-white border border-[#808080] shadow-[inset_1px_1px_#404040] px-1 text-[11px]"
          value="Normal"
          onChange={() => {
            // This would apply different predefined styles in a real Word app
            messageBox({ title: "Microsoft Word", text: "This would apply a style in a real Word 95 application.", icon: "information" })
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
                const editableElements = resumeRef.current.querySelectorAll<HTMLElement>('[contenteditable="true"]')
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
                const editableElements = resumeRef.current.querySelectorAll<HTMLElement>('[contenteditable="true"]')
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
            src="/images/blob/lc-bold.png"
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
            src="/images/blob/lc-italic.png"
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
            src="/images/blob/lc-underline.png"
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
            src="/images/blob/text-color.png"
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
            src="/images/blob/lc-alignleft.png"
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
            src="/images/blob/lc-alignhorizontalcenter.png"
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
            src="/images/blob/lc-alignright.png"
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
            src="/images/blob/lc-alignblock.png"
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
            src="/images/blob/lc-defaultbullet.png"
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
            src="/images/blob/lc-defaultnumbering.png"
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
            src="/images/blob/lc-decrementindent.png"
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
            src="/images/blob/lc-incrementindent.png"
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
            src="/images/blob/lc-formatcolumns.png"
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
            src="/images/blob/lc-setborderstyle.png"
            alt="Borders"
            className="w-4 h-4"
          />
        </button>
        <span className="mx-1 h-5 w-[2px] border-l border-l-[#808080] border-r border-r-white" />
        <select
          data-zoom
          aria-label="Zoom"
          className="h-6 w-[68px] border border-[#808080] bg-white px-1 text-[11px] shadow-[inset_1px_1px_#404040]"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(e.target.value)}
        >
          {["50%", "75%", "100%", "150%", "200%"].map((level) => (
            <option key={level}>{level}</option>
          ))}
        </select>
      </div>

      {/*
        Ruler.

        Word 95 always showed one under the toolbars: a white measure the width
        of the text column, grey where the margins are, numbered every inch with
        a tick at each eighth, and the indent markers at either end. The old one
        was eighty undifferentiated ticks two pixels apart, which measured
        nothing and matched no page width.
      */}
      <div data-ruler className="flex justify-center overflow-hidden bg-[#c0c0c0] px-2 py-1">
        <div
          className="relative h-[18px] shrink-0 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white"
          style={{ width: PAGE_WIDTH }}
        >
          {/* Margins, shown as the grey ends of the measure. */}
          <div className="absolute inset-y-0 left-0 bg-[#c0c0c0]" style={{ width: PAGE_MARGIN }} />
          <div className="absolute inset-y-0 right-0 bg-[#c0c0c0]" style={{ width: PAGE_MARGIN }} />

          {/* An inch is 96 CSS pixels, so the numbering lines up with the page. */}
          {Array.from({ length: Math.floor(PAGE_WIDTH / 12) }).map((_, i) => {
            const x = i * 12
            const inch = x % 96 === 0
            const half = x % 48 === 0
            return (
              <div
                key={i}
                className="absolute bg-[#404040]"
                style={{
                  left: x,
                  top: inch ? 4 : half ? 6 : 8,
                  width: 1,
                  height: inch ? 10 : half ? 6 : 3,
                }}
              />
            )
          })}
          {Array.from({ length: Math.floor(PAGE_WIDTH / 96) }).map((_, i) => (
            <span
              key={`n${i}`}
              className="absolute select-none text-[9px] leading-none text-[#404040]"
              style={{ left: i * 96 + 2, top: 3 }}
            >
              {i === 0 ? "" : i}
            </span>
          ))}

          {/* Indent markers: first line above, left and right below. */}
          <div
            className="absolute h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#404040]"
            style={{ left: PAGE_MARGIN - 5, top: 0 }}
          />
          <div
            className="absolute h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-[#404040]"
            style={{ left: PAGE_MARGIN - 5, bottom: 0 }}
          />
          <div
            className="absolute h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-[#404040]"
            style={{ right: PAGE_MARGIN - 5, bottom: 0 }}
          />
        </div>
      </div>

      {/*
        The document sat flush against the window, which is the one thing that
        never looked like Word. A page is a white sheet with an edge, sitting on
        the grey workspace, and the zoom scales the sheet rather than the window.
      */}
      <div data-workspace className="flex-1 overflow-auto bg-[#808080] p-4">
      <div
        ref={resumeRef}
        data-page
        className="document mx-auto bg-white shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
        onKeyUp={updateCaret}
        onClick={updateCaret}
        style={{
          width: PAGE_WIDTH,
          padding: PAGE_PADDING,
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

        <div className="mx-auto">
          <h1 className="text-center text-xl font-bold mb-1" contentEditable suppressContentEditableWarning>
            Joel Vasquez
          </h1>
          <p className="text-center mb-4" contentEditable suppressContentEditableWarning>
            New York, NY | jfvasq1@gmail.com |{" "}
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
              href="https://builtbyjoel.dev"
              className="text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              builtbyjoel.dev
            </a>
          </p>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              EDUCATION
            </h2>
            <div contentEditable suppressContentEditableWarning>
              <p className="flex justify-between">
                <strong>Baruch College, Weissman School of Arts and Sciences</strong>
                <span>New York, NY</span>
              </p>
              <p className="flex justify-between">
                <em>Bachelor of Science in Computer Science, Minor in Mathematics</em>
                <span>Expected May 2027</span>
              </p>
              {/* Two lines, kept there by the page width rather than by
                  trimming the list. */}
              <p>
                <strong>Relevant Coursework:</strong> Data Structures & Algorithms, Cloud Computing, Database Management,
                Computer Networking, Data Warehousing, Systems Analysis & Design, Object-Oriented Programming, Computer Architecture, Web Development
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              TECHNICAL SKILLS
            </h2>
            <div contentEditable suppressContentEditableWarning>
              <p>
                <strong>Programming Languages:</strong> Python, Go, C++, TypeScript, JavaScript, SQL, R, Bash
              </p>
              <p>
                <strong>Frameworks/Libraries/Databases:</strong> Node.js, FastAPI, Fastify, Flask, PostgreSQL, Redis,
                Prisma, MySQL, LangChain
              </p>
              <p>
                <strong>Cloud & DevOps:</strong> AWS, Azure, GCP, Kubernetes, Docker, Datadog, Linux, Jenkins
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
                  <strong>Software Engineer Intern</strong>
                </p>
                <p>June 2026 - Present</p>
              </div>
              <div className="flex justify-between">
                <p>
                  <em>Liberty Mutual Insurance</em>
                </p>
                <p>Portsmouth, NH</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Identified <strong>$53.3K</strong> in annual infrastructure savings by building a deterministic{" "}
                  <strong>Kubernetes</strong> right-sizing engine that analyzes p95/p99 CPU and memory telemetry across{" "}
                  <strong>50</strong> workloads and generates reviewable YAML patches.
                </li>
                <li>
                  Automated disaster recovery replication across <strong>877</strong> VMs, cutting configuration time{" "}
                  <strong>95%</strong> from <strong>37 hours</strong> to <strong>2 hours</strong> and eliminating
                  hundreds of manual operations.
                </li>
                <li>
                  Reduced <strong>Azure Local</strong> backup failure detection time by <strong>40%</strong> by
                  building <strong>Datadog</strong> monitors and automated alerting workflows, enabling faster incident
                  response.
                </li>
              </ul>
            </div>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Agentic AI Developer</strong>
                </p>
                <p>November 2025 - May 2026</p>
              </div>
              <div className="flex justify-between">
                <p>
                  <em>Robert Wood Johnson Foundation</em>
                </p>
                <p>New York, NY</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Recovered <strong>10 hours</strong> of analysis time per week for a <strong>15-person</strong>{" "}
                  investment team by designing and deploying <strong>8 AI agents</strong> that automate financial
                  statement analysis, memo drafting, and risk flag generation.
                </li>
                <li>
                  Eliminated manual reformatting of model output by engineering multi-step agent pipelines combining
                  LLM reasoning, financial data retrieval, and structured-output validation across a{" "}
                  <strong>$13B</strong> investment portfolio.
                </li>
                <li>
                  Developed <strong>retrieval-augmented generation (RAG)</strong> pipelines to search and synthesize
                  over <strong>85,000</strong> internal investment documents across SharePoint and Bipsync into
                  structured investment summaries for portfolio analysis.
                </li>
              </ul>
            </div>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Data Scientist</strong>
                </p>
                <p>November 2023 - October 2025</p>
              </div>
              <div className="flex justify-between">
                <p>
                  <em>CUNY Institute for Demographic Research</em>
                </p>
                <p>New York, NY</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Built and maintained Python and R data pipelines supporting urban growth models, informing policy and
                  planning decisions across <strong>145</strong> countries representing <strong>80%</strong> of the
                  world's population.
                </li>
                <li>
                  Reduced manual data entry time by <strong>75%</strong> and improved data quality for research teams by
                  developing R and Python scripts that automate data cleaning and demographic extraction across{" "}
                  <strong>1,000+</strong> files.
                </li>
                <li>
                  Generated geospatial population heat maps for <strong>2,300+</strong> districts spanning{" "}
                  <strong>50</strong> years, enabling subnational analysis of long-term population growth patterns.
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              PROJECTS
            </h2>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Booklet — Read-It-Later API & Sync Platform</strong> |{" "}
                  <em>TypeScript, Node.js, PostgreSQL, ONNX</em>
                </p>
                <a
                  href="https://github.com/jguapp"
                  className="text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Architected a <strong>Fastify/PostgreSQL</strong> backend with <strong>82 REST endpoints</strong> and a
                  20-table Prisma schema, supporting web, mobile, and browser-extension clients through a unified{" "}
                  <strong>API</strong>.
                </li>
                <li>
                  Increased concurrent inference throughput <strong>2.86x</strong> by implementing two-tier
                  in-memory/Redis caching with in-flight request deduplication for a server-side ML inference pipeline.
                </li>
                <li>
                  Cut inference cold-start time <strong>25%</strong> to <strong>8.9s</strong> and concurrent-request
                  latency <strong>21%</strong> to <strong>14.8s</strong> by eliminating ONNX thread-pool oversubscription
                  in a multi-process service running on 2 vCPUs.
                </li>
              </ul>
            </div>

            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>Calligraphy — Distributed Task Queue System</strong> | <em>Go, Redis, gRPC, Docker</em>
                </p>
                <a
                  href="https://github.com/jguapp"
                  className="text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Processed <strong>10,000+</strong> jobs through a distributed <strong>Go</strong> worker pool using
                  goroutines, channels, and Redis-backed queues while maintaining <strong>99.04%+</strong> job completion
                  reliability under load.
                </li>
                <li>
                  Improved job throughput <strong>60%</strong> by implementing dynamic worker scaling, connection
                  pooling, and concurrent job scheduling across <strong>7</strong> containerized worker instances.
                </li>
                <li>
                  Sustained zero job loss across <strong>15</strong> forced worker crashes by implementing persistent
                  job state, exponential-backoff retries, dead-letter queues, and lease-based crash recovery.
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold border-b border-black mb-1" contentEditable suppressContentEditableWarning>
              LEADERSHIP & PROFESSIONAL DEVELOPMENT
            </h2>
            <div className="mb-3" contentEditable suppressContentEditableWarning>
              <div className="flex justify-between">
                <p>
                  <strong>ColorStack Baruch Chapter</strong> | <em>Operations Director</em>
                </p>
                <p>January 2024 - Present</p>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  Expanded ColorStack Baruch Chapter from <strong>4</strong> founding members to over{" "}
                  <strong>300</strong> active participants by expanding technical programming, community events, and
                  professional development.
                </li>
                <li>
                  Organized <strong>10+</strong> hands-on coding workshops for <strong>70</strong> participants covering
                  web development, cloud computing, and database management, with <strong>80%</strong> reporting improved
                  job readiness.
                </li>
                <li>
                  Fostered partnerships with <strong>5+</strong> tech companies, including <strong>Bloomberg</strong> and{" "}
                  <strong>Datadog</strong>, creating opportunities for office visits, networking, and technical interview
                  preparation.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/*
        Status bar. Word 95 reported the page, section, page count, the caret's
        distance down the page and its line and column, with the five mode
        indicators greyed until they were switched on. This window had none.
      */}
      <div
        data-status
        className="flex items-center gap-0 border-t border-white bg-[#c0c0c0] px-1 py-[2px] text-[11px]"
      >
        {["Page 1", "Sec 1", "1/1"].map((cell) => (
          <span key={cell} className="border-r border-r-[#808080] px-2">
            {cell}
          </span>
        ))}
        <span className="border-r border-r-[#808080] px-2">At {(1 + (caret.line - 1) * 0.17).toFixed(1)}&quot;</span>
        <span className="border-r border-r-[#808080] px-2">Ln {caret.line}</span>
        <span className="border-r border-r-[#808080] px-2">Col {caret.col}</span>
        <span className="flex-1" />
        {["REC", "TRK", "EXT", "OVR", "WPH"].map((mode) => (
          <span key={mode} className="px-2 text-[#808080]">
            {mode}
          </span>
        ))}
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
