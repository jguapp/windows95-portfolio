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
    version: "4.2",
    date: "August 14, 2026",
    title: "The authenticity pass",
    notes: [
      "Every game shares one thin menu bar. Tetris, Pong, Solitaire and Chess drew their own headers, some twice.",
      "Pong can be beaten: the bot mis-reads the ball by an honest margin per difficulty, and P unpauses.",
      "Paint carries the exact 28-colour MS Paint palette and the original tool icons.",
      "Reversi plays on the grey board of the Windows 3.1 release.",
      "Calculator lost its maximise button, which the original never had.",
      "The desktop drag-selection is a dotted marquee, not a blue wash.",
      "Compact tray, tidied Start menu, and a Windows95 banner that grows from the bottom.",
      "The party markers in the hidden battle are proper pixel-art balls.",
    ],
  },
  {
    version: "4.1",
    date: "August 14, 2026",
    title: "Winamp, Clippy, and a proper goodbye",
    notes: [
      "Winamp. The real skin engine, whipping the llama in the browser, with a synthesised opening track.",
      "Clippit sits at the bottom right, offers a tip about whatever window is open, and leaves when dismissed.",
      "Shut Down asks the question, dims the desktop, and ends on the amber It's-now-safe screen.",
      "Five real screensavers behind a working Display Properties: Flying Windows, Mystify, 3D Pipes, Marquee, Starfield.",
      "Display Properties applies for real: wallpaper, tile or stretch, colour schemes, saver choice with a live preview.",
      "Mail replaced Contact Me, with a filled Sent Items and a Deleted Items that earned it.",
    ],
  },
  {
    version: "4.0",
    date: "August 13, 2026",
    title: "The shell release",
    notes: [
      "Run, on Windows+R, taking the real executable names: calc, winmine, sol, mspaint.",
      "Date/Time Properties on a click of the clock: calendar, ticking analogue face.",
      "Right-click Properties on every desktop icon, with a General and Shortcut tab.",
      "The Windows 95 sound scheme, synthesised: the ding, the chord, question and exclamation, per dialog.",
      "The whole desktop works on a phone: windows open maximised, icons wrap above the taskbar.",
      "A New Game dialog for Chess and a Minesweeper Expert board you can actually reach.",
    ],
  },
  {
    version: "3.0",
    date: "August 12-13, 2026",
    title: "Six a side",
    notes: [
      "The hidden battle went 6v6, with drawn creatures, cries, and platforms measured from each sprite's feet.",
      "The gallery opens photos in a full-screen viewer with Previous, Next, and a slide show.",
      "59 messages in the inbox spanning two years, spam included.",
      "The resume widened until the coursework held two lines, and the projects player fills its window.",
      "Pong went black and white, and its score is painted on the table.",
    ],
  },
  {
    version: "2.0",
    date: "August 2026",
    title: "The games release",
    notes: [
      "FreeCell with the original deal numbering, Hearts, Reversi.",
      "Solitaire ends in the cascade, as is right.",
      "Minesweeper drew its LED counters and smiley on the pixel grid.",
      "Chess got Windows-style menus, sounds modelled on the modern set, and three difficulties.",
      "A guestbook on Postgres, with drawings.",
    ],
  },
  {
    version: "1.0",
    date: "July 2025",
    title: "First boot",
    notes: [
      "A Windows 95 desktop in Next.js: windows, Start menu, taskbar, icons.",
      "About Me as a 2005 profile page, the resume in Word, projects on 2005 YouTube, mail in Outlook Express.",
      "Games, Paint, Notepad, MS-DOS, a Recycle Bin that works, and one secret behind a famous code.",
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
