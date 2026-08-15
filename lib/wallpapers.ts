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
