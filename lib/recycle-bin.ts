/**
 * Recycle Bin store.
 *
 * Deleted desktop icons live here rather than being destroyed, keeping enough
 * about each one to put it back exactly where it came from. Shared through a
 * tiny subscribe/notify store so the desktop icon, the Recycle Bin window and
 * the context menu all see the same contents without prop-drilling through
 * three components.
 */

import type { DesktopItemData, IconPosition } from "@/components/desktop"

export interface RecycledItem {
  item: DesktopItemData
  /** Where it sat on the desktop, so Restore returns it to the same spot. */
  position: { x: number; y: number } | undefined
  originalLocation: string
  deletedAt: string
}

let items: RecycledItem[] = []
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getItems(): RecycledItem[] {
  return items
}

export function isEmpty(): boolean {
  return items.length === 0
}

export function recycle(item: DesktopItemData, positions: IconPosition) {
  const now = new Date()
  items = [
    ...items,
    {
      item,
      position: positions[item.id],
      originalLocation: "Desktop",
      deletedAt: `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
    },
  ]
  notify()
}

/** Take an item back out, for the caller to put on the desktop again. */
export function restore(id: string): RecycledItem | undefined {
  const found = items.find((r) => r.item.id === id)
  if (!found) return undefined
  items = items.filter((r) => r.item.id !== id)
  notify()
  return found
}

export function empty() {
  items = []
  notify()
}
