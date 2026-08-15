"use client"

import { windowIcon, windowTitle } from "@/lib/window-titles"

/**
 * The Alt+Tab strip, on Alt+Q.
 *
 * Alt+Tab itself belongs to the host operating system, the same lesson
 * Windows+R taught: the browser never sees it. Alt+Q is free everywhere, so
 * holding Alt and tapping Q steps through the open windows while this strip
 * shows where you are; releasing Alt commits, Escape cancels.
 *
 * Purely presentational: page.tsx owns the key handling and the selection.
 */
interface WindowSwitcherProps {
  windows: string[]
  selected: number
}

export default function WindowSwitcher({ windows, selected }: WindowSwitcherProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" data-window-switcher>
      <div
        className="win95-type border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] p-3"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex gap-1">
          {windows.map((id, i) => (
            <div
              key={id}
              data-switcher-item={id}
              data-switcher-selected={i === selected ? "" : undefined}
              className={`flex h-12 w-12 items-center justify-center ${
                i === selected ? "border border-[#000080] bg-white" : "border border-transparent"
              }`}
            >
              <img
                src={windowIcon(id) ?? "/images/win95/file-16.png"}
                alt=""
                className="h-8 w-8 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ))}
        </div>
        <div
          className="mt-2 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-2 py-[2px] text-center"
          data-switcher-title
        >
          {windowTitle(windows[selected] ?? "")}
        </div>
      </div>
    </div>
  )
}
