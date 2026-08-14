"use client"

import { useEffect, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"
import type { DesktopItemData } from "@/components/desktop"

/**
 * The property sheet for a desktop item.
 *
 * Right-clicking anything in Windows 95 and choosing Properties opened a tabbed
 * sheet, and it is one of the first things people try on a desktop that claims
 * to be one. Shortcuts got two tabs: General, with the type, location, size and
 * dates, and Shortcut, with the target and how it starts.
 *
 * The values come from the item and from a size derived from its name, so the
 * same icon always reports the same size rather than a number that changes
 * every time you look at it.
 */
interface ItemPropertiesProps {
  item: DesktopItemData
  onClose: () => void
}

const TYPE_LABEL: Record<DesktopItemData["type"], string> = {
  application: "Application",
  folder: "File Folder",
  shortcut: "Shortcut",
  "text-document": "Text Document",
}

/**
 * A stable byte size for an item.
 *
 * Windows reported a real size. There is no file here, so this hashes the name
 * into a plausible one: the point is that it does not change between openings.
 */
function sizeOf(item: DesktopItemData): number {
  let h = 0
  for (let i = 0; i < item.id.length; i++) h = (h * 31 + item.id.charCodeAt(i)) >>> 0
  if (item.type === "shortcut") return 300 + (h % 400)
  if (item.type === "text-document") return 1024 + (h % 8192)
  if (item.type === "folder") return 0
  return 32768 + (h % 900000)
}

const bytes = (n: number) =>
  `${n.toLocaleString()} bytes` + (n >= 1024 ? ` (${(n / 1024).toFixed(1)}KB)` : "")

/** Where an item would live if this were a disk. */
function locationOf(item: DesktopItemData): string {
  if (item.type === "application") return "C:\\Program Files"
  if (item.type === "folder") return "C:\\WINDOWS\\Desktop"
  return "C:\\WINDOWS\\Desktop"
}

export default function ItemProperties({ item, onClose }: ItemPropertiesProps) {
  const [tab, setTab] = useState<"general" | "shortcut">("general")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const size = sizeOf(item)
  const created = "Thursday, August 24, 1995 12:00:00 PM"
  const modified = "Monday, August 13, 2026 9:14:22 PM"
  const hasShortcutTab = item.type === "shortcut" || item.type === "application"

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex py-[3px]">
      <span className="w-[92px] shrink-0 text-[#404040]">{label}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30">
      <div
        data-item-properties
        className="win95-type w-[340px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_8px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
          <span className="px-1 font-bold">{item.label} Properties</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-[16px] w-[16px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-2 pt-2">
          {(["general", ...(hasShortcutTab ? (["shortcut"] as const) : [])] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-tab={t}
              onClick={() => setTab(t)}
              className={`border-2 border-b-0 border-t-white border-l-white border-r-[#404040] px-4 py-[2px] ${
                tab === t ? "relative z-10 bg-[#c0c0c0] font-bold" : "bg-[#b0b0b0]"
              }`}
            >
              {t === "general" ? "General" : "Shortcut"}
            </button>
          ))}
        </div>

        <div className="mx-2 mb-2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-3">
          {tab === "general" ? (
            <div data-pane="general">
              <div className="flex items-center gap-3 border-b border-b-[#808080] pb-2">
                <img
                  src={item.icon}
                  alt=""
                  className="h-8 w-8"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="font-bold">{item.label}</span>
              </div>

              <div className="border-b border-b-[#808080] py-2">
                <Row label="Type:">{TYPE_LABEL[item.type]}</Row>
                <Row label="Location:">{locationOf(item)}</Row>
                <Row label="Size:">{item.type === "folder" ? "0 bytes" : bytes(size)}</Row>
              </div>

              <div className="border-b border-b-[#808080] py-2">
                <Row label="MS-DOS name:">{`${item.id.slice(0, 8).toUpperCase().replace(/-/g, "")}.LNK`}</Row>
                <Row label="Created:">{created}</Row>
                <Row label="Modified:">{modified}</Row>
              </div>

              <div className="py-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" defaultChecked={false} /> Read-only
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" defaultChecked={false} /> Hidden
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" defaultChecked /> Archive
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div data-pane="shortcut">
              <div className="flex items-center gap-3 border-b border-b-[#808080] pb-2">
                <img
                  src={item.icon}
                  alt=""
                  className="h-8 w-8"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="font-bold">{item.label}</span>
              </div>

              <div className="py-2">
                <Row label="Target type:">{TYPE_LABEL[item.type]}</Row>
                <Row label="Target:">{`${locationOf(item)}\\${item.id}.exe`}</Row>
                <Row label="Start in:">{locationOf(item)}</Row>
                <Row label="Shortcut key:">None</Row>
                <Row label="Run:">Normal window</Row>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
