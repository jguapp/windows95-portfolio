"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"
import { countVisit, visitorCount } from "@/actions/visitors"

/**
 * Clippit, at the bottom right of the desktop.
 *
 * The animated frames are the real assistant, each phrase paired with the
 * animation that suits it, and clicking him mid-sentence earns the genuine
 * "do not interrupt" routine. He minds his own business while a window is
 * open: the assistant lives on the desktop, not on top of your work. The
 * close button dismisses him for good, which is the most faithful Clippy
 * behaviour of all.
 */
interface ClippyProps {
  /** The window in front, so his tips can be about what you are doing. */
  activeWindow: string | null
  /** True while any window is maximised; he stays out of full-screen work. */
  hidden: boolean
}

const GIF = (n: number) => `/images/clippy/clippyani${n}.gif`
const NO_GIF = "/images/clippy/clippyNo.gif"

/**
 * Phrase and animation pairs, tailored to this desk.
 *
 * The pool is deliberately deep: he cycles through unsaid lines first, so the
 * more he has, the longer a visit goes before anything repeats.
 */
const PHRASES: { phrase: string; animation: string }[] = [
  { phrase: "I'm Clippy, Joel's personal assistant. I'm here to help!", animation: GIF(1) },
  { phrase: "Sometimes I just pop up for no particular reason. Like now.", animation: GIF(7) },
  { phrase: "It looks like you're hiring. The resume is on the desktop, in Word.", animation: GIF(3) },
  { phrase: "Joel builds backends: queues, caches, Kubernetes. I file paper.", animation: GIF(4) },
  { phrase: "Try the Konami code. I have said too much.", animation: GIF(2) },
  { phrase: "The games all work. Minesweeper's Expert board is 99 mines.", animation: GIF(5) },
  { phrase: "Type an address into Internet Explorer. It is 1996 in there.", animation: GIF(6) },
  { phrase: "Winamp really whips the llama. Double-click and see.", animation: GIF(2) },
  { phrase: "Sign the guestbook. Drawings are allowed. Encouraged, even.", animation: GIF(5) },
  { phrase: "Ctrl+Alt+R opens Run. Old habits, slightly relocated.", animation: GIF(4) },
  { phrase: "The screensavers are real. Leave the desk alone and see.", animation: GIF(6) },
  { phrase: "You're doing great! Keep up the good work.", animation: GIF(3) },
  { phrase: "Alt+Q switches windows. Alt+Tab belongs to your other computer.", animation: GIF(4) },
  { phrase: "Save a file in Notepad. With the Welcome box checked, it is here tomorrow.", animation: GIF(6) },
  { phrase: "Paint has a Save to Desktop now. Your art can live here.", animation: GIF(2) },
  { phrase: "Find, under Start, genuinely searches this C: drive.", animation: GIF(5) },
  { phrase: "The Sounds control panel plays the whole scheme. Try Critical Stop.", animation: GIF(1) },
  { phrase: "I have been assisting since 1997. Nobody has ever thanked me.", animation: GIF(7) },
  { phrase: "Tip: save your work. Tip: I am your work.", animation: GIF(3) },
  { phrase: "The clock in the tray opens Date and Time. Double clicks are for 98.", animation: GIF(4) },
  { phrase: "Every icon lines up on a grid. I straightened them while you were out.", animation: GIF(6) },
  { phrase: "The Recycle Bin restores things. Regret is a feature here.", animation: GIF(5) },
  { phrase: "FreeCell deal 11982 cannot be won. People have tried since 1995.", animation: GIF(2) },
  { phrase: "The MS-DOS prompt accepts real commands. Type help and mean it.", animation: GIF(4) },
  { phrase: "Solitaire pays out a cascade when you win. Worth it every time.", animation: GIF(6) },
  { phrase: "I contain no AI. I contain if statements and enthusiasm.", animation: GIF(1) },
  { phrase: "This entire computer fits in a browser tab. Do not tell the tower.", animation: GIF(7) },
  { phrase: "The wall posts in About Me are the good part. I read them all.", animation: GIF(3) },
  { phrase: "Drafts in Outlook Express hold the letters nobody sent.", animation: GIF(5) },
  { phrase: "Press Tab. The desktop listens to keyboards now.", animation: GIF(4) },
  { phrase: "The calculator gets 2 + 3 + 4 right. This was once worth announcing.", animation: GIF(2) },
  { phrase: "Chess on Hard looks one move ahead. So do most managers.", animation: GIF(6) },
  { phrase: "The Pong bot reads the ball late on purpose. Mercy, engineered.", animation: GIF(5) },
  { phrase: "Every sound here is synthesised. The chord is four sine waves.", animation: GIF(1) },
  { phrase: "The wallpapers tile. In 1995 everything tiled. It was a simpler grid.", animation: GIF(7) },
  { phrase: "Screen too roomy? The little monitor in the tray sets a resolution.", animation: GIF(4) },
  { phrase: "It looks like you're reading a portfolio. Would you like help hiring Joel?", animation: GIF(3) },
  { phrase: "I am the only paperclip here with a job. The others are in a drawer.", animation: GIF(7) },
  { phrase: "Nothing on this desk is a mockup. Click anything. I dare you.", animation: GIF(2) },
  { phrase: "The guestbook drawings are permanent. Choose your doodle wisely.", animation: GIF(5) },
  { phrase: "Shut Down is under Start. It really shuts down. See you tomorrow.", animation: GIF(6) },
  { phrase: "Nothing you make here is saved unless you check the box in the Welcome window.", animation: GIF(1) },
  { phrase: "Right-click the desktop. New folders, wallpaper, and me, all in one menu.", animation: GIF(4) },
  { phrase: "Icons can be dragged onto the Recycle Bin. It does what you fear.", animation: GIF(5) },
  { phrase: "Click an icon's name, pause, click it again. Renaming has always worked like that.", animation: GIF(3) },
  { phrase: "Display Properties has an Appearance tab. Rose turns everything pink. Everything.", animation: GIF(7) },
  { phrase: "Type joel95.net into Internet Explorer. The home page counts your visit.", animation: GIF(6) },
  { phrase: "Winamp's eject button takes your own music. It never leaves your browser.", animation: GIF(2) },
]

const INTERRUPTION = { phrase: "Please, do not interrupt me!", animation: NO_GIF }

/** What he says about the window you are actually in. */
const WINDOW_TIPS: Record<string, { phrase: string; animation: string }[]> = {
  resume: [
    { phrase: "It looks like you're reading a resume. It is all editable. Click anywhere.", animation: GIF(3) },
    { phrase: "The zoom control in Word actually zooms. Try 75%.", animation: GIF(4) },
    { phrase: "File, then Print. A real document comes out. I am as surprised as you.", animation: GIF(2) },
  ],
  projects: [
    { phrase: "Every project here has its source on GitHub. The related videos work too.", animation: GIF(2) },
    { phrase: "The view counts are fake. The projects are not.", animation: GIF(7) },
  ],
  contact: [
    { phrase: "It looks like you're writing a letter. Compose really sends.", animation: GIF(1) },
    { phrase: "Read the Drafts folder. Honesty lives there.", animation: GIF(7) },
  ],
  games: [
    { phrase: "It looks like you're avoiding work. Expert is 99 mines, if you are serious.", animation: GIF(5) },
    { phrase: "The Solitaire cascade at the end is worth winning for.", animation: GIF(6) },
    { phrase: "Tetris keeps a high score table now. Initials optional, glory mandatory.", animation: GIF(2) },
    { phrase: "Hearts is called Shooting the Moon for a reason. Try taking everything.", animation: GIF(4) },
  ],
  gallery: [
    { phrase: "The arrow keys step through the photos.", animation: GIF(4) },
    { phrase: "View, then Slide Show. Then sit back. You have earned it.", animation: GIF(6) },
  ],
  paint: [
    { phrase: "It looks like you're making art. Save to Desktop keeps it, permanently.", animation: GIF(2) },
    { phrase: "The spray can was called the airbrush. Respect the classics.", animation: GIF(5) },
  ],
  guestbook: [
    { phrase: "Drawings are allowed in the guestbook. Encouraged, even.", animation: GIF(5) },
    { phrase: "Entries live in a real database. Your words outlast the session.", animation: GIF(1) },
  ],
  "internet-explorer": [
    { phrase: "It is 1996 in that address bar. Try yahoo.com.", animation: GIF(6) },
    { phrase: "The web weighed twelve kilobytes a page back then. It loaded fine.", animation: GIF(7) },
    { phrase: "joel95.net lives in this browser. The hit counter on it is real.", animation: GIF(2) },
  ],
  calculator: [
    { phrase: "2 + 3 + 4 equals 9 here. That was not always true.", animation: GIF(3) },
    { phrase: "View, then Scientific. The window resizes itself, like it should.", animation: GIF(4) },
  ],
  "about-me": [
    { phrase: "It looks like you're reading about Joel. The wall posts are the good part.", animation: GIF(1) },
    { phrase: "The music player on the profile plays. Autoplay was legal in 2007.", animation: GIF(6) },
  ],
  notepad: [
    { phrase: "It looks like you're writing. Save As keeps it on the C: drive, for good.", animation: GIF(3) },
    { phrase: "F5 stamps the time and date. The oldest logging framework there is.", animation: GIF(4) },
  ],
  msdos: [
    { phrase: "Type dir. Everything you see is really there.", animation: GIF(4) },
    { phrase: "echo text > file.txt writes an actual file. With great power, and so on.", animation: GIF(2) },
  ],
  explorer: [
    { phrase: "It looks like you're browsing the C: drive. The files are all real.", animation: GIF(6) },
    { phrase: "My Documents has a Readme. Somebody finally reads one.", animation: GIF(1) },
  ],
  "recycle-bin": [
    { phrase: "Restore puts things back exactly where they were. Regret, undone.", animation: GIF(5) },
    { phrase: "Emptying it makes the crunch sound. That is the whole reward.", animation: GIF(7) },
  ],
  "find-files": [
    { phrase: "Containing text searches inside the files. Grep, in a cardigan.", animation: GIF(4) },
    { phrase: "Files you save from Notepad show up here the moment they land.", animation: GIF(2) },
  ],
  "sound-properties": [
    { phrase: "Double-click an event to hear it. Critical Stop is my favourite.", animation: GIF(5) },
    { phrase: "This slider and the tray slider are the same slider. Trust the system.", animation: GIF(1) },
  ],
  "patch-notes": [
    { phrase: "The release notes are the site's own history, written as it happened.", animation: GIF(3) },
  ],
}

/** How long a phrase and its animation stay up. */
const SPEECH_MS = 9_000
/** How long he waits between unprompted appearances. */
const QUIET_MS = 45_000

export default function Clippy({ activeWindow, hidden }: ClippyProps) {
  const [dismissed, setDismissed] = useState(false)
  /** The hit-counter line, added once the visitor number arrives. */
  const [guestLine, setGuestLine] = useState<{ phrase: string; animation: string } | null>(null)
  const [line, setLine] = useState<{ phrase: string; animation: string } | null>(null)
  const saidRef = useRef<Set<string>>(new Set())
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const speakingRef = useRef(false)

  const speak = useCallback((entry: { phrase: string; animation: string }) => {
    speakingRef.current = true
    setLine(entry)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      speakingRef.current = false
      setLine(null)
    }, SPEECH_MS)
  }, [])

  const speakFresh = useCallback(() => {
    // Tips about the window in front come first; the general chatter fills in.
    const pool = [
      ...(activeWindow ? WINDOW_TIPS[activeWindow] ?? [] : []),
      ...PHRASES,
      ...(guestLine ? [guestLine] : []),
    ]
    const fresh = pool.filter((p) => !saidRef.current.has(p.phrase))
    const pickFrom = fresh.length ? fresh : pool
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)]
    saidRef.current.add(pick.phrase)
    speak(pick)
  }, [activeWindow, guestLine, speak])

  // He pops up on his own whenever he is on stage.
  useEffect(() => {
    if (dismissed || hidden) return
    const first = setTimeout(speakFresh, 4_000)
    const timer = setInterval(speakFresh, QUIET_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [dismissed, hidden, speakFresh])

  /*
    One real number among the scripted lines: the hit counter.

    The browser keeps a flag; its absence means a first visit, which is the
    only kind that increments the shared count. When the database is absent
    the count resets on every restart and is not worth announcing, so the
    line never joins the pool.
  */
  useEffect(() => {
    let live = true
    const KEY = "win95:visitor"
    let stored: string | null = null
    try {
      stored = localStorage.getItem(KEY)
      if (!stored) localStorage.setItem(KEY, "counting")
    } catch {
      stored = "uncounted"
    }

    // A stored number is the visit that was counted; anything else is a
    // returning visitor from before numbers were kept.
    const ownNumber = stored ? Number.parseInt(stored, 10) : Number.NaN
    if (Number.isFinite(ownNumber) && ownNumber > 0) {
      setGuestLine({
        phrase: `You were visitor number ${ownNumber.toLocaleString()}. I remember you.`,
        animation: GIF(5),
      })
      return
    }

    ;(stored ? visitorCount() : countVisit())
      .then(({ count, persistent }) => {
        if (!live || !persistent || count === 0) return
        if (!stored) {
          try {
            localStorage.setItem(KEY, String(count))
          } catch {
            // The greeting still works this visit; he just forgets by next time.
          }
          setGuestLine({
            phrase: `You are visitor number ${count.toLocaleString()}. I counted you myself.`,
            animation: GIF(5),
          })
        } else {
          setGuestLine({
            phrase: `${count.toLocaleString()} visitors so far. I have counted every one.`,
            animation: GIF(5),
          })
        }
      })
      .catch(() => {
        // No database is not an error worth surfacing through a paperclip.
      })
    return () => {
      live = false
    }
  }, [])

  // Dismissal is not exile: the desktop menu can summon him back.
  useEffect(() => {
    const summon = () => setDismissed(false)
    window.addEventListener("summonClippy", summon)
    return () => window.removeEventListener("summonClippy", summon)
  }, [])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  if (dismissed || hidden) return null

  return (
    <div data-clippy className="fixed bottom-[42px] right-3 z-[850] flex flex-col items-end">
      {line && (
        <div
          data-clippy-tip
          className="win95-type relative mb-2 w-[240px] rounded-[6px] border border-black bg-[#ffffcc] p-2 shadow-[2px_2px_5px_rgba(0,0,0,0.4)]"
          style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
        >
          {line.phrase}
          <span className="absolute -bottom-[9px] right-6 block h-0 w-0 border-l-[8px] border-t-[9px] border-l-transparent border-t-black" />
          <span className="absolute -bottom-[7px] right-[25px] block h-0 w-0 border-l-[7px] border-t-[8px] border-l-transparent border-t-[#ffffcc]" />
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          data-clippy-close
          aria-label="Dismiss the assistant"
          onClick={() => {
            setLine(null)
            setDismissed(true)
          }}
          className="absolute -right-1 -top-1 z-10 flex h-[15px] w-[15px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040]"
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          data-clippy-body
          aria-label="Ask the assistant for a tip"
          onClick={() => {
            // Clicking him mid-sentence gets the genuine reaction.
            if (speakingRef.current && line !== INTERRUPTION) speak(INTERRUPTION)
            else speakFresh()
          }}
          className="block"
        >
          <img
            src={line?.animation ?? GIF(1)}
            alt=""
            width={96}
            height={96}
            data-clippy-frame
            style={{ imageRendering: "auto" }}
          />
        </button>
      </div>
    </div>
  )
}
