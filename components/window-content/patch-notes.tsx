"use client"

/**
 * Patch Notes: the whole history of this desktop, newest first.
 *
 * Curated from the git log rather than generated from it, because a changelog
 * a person is meant to read wants releases, not commits. Versions are
 * retrospective: the numbering was invented for this window, since nothing
 * was versioned at the time.
 */

interface Release {
  version: string
  date: string
  title: string
  notes: string[]
}

const RELEASES: Release[] = [
  {
    version: "2.0",
    date: "August 2026",
    title: "The big one",
    notes: [
      "The games grew from five to eight: FreeCell with the original deal numbering, Hearts and Reversi joined; Solitaire ends in the cascade, Minesweeper drew its LED counters, and high scores survive a refresh.",
      "Winamp, the real 2.9 skin engine, whipping the llama with a synthesised opening track, and an eject button that takes your own music.",
      "Clippit at the bottom right: contextual tips, forty-plus lines, dismissible for good, and he knows your visitor number.",
      "A real C: drive. Notepad, MS-DOS, Explorer and Find share one tree; Find searches names and file contents.",
      "Saving is your choice: check the box on the welcome dialog and files, drawings and desktop icons survive between visits.",
      "Display Properties applies for real: the wallpapers Windows 95 shipped, Appearance schemes that recolor the whole shell, five real screensavers, and resolutions from 640x480 up to 4K through a QuickRes tray menu.",
      "The Windows 95 sound scheme, synthesised, with a Sounds control panel that plays it.",
      "The resume in Word prints an actual document and saves as Word, PDF or HTML.",
      "Internet Explorer serves 1996 by way of the archive, and joel95.net counts your visit on a six-digit hit counter.",
      "A guestbook on Postgres, drawings included, behind rate limits and row level security.",
      "The hidden battle went full Gen I: six a side, a party screen with mini sprites, a real item bag, computed back sprites, and platforms measured from each fighter's feet.",
      "The keyboard drives the desktop: Tab, arrows and Enter on the icons, Alt+Q to switch windows.",
      "Run on Ctrl+Alt+R with the real executable names, Date/Time Properties on the clock, a Properties sheet on every icon.",
      "Mail became Outlook Express with 59 messages spanning two years, spam included.",
      "Shut Down ends on the amber screen; wrong URLs get a Windows 95 error page; the whole desktop works on a phone.",
      "Accessories from WordPad to Disk Defragmenter, wearing their authentic icons.",
    ],
  },
  {
    version: "1.0",
    date: "July 2025",
    title: "First boot",
    notes: [
      "A Windows 95 desktop in Next.js: a boot sequence, a welcome dialog, and a teal desktop of draggable icons.",
      "Windows that drag, resize from eight grips, minimise to the taskbar, and maximise, under a Start menu with cascading submenus.",
      "About Me as a 2005 profile page with wall posts and a music player.",
      "The resume inside Microsoft Word 95: two toolbars, a ruler, a status bar, an editable page.",
      "Projects as a 2005 video site: view counts, star ratings, related videos, comment threads.",
      "Mail in Outlook Express with a folder tree and a compose window that sends.",
      "The gallery in C:\\My Pictures as Explorer thumbnails with a viewer.",
      "Five games: Solitaire, Minesweeper, Chess, Tetris and Pong.",
      "Paint with its toolbox and palette, Notepad, an MS-DOS prompt, and a Recycle Bin that restores.",
      "One secret behind a famous code.",
    ],
  },
  {
    version: "0.1 Beta",
    date: "December 2024",
    title: "The hackathon",
    notes: [
      "Born at a 24-hour hackathon: a teal desktop, a Start button, and the idea that a portfolio could boot.",
      "Only the base layer made it in before the clock ran out, but the concept was proven.",
      "Everything since exists because 24 hours was not enough and stopping was not interesting.",
    ],
  },
]

export default function PatchNotes() {
  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-patch-notes
    >
      <div className="border-b border-[#808080] bg-[#c0c0c0] px-3 py-2">
        <div className="font-bold">Windows 95 Portfolio - Release Notes</div>
        <div className="text-[#404040]">What changed, from the beginning.</div>
      </div>

      <div className="flex-1 overflow-auto bg-white p-3">
        {RELEASES.map((r) => (
          <section key={r.version} className="mb-4" data-release={r.version}>
            <div className="border-b border-[#808080] pb-1">
              <span className="font-bold">{`Version ${r.version}`}</span>
              <span className="px-2 text-[#808080]">&mdash;</span>
              <span className="font-bold">{r.title}</span>
              <span className="float-right text-[#404040]">{r.date}</span>
            </div>
            <ul className="mt-1 list-none pl-1">
              {r.notes.map((n) => (
                <li key={n} className="py-[2px]">
                  <span className="mr-2">&#8226;</span>
                  {n}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-white bg-[#c0c0c0] px-3 py-[3px] text-[#404040]">
        {RELEASES.length} releases
      </div>
    </div>
  )
}
