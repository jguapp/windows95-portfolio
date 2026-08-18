/**
 * The wallpaper set, shared by Display Properties and the desktop's restore
 * path, which once carried its own copy of the list and drifted.
 *
 * These are the patterns Windows 95 shipped in the box, drawn as imitations
 * by scripted geometry rather than copied from Microsoft's bitmaps, in
 * keeping with the rest of the desk. Every one of them tiles; that is what
 * wallpaper did in 1995.
 */
export interface Wallpaper {
  id: string
  name: string
  url: string
}

/**
 * The session's wallpaper, held in memory on purpose.
 *
 * Wallpaper is a mood, not a setting: a visitor redecorating the desk gets
 * their choice for as long as the window lives, and a refresh hands the
 * next arrival the teal default, the way a shared machine in 1995 greeted
 * everyone with the same desktop. Nothing here touches localStorage, which
 * is exactly why a refresh reverts it.
 */
export const CUSTOM_WALLPAPER_ID = "custom-upload"

let sessionWallpaperId: string | null = null
let sessionCustomBitmap: string | null = null

/** The wallpaper chosen this session, or null for the default. */
export function getSessionWallpaperId(): string | null {
  return sessionWallpaperId
}

export function setSessionWallpaperId(id: string) {
  sessionWallpaperId = id
}

/** A bitmap the visitor supplied this session, as a data URL. */
export function setCustomWallpaper(dataUrl: string) {
  sessionCustomBitmap = dataUrl
}

export function readCustomWallpaper(): string | null {
  return sessionCustomBitmap
}

/** Resolves any wallpaper id to a URL, custom uploads included. */
export function wallpaperUrl(id: string): string | null {
  if (id === CUSTOM_WALLPAPER_ID) return readCustomWallpaper()
  return WALLPAPERS.find((w) => w.id === id)?.url ?? null
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "windows-default", name: "Windows Default", url: "/images/wallpapers/teal.png" },
  { id: "black-thatch", name: "Black Thatch", url: "/images/wallpapers/black-thatch.png" },
  { id: "blue-rivets", name: "Blue Rivets", url: "/images/wallpapers/blue-rivets.png" },
  { id: "bubbles", name: "Bubbles", url: "/images/wallpapers/bubbles.png" },
  { id: "carved-stone", name: "Carved Stone", url: "/images/wallpapers/carved-stone.png" },
  { id: "clouds", name: "Clouds", url: "/images/wallpapers/clouds.png" },
  { id: "egypt", name: "Egypt", url: "/images/wallpapers/egypt.png" },
  { id: "houndstooth", name: "Houndstooth", url: "/images/wallpapers/houndstooth.png" },
  { id: "metal-links", name: "Metal Links", url: "/images/wallpapers/metal-links.png" },
  { id: "pinstripe", name: "Pinstripe", url: "/images/wallpapers/pinstripe.png" },
  { id: "red-blocks", name: "Red Blocks", url: "/images/wallpapers/red-blocks.png" },
  { id: "sandstone", name: "Sandstone", url: "/images/wallpapers/sandstone.png" },
  { id: "straw-mat", name: "Straw Mat", url: "/images/wallpapers/straw-mat.png" },
  { id: "tiles", name: "Tiles", url: "/images/wallpapers/tiles.png" },
  { id: "triangles", name: "Triangles", url: "/images/wallpapers/triangles.png" },
  { id: "waves", name: "Waves", url: "/images/wallpapers/waves.png" },
]
