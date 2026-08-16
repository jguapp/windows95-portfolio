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
  "find-files": "Find: Files or Folders",
  "sound-properties": "Sounds Properties",
  "add-remove": "Add/Remove Programs",
  "internet-explorer": "Joel's Home Page - Microsoft Internet Explorer",
  wordpad: "Document - WordPad",
  charmap: "Character Map",
  mediaplayer: "Media Player",
  soundrec: "Sound - Sound Recorder",
  cdplayer: "CD Player",
  phonedialer: "Phone Dialer",
  hyperterm: "HyperTerminal",
  scandisk: "ScanDisk - (C:)",
  defrag: "Disk Defragmenter",
}

/** Short form for the taskbar button, which has far less room. */
const TASKBAR_TITLES: Record<string, string> = {
  "internet-explorer": "Internet Explorer",
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
  "internet-explorer": "/images/win95/ie-16.png",
  "patch-notes": "/images/win95/notepad-16.png",
  "find-files": "/images/find-icon.png",
  "sound-properties": "/images/blob/sound.png",
  "add-remove": "/images/blob/controls-folder.ico",
  wordpad: "/images/win95/wordpad-32.png",
  charmap: "/images/win95/charmap-16.png",
  mediaplayer: "/images/win95/mediaplayer-32.png",
  soundrec: "/images/win95/soundrec-32.png",
  cdplayer: "/images/win95/cdplayer-32.png",
  phonedialer: "/images/win95/phone-32.png",
  hyperterm: "/images/win95/hyperterm-32.png",
  scandisk: "/images/win95/scandisk-32.png",
  defrag: "/images/win95/defrag-32.png",
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
