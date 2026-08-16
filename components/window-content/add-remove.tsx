"use client"

import { useState } from "react"
import { messageBox } from "@/components/win95-dialog"

/**
 * Add/Remove Programs.
 *
 * The Control Panel applet, with this desktop's own features standing in
 * for installed software: a list, a size, and an Add/Remove button that
 * declines, politely, the way a system component always did.
 */

interface Installed {
  name: string
  /** Kilobytes, invented to look like 1995 and labelled as such below. */
  size: number
  note: string
  /** True for the parts nothing should be able to uninstall. */
  system?: boolean
}

const INSTALLED: Installed[] = [
  { name: "Windows 95 Desktop", size: 14336, note: "Windows, icons, the taskbar and the Start menu.", system: true },
  { name: "Microsoft Word 95", size: 8704, note: "The resume, printable and saveable." },
  { name: "Microsoft Paint", size: 1216, note: "Twenty-eight colours and a magnifier that does not lie." },
  { name: "Notepad", size: 48, note: "Text files on the C: drive." },
  { name: "MS-DOS Prompt", size: 512, note: "DIR, TYPE, TREE and one text adventure." },
  { name: "Windows Explorer", size: 2048, note: "The C: drive, four views, and a Properties sheet." },
  { name: "Internet Explorer", size: 6144, note: "The built-in pages of 1996." },
  { name: "Outlook Express", size: 5120, note: "Fifty-nine messages, spam included." },
  { name: "Microsoft Games", size: 3584, note: "Eight of them, with their menus and cheats." },
  { name: "Winamp 2.9", size: 2560, note: "It really whips the llama's behind." },
  { name: "Office Assistant", size: 768, note: "Clippit. Draggable. Dismissible." },
  { name: "Sound Scheme", size: 384, note: "Synthesised, no audio files shipped.", system: true },
]

export default function AddRemove() {
  const [selected, setSelected] = useState<string | null>(null)
  const chosen = INSTALLED.find((p) => p.name === selected) ?? null

  const attempt = () => {
    if (!chosen) return
    messageBox({
      title: "Add/Remove Programs",
      text: chosen.system
        ? `${chosen.name} is a required system component and cannot be removed.`
        : `Setup cannot remove ${chosen.name}.\n\nThis program is part of the site you are looking at. Removing it would remove the thing you came to see.`,
      icon: chosen.system ? "error" : "information",
    })
  }

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-3 text-xs"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-add-remove
    >
      <p className="mb-2 leading-[1.5]">
        To install a new program from a floppy disk or CD-ROM drive, click Install. To remove a program, select it from
        the list and click Add/Remove.
      </p>

      <div className="mb-2 flex-1 overflow-auto border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
        <table className="w-full">
          <tbody>
            {INSTALLED.map((program) => {
              const active = selected === program.name
              return (
                <tr
                  key={program.name}
                  data-program={program.name}
                  onClick={() => setSelected(program.name)}
                  onDoubleClick={attempt}
                  className={`cursor-default ${active ? "bg-[#000080] text-white" : ""}`}
                >
                  <td className="px-2 py-[2px]">{program.name}</td>
                  <td className="px-2 py-[2px] text-right">{program.size.toLocaleString()} KB</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-2 min-h-[32px] border border-[#808080] bg-[#c0c0c0] p-1" data-program-note>
        {chosen ? chosen.note : "Select a program to see what it is."}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          data-install
          onClick={() =>
            messageBox({
              title: "Install Program From Floppy Disk or CD-ROM",
              text: "Setup could not find a floppy disk or CD-ROM drive.\n\nIt is 2026. Nobody has one.",
              icon: "error",
            })
          }
          className="h-[23px] min-w-[85px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
        >
          Install...
        </button>
        <button
          type="button"
          data-add-remove-btn
          disabled={!chosen}
          onClick={attempt}
          className="h-[23px] min-w-[85px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
        >
          Add/Remove...
        </button>
      </div>
    </div>
  )
}
