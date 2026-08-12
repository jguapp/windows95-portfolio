"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { empty, getItems, restore, subscribe } from "@/lib/recycle-bin"

/**
 * The Recycle Bin window.
 *
 * Lists what has been deleted with its original location and deletion date.
 * File > Restore puts an item back where it came from; File > Empty Recycle
 * Bin clears it behind the authentic confirmation.
 */
export default function RecycleBin() {
  const items = useSyncExternalStore(subscribe, getItems, getItems)
  const [selected, setSelected] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Drop a stale selection once the item it referred to is gone.
  useEffect(() => {
    if (selected && !items.some((r) => r.item.id === selected)) setSelected(null)
  }, [items, selected])

  const restoreSelected = () => {
    if (!selected) return
    const back = restore(selected)
    if (back) {
      window.dispatchEvent(new CustomEvent("recycleRestore", { detail: back }))
    }
    setSelected(null)
  }

  const menus: Record<string, { label: string; action: () => void; disabled?: boolean }[]> = {
    File: [
      { label: "Restore", action: restoreSelected, disabled: !selected },
      { label: "Empty Recycle Bin", action: () => setConfirming(true), disabled: items.length === 0 },
      {
        label: "Close",
        action: () => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "recycle-bin" } })),
      },
    ],
    Edit: [{ label: "Select All", action: () => setSelected(items[0]?.item.id ?? null), disabled: !items.length }],
    Help: [{ label: "About Recycle Bin", action: () => alert("Recycle Bin\n\nWindows 95 recreation.") }],
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#c0c0c0]" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      <div className="flex border-b border-[#808080] px-1" onMouseLeave={() => setOpenMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] text-xs ${openMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenMenu(openMenu === name ? null : name)}
              onMouseEnter={() => openMenu && setOpenMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[190px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    className="block w-full px-4 py-[2px] text-left text-xs enabled:hover:bg-[#000080] enabled:hover:text-white disabled:text-[#808080]"
                    onClick={() => {
                      item.action()
                      setOpenMenu(null)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div data-contents className="flex-1 overflow-auto bg-white">
        {items.length === 0 ? (
          <p className="p-3 text-xs text-black">This folder is empty.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Name", "Original Location", "Date Deleted"].map((h) => (
                  <th
                    key={h}
                    className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-1 py-[1px] text-left font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.item.id}
                  onClick={() => setSelected(r.item.id)}
                  onDoubleClick={restoreSelected}
                  className={selected === r.item.id ? "bg-[#000080] text-white" : "text-black"}
                >
                  <td className="px-1">
                    <span className="flex items-center gap-1">
                      <img src={r.item.icon} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
                      {r.item.label}
                    </span>
                  </td>
                  <td className="px-1">{r.originalLocation}</td>
                  <td className="px-1">{r.deletedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[2px] text-xs">
        <span data-status>{items.length} object(s)</span>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="w-[320px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]">
            <div className="bg-[#000080] px-2 py-[3px] text-xs font-bold text-white">Confirm Multiple File Delete</div>
            <div className="p-4">
              <p className="mb-4 text-xs">
                Are you sure you want to delete these {items.length} item(s)?
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    empty()
                    setConfirming(false)
                  }}
                  className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040]"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs active:border-t-[#404040] active:border-l-[#404040]"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
