"use client"

/**
 * The Appearance schemes, shared by Display Properties and the desktop's
 * boot restore, which once carried its own copy of the table.
 *
 * Each scheme names three colors: the desktop behind everything, the face
 * every silver control wears, and the titlebar shade that also paints
 * selection, the way the stock Windows 95 schemes tied those two together.
 * The values are plausible readings of the era's schemes, not extractions
 * from the originals; Windows Standard is exact.
 */
export interface ColorScheme {
  id: string
  name: string
  /** The desktop paint used when no wallpaper is set. */
  desktop: string
  /** The 3D face color: windows, taskbar, menus, dialogs. */
  face: string
  /** Active title bars and selection highlights. */
  titlebar: string
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: "windows-standard", name: "Windows Standard", desktop: "#008080", face: "#c0c0c0", titlebar: "#000080" },
  { id: "brick", name: "Brick", desktop: "#800000", face: "#c0c0c0", titlebar: "#800000" },
  { id: "desert", name: "Desert", desktop: "#d2b48c", face: "#d4c4a8", titlebar: "#008080" },
  { id: "eggplant", name: "Eggplant", desktop: "#604080", face: "#c0c0c0", titlebar: "#5a3a78" },
  { id: "lilac", name: "Lilac", desktop: "#c8a2c8", face: "#d8c8d8", titlebar: "#8060a0" },
  { id: "maple", name: "Maple", desktop: "#804000", face: "#c0c0c0", titlebar: "#804000" },
  { id: "rose", name: "Rose", desktop: "#ff80a0", face: "#ffc0d0", titlebar: "#c04060" },
  { id: "spruce", name: "Spruce", desktop: "#006040", face: "#c0c0c0", titlebar: "#006040" },
  { id: "wheat", name: "Wheat", desktop: "#f5deb3", face: "#f0e0c0", titlebar: "#808040" },
  { id: "wine", name: "Wine", desktop: "#800020", face: "#c0c0c0", titlebar: "#800020" },
]

/**
 * Applies a scheme to the shell by writing the CSS variables the chrome
 * reads (globals.css routes the silver and navy utility classes through
 * them). Returns the scheme so callers can paint the desktop themselves,
 * since only they know whether a wallpaper is covering it.
 */
export function applyScheme(id: string | null): ColorScheme {
  const scheme = COLOR_SCHEMES.find((s) => s.id === id) ?? COLOR_SCHEMES[0]
  const root = document.documentElement.style
  root.setProperty("--win95-desktop-color", scheme.desktop)
  root.setProperty("--win95-window-color", scheme.face)
  root.setProperty("--win95-highlight-color", scheme.titlebar)
  root.setProperty("--win95-text-color", "#000000")
  root.setProperty("--win95-highlight-text-color", "#ffffff")
  return scheme
}
