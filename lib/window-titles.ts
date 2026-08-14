/**
 * Window titles and icons, shared by the title bar and the taskbar.
 *
 * Both used to derive a label from the id independently, which is why the
 * MS-DOS Prompt showed as "MS-DOS Prompt" in its title bar and "Msdos" on the
 * taskbar. Anything not listed falls back to title-casing the hyphenated id.
 */
const TITLES: Record<string, string> = {
  msdos: "MS-DOS Prompt",
  explorer: "Exploring - C:\\",
  "recycle-bin": "Recycle Bin",
  notepad: "Readme.txt - Notepad",
  calculator: "Calculator",
  spotify: "Windows Media Player",
  "about-me": "About Me",
  guestbook: "Guestbook",
  projects: "My Projects",
  resume: "Resume - Microsoft Word",
  contact: "Inbox - Outlook Express",
  "patch-notes": "Release Notes",
}

/** Short form for the taskbar button, which has far less room. */
const TASKBAR_TITLES: Record<string, string> = {
  contact: "Inbox",
  notepad: "Readme.txt - Notepad",
  resume: "Resume",
  explorer: "Exploring - C:",
}

export function windowTitle(id: string): string {
  if (TITLES[id]) return TITLES[id]
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function taskbarTitle(id: string): string {
  return TASKBAR_TITLES[id] ?? windowTitle(id)
}

/**
 * The 16x16 icon a window identifies itself with.
 *
 * Windows 95 put this at the left of every title bar as well as on the taskbar
 * button. It lived only in the taskbar here, so the title bars had no icon at
 * all; keeping it beside the titles means the two cannot drift apart the way
 * the titles once did.
 */
const ICONS: Record<string, string> = {
  "about-me": "/images/win95/about-me-16.png",
  resume: "/images/win95/resume-16.png",
  projects: "/images/win95/projects-16.png",
  contact: "/images/win95/contact-16.png",
  gallery: "/images/win95/gallery-16.png",
  games: "/images/win95/games-16.png",
  paint: "/images/win95/paint-16.png",
  calculator: "/images/win95/calculator-16.png",
  notepad: "/images/win95/notepad-16.png",
  msdos: "/images/win95/msdos-16.png",
  explorer: "/images/win95/explorer-16.png",
  "recycle-bin": "/images/win95/recycle-empty-16.png",
  guestbook: "/images/win95/guestbook-16.png",
}

export function windowIcon(id: string): string | undefined {
  return ICONS[id]
}
