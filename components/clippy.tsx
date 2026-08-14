"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"

/**
 * Clippit, at the bottom right.
 *
 * The Office Assistant arrived in Office 97, so he is a year anachronistic
 * here and entirely worth it. He watches which window is active and offers a
 * tip about it, waits patiently between appearances, and goes away for good
 * when dismissed, because the one thing everyone remembers about Clippy is
 * wanting him to leave.
 *
 * The character is drawn as SVG rather than shipped as a Microsoft bitmap:
 * a paperclip with eyes on a yellow note.
 */
interface ClippyProps {
  activeWindow: string | null
}

/** What he says about each window, plus general desk chatter. */
const TIPS: Record<string, string[]> = {
  resume: [
    "It looks like you're reading a resume. The whole thing is editable, you know. Click anywhere.",
    "Word 95 tip: the zoom control actually zooms. Try 75% for the full-page look.",
  ],
  projects: [
    "It looks like you're browsing projects. Every one of these has its source on GitHub.",
    "The related videos on the right actually work. It is a rabbit hole on purpose.",
  ],
  contact: [
    "It looks like you're writing a letter. The Compose button really sends, so mind what you type.",
    "Check Deleted Items. Some of it deserved better.",
  ],
  games: [
    "It looks like you're avoiding work. Minesweeper's Expert board is 99 mines, if you are serious about it.",
    "The Solitaire cascade at the end is worth winning for.",
    "Chess will beat you on Hard. It beat me and I am a paperclip.",
  ],
  gallery: ["It looks like you're browsing photos. The arrow keys step through them."],
  paint: ["It looks like you're making art. It saves to the desktop, genuinely."],
  guestbook: ["It looks like you're signing a guestbook. Drawings are allowed. Encouraged, even."],
  calculator: ["Fun fact: 2 + 3 + 4 equals 9 here. That was not always true."],
  "about-me": ["It looks like you're reading about Joel. The wall posts are the good part."],
}

const GENERAL_TIPS = [
  "It looks like you're exploring a desktop from 1995. Would you like help with that?",
  "Try Ctrl+Alt+R. The Run box answers to it.",
  "Single-click the clock. Go on.",
  "Right-click the desktop and open Properties. The screensavers are real.",
  "There is a Konami code. I have said too much.",
  "Drag something onto the Recycle Bin. It works, and I find that upsetting.",
]

/** How long he waits before piping up about a newly focused window. */
const FOCUS_DELAY_MS = 6_000
/** How long between unprompted appearances. */
const IDLE_INTERVAL_MS = 90_000
/** How long a tip stays up if ignored. */
const TIP_LIFETIME_MS = 14_000

export default function Clippy({ activeWindow }: ClippyProps) {
  const [dismissed, setDismissed] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const saidRef = useRef<Set<string>>(new Set())
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const say = useCallback((pool: string[]) => {
    // Prefer a line he has not used yet; repeat only when they run out.
    const fresh = pool.filter((t) => !saidRef.current.has(t))
    const line = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))]
    saidRef.current.add(line)
    setTip(line)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setTip(null), TIP_LIFETIME_MS)
  }, [])

  // A tip about the window that just came to the front.
  useEffect(() => {
    if (dismissed || !activeWindow || !TIPS[activeWindow]) return
    const timer = setTimeout(() => say(TIPS[activeWindow]), FOCUS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [activeWindow, dismissed, say])

  // Unprompted chatter, spaced far apart.
  useEffect(() => {
    if (dismissed) return
    const timer = setInterval(() => say(GENERAL_TIPS), IDLE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [dismissed, say])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  if (dismissed) return null

  return (
    <div data-clippy className="fixed bottom-[42px] right-3 z-[850] flex flex-col items-end">
      {tip && (
        <div
          data-clippy-tip
          className="win95-type relative mb-2 w-[230px] rounded-[6px] border border-black bg-[#ffffcc] p-2 shadow-[2px_2px_5px_rgba(0,0,0,0.4)]"
          style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
        >
          {tip}
          {/* The speech-bubble tail, pointing down at him. */}
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
            setTip(null)
            setDismissed(true)
          }}
          className="absolute -right-1 -top-1 z-10 flex h-[15px] w-[15px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-[9px] leading-none text-black active:border-t-[#404040] active:border-l-[#404040]"
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          data-clippy-body
          aria-label="Ask the assistant for a tip"
          onClick={() => say(activeWindow && TIPS[activeWindow] ? TIPS[activeWindow] : GENERAL_TIPS)}
          className="block"
        >
          {/* The note he stands on, then the clip himself. */}
          <svg width="72" height="80" viewBox="0 0 72 80" aria-hidden>
            <rect x="4" y="22" width="64" height="54" fill="#ffffcc" stroke="#b8a000" />
            <line x1="10" y1="34" x2="62" y2="34" stroke="#d8c880" />
            <line x1="10" y1="44" x2="62" y2="44" stroke="#d8c880" />
            <line x1="10" y1="54" x2="62" y2="54" stroke="#d8c880" />
            <line x1="10" y1="64" x2="62" y2="64" stroke="#d8c880" />
            {/* The clip: two nested wire loops. */}
            <path
              d="M30 62 L30 18 A8 8 0 0 1 46 18 L46 54 A5 5 0 0 1 36 54 L36 24"
              fill="none"
              stroke="#808080"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M30 62 L30 18 A8 8 0 0 1 46 18 L46 54 A5 5 0 0 1 36 54 L36 24"
              fill="none"
              stroke="#c0c0c0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Eyes, which are the whole of the character. */}
            <ellipse cx="33" cy="12" rx="5" ry="7" fill="#ffffff" stroke="#000000" />
            <ellipse cx="43" cy="12" rx="5" ry="7" fill="#ffffff" stroke="#000000" />
            <circle cx="34" cy="14" r="2" fill="#000000" />
            <circle cx="44" cy="14" r="2" fill="#000000" />
            {/* Eyebrows. */}
            <path d="M28 4 Q33 1 38 4" fill="none" stroke="#000000" strokeWidth="1.5" />
            <path d="M38 4 Q43 1 48 4" fill="none" stroke="#000000" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
