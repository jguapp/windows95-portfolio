/**
 * Window titles, shared by the title bar and the taskbar.
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
  projects: "My Projects",
  resume: "Resume - Microsoft Word",
}

/** Short form for the taskbar button, which has far less room. */
const TASKBAR_TITLES: Record<string, string> = {
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
