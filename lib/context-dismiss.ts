"use client"

/**
 * Lets a right-click dismiss a context menu instead of moving it.
 *
 * Every menu here closes on any mousedown outside itself, and a right-click
 * is a mousedown too, so the menu duly closed. But the browser fires
 * contextmenu immediately after that mousedown, the opener saw no menu
 * showing, and reopened it at the pointer: to the visitor the menu refused
 * to go away. The two events cannot see each other through React state,
 * because the close and the reopen happen in the same gesture.
 *
 * So the dismissal leaves a mark. A closer that shut a menu because of a
 * right button records the moment; an opener consults it and lets that one
 * gesture stay a dismissal. The window is a few hundred milliseconds, which
 * is longer than any mousedown-to-contextmenu gap and far shorter than a
 * deliberate second right-click.
 */

let closedAt = 0

/** Called by a closer when a right-button mousedown shut a menu. */
export function markRightDismiss() {
  closedAt = Date.now()
}

/** True while the contextmenu event of that same gesture is still arriving. */
export function wasRightDismiss(): boolean {
  return Date.now() - closedAt < 250
}
