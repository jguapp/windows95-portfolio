"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"

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

/** Phrase and animation pairs, tailored to this desk. */
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
]

const INTERRUPTION = { phrase: "Please, do not interrupt me!", animation: NO_GIF }

/** What he says about the window you are actually in. */
const WINDOW_TIPS: Record<string, { phrase: string; animation: string }[]> = {
  resume: [
    { phrase: "It looks like you're reading a resume. It is all editable. Click anywhere.", animation: GIF(3) },
    { phrase: "The zoom control in Word actually zooms. Try 75%.", animation: GIF(4) },
  ],
  projects: [{ phrase: "Every project here has its source on GitHub. The related videos work too.", animation: GIF(2) }],
  contact: [
    { phrase: "It looks like you're writing a letter. Compose really sends.", animation: GIF(1) },
    { phrase: "Read the Drafts folder. Honesty lives there.", animation: GIF(7) },
  ],
  games: [
    { phrase: "It looks like you're avoiding work. Expert is 99 mines, if you are serious.", animation: GIF(5) },
    { phrase: "The Solitaire cascade at the end is worth winning for.", animation: GIF(6) },
  ],
  gallery: [{ phrase: "The arrow keys step through the photos.", animation: GIF(4) }],
  paint: [{ phrase: "It looks like you're making art. It saves to the desktop, genuinely.", animation: GIF(2) }],
  guestbook: [{ phrase: "Drawings are allowed in the guestbook. Encouraged, even.", animation: GIF(5) }],
  "internet-explorer": [{ phrase: "It is 1996 in that address bar. Try yahoo.com.", animation: GIF(6) }],
  calculator: [{ phrase: "2 + 3 + 4 equals 9 here. That was not always true.", animation: GIF(3) }],
  "about-me": [{ phrase: "It looks like you're reading about Joel. The wall posts are the good part.", animation: GIF(1) }],
}

/** How long a phrase and its animation stay up. */
const SPEECH_MS = 9_000
/** How long he waits between unprompted appearances. */
const QUIET_MS = 45_000

export default function Clippy({ activeWindow, hidden }: ClippyProps) {
  const [dismissed, setDismissed] = useState(false)
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
    const pool = [...(activeWindow ? WINDOW_TIPS[activeWindow] ?? [] : []), ...PHRASES]
    const fresh = pool.filter((p) => !saidRef.current.has(p.phrase))
    const pickFrom = fresh.length ? fresh : pool
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)]
    saidRef.current.add(pick.phrase)
    speak(pick)
  }, [activeWindow, speak])

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
