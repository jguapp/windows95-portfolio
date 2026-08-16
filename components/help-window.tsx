"use client"

import { CloseIcon } from "@/components/win95-controls"
import { windowTitle } from "@/lib/window-titles"

/**
 * Windows Help, on F1.
 *
 * One dialog, dressed like the WinHelp viewer: yellow topic pane, a bold
 * heading, plain prose. The topic follows whichever window was active when
 * F1 was pressed; a desktop with nothing focused gets the general topic.
 */

interface HelpWindowProps {
  /** The active window's id, or null for the desktop itself. */
  forWindow: string | null
  onClose: () => void
}

const TOPICS: Record<string, string[]> = {
  desktop: [
    "Double-click an icon to open it. Drag icons anywhere; the desktop remembers what you create.",
    "Right-click the desktop for wallpaper, arranging, and new files. Right-click the taskbar for its own menu.",
    "Tab and the arrow keys walk the icons. Alt+Q switches windows. Ctrl+Alt+R opens Run.",
  ],
  notepad: [
    "Notepad edits the text files on the C: drive. File > Save writes back to the same tree Explorer and MS-DOS read.",
    "Turn on Remember my files on the welcome screen and saved files survive a reload.",
  ],
  paint: [
    "The toolbox works like 1995: pencil, brush, fill, eraser, shapes, and the colour box along the bottom.",
    "File > Save keeps the drawing on the C: drive. The guestbook can attach one.",
  ],
  "ms-dos": [
    "DIR, CD, TYPE and TREE read the same C: drive Explorer shows. HELP lists everything the prompt knows.",
    "ADVENTURE is in there. Bring coffee.",
  ],
  explorer: [
    "The tree on the left, the folder on the right, four views in the View menu.",
    "Double-clicking a document opens it in its program and files it under Start > Documents.",
  ],
  games: [
    "Eight games, each with its menus: difficulty, decks, statistics, sound. F2 deals a new game in most of them.",
    "Minesweeper still answers to xyzzy, and Solitaire still folds to Alt+Shift+2.",
  ],
  "internet-explorer": [
    "The built-in sites are the only sites; 1996 had fewer pages than you remember.",
    "The address bar accepts the names it shows you. Outside addresses cannot be framed.",
  ],
  contact: ["Fill in the form and Send does the rest. The honeypot field wants to stay empty, and so should you leave it."],
}

const GENERAL = [
  "This is a Windows 95 desktop rebuilt in the browser: the windows drag, the games play, the C: drive persists if you ask it to.",
  "Every program carries its own menus; most questions are answered by opening them.",
]

export default function HelpWindow({ forWindow, onClose }: HelpWindowProps) {
  const topic = (forWindow && TOPICS[forWindow]) || TOPICS[forWindow ?? "desktop"] || GENERAL
  const title = forWindow ? windowTitle(forWindow) : "Windows"

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center" onClick={onClose}>
      <div
        data-help-window
        role="dialog"
        aria-label="Windows Help"
        className="w-[420px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[4px_4px_10px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#000080] px-2 py-[3px]">
          <span className="text-xs font-bold text-white">Windows Help</span>
          <button
            type="button"
            aria-label="Close Help"
            onClick={onClose}
            className="flex h-4 w-4 items-center justify-center bg-[#c0c0c0] text-black shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#dfdfdf]"
          >
            <CloseIcon />
          </button>
        </div>
        {/* The WinHelp topic pane: yellow, serif-free, patient. */}
        <div className="m-2 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#ffffcc] p-3">
          <div className="mb-2 text-sm font-bold">{title}</div>
          {topic.map((line) => (
            <p key={line.slice(0, 24)} className="mb-2 text-xs leading-[1.5]">
              {line}
            </p>
          ))}
        </div>
        <div className="flex justify-end px-2 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
