"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { getEntries, moderationAvailable, removeEntry, signGuestbook, verifyModerator } from "@/actions/guestbook"
import type { GuestbookEntry } from "@/lib/guestbook"
import { messageBox } from "@/components/win95-dialog"

/**
 * The guestbook.
 *
 * Every personal site in 1995 had one, and it is the one thing here that other
 * visitors can change. Entries are shared, so they are stored server-side and
 * everything submitted is rendered as text: nothing a stranger types becomes
 * markup on the page.
 */

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const FIELD =
  "w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
const BUTTON =
  "min-w-[80px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white disabled:text-[#808080]"

/** The sketch pad, at the size the entries display it. */
const PAD_W = 420
const PAD_H = 96

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  /** The compose form starts open; it folds away for reading. */
  const [composing, setComposing] = useState(true)
  const [status, setStatus] = useState("")
  const [ephemeral, setEphemeral] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const padRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  /** Whether anything has been drawn, so an untouched pad is not submitted. */
  const [hasDrawing, setHasDrawing] = useState(false)
  /**
   * Moderation.
   *
   * The key lives in this component's state for the life of the window and
   * nowhere else: not in localStorage, where a shared machine would keep
   * it, and not in the bundle. Every delete sends it back to be checked
   * again, so what is held here is a convenience, not an authorisation.
   */
  const [canModerate, setCanModerate] = useState(false)
  const [askingKey, setAskingKey] = useState(false)
  const [keyInput, setKeyInput] = useState("")
  const [moderatorKey, setModeratorKey] = useState<string | null>(null)

  /** White to start with, otherwise the PNG saves a transparent rectangle. */
  const clearPad = useCallback(() => {
    const canvas = padRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }, [])

  useEffect(() => clearPad(), [clearPad])

  const padPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    // The element is stretched to the form's width; map back to canvas pixels.
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const strokeTo = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = padRef.current?.getContext("2d")
    const point = padPoint(e)
    if (!ctx || !point) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    setHasDrawing(true)
  }

  // Whether the server has a key configured at all. With none, the door is
  // not merely locked; it is not drawn.
  useEffect(() => {
    let live = true
    moderationAvailable()
      .then((available) => live && setCanModerate(available))
      .catch(() => {
        // A server that cannot answer offers no moderation, which is the
        // safe direction to fail in.
      })
    return () => {
      live = false
    }
  }, [])

  const signIn = async () => {
    const result = await verifyModerator(keyInput)
    setStatus(result.message)
    if (result.ok) {
      setModeratorKey(keyInput)
      setAskingKey(false)
    }
    setKeyInput("")
  }

  const removeOne = async (id: string, name: string) => {
    if (!moderatorKey) return
    const confirmed = await messageBox({
      title: "Guestbook",
      text: `Remove the entry by ${name}?`,
      icon: "warning",
      cancel: true,
    })
    if (!confirmed) return
    const result = await removeEntry(id, moderatorKey)
    setStatus(result.message)
    if (result.entries) setEntries(result.entries)
    // A key the server has stopped accepting is a key worth forgetting.
    if (!result.ok && /not right/i.test(result.message)) setModeratorKey(null)
  }

  useEffect(() => {
    let live = true
    getEntries()
      .then(({ entries: loaded, persistent }) => {
        if (!live) return
        setEntries(loaded)
        setEphemeral(!persistent)
      })
      .catch(() => setStatus("Could not load the guestbook."))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setStatus("")
    try {
      const data = new FormData(e.currentTarget)
      // Only send a pad that has been drawn on; a blank one is 240x120 of white
      // and there is no reason to store it.
      if (hasDrawing && padRef.current) {
        data.set("drawing", padRef.current.toDataURL("image/png"))
      }

      const result = await signGuestbook(data)
      setStatus(result.message)
      if (result.success) {
        if (result.entries) setEntries(result.entries)
        formRef.current?.reset()
        clearPad()
      } else {
        // Not awaited: the box resolves when it is dismissed, and awaiting it
        // here kept the form disabled until then, so the visitor could not
        // correct what they had just been told was wrong.
        void messageBox({ title: "Guestbook", text: result.message, icon: "warning" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="win95-type relative flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-guestbook
    >
      <div className="flex items-center gap-2 border-b border-[#808080] px-3 py-2">
        <div className="flex-1">
          <div className="font-bold">Sign my guestbook</div>
          <div className="text-[#404040]">
            {entries.length === 1 ? "1 person has" : `${entries.length} people have`} signed so far.
          </div>
        </div>
        {/* Folding the form away gives the entries the whole window, which is
            what you want once you are reading rather than writing. */}
        {canModerate &&
          (moderatorKey ? (
            <button
              type="button"
              data-moderation-off
              onClick={() => {
                setModeratorKey(null)
                setStatus("Moderation off.")
              }}
              className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              Moderating
            </button>
          ) : (
            <button
              type="button"
              data-moderation-on
              title="Owner only"
              onClick={() => setAskingKey(true)}
              className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              Moderate
            </button>
          ))}
        <button
          type="button"
          data-toggle-form
          aria-expanded={composing}
          onClick={() => setComposing((v) => !v)}
          className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
        >
          {composing ? "Hide the form" : "Sign the book"}
        </button>
      </div>

      {/* Entries */}
      <div data-entries className="flex-1 overflow-auto bg-white p-2">
        {loading ? (
          <div className="p-2">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-2 text-[#404040]">Nobody has signed yet. Be the first.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} data-entry className="mb-2 border-b border-[#c0c0c0] pb-2 last:border-b-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{entry.name}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="text-[#808080]">{formatDate(entry.at)}</span>
                  {moderatorKey && (
                    <button
                      type="button"
                      data-delete-entry={entry.id}
                      onClick={() => removeOne(entry.id, entry.name)}
                      className="border border-[#808080] bg-[#c0c0c0] px-1 text-[#800000]"
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>
              {/* Rendered as text, never as markup. */}
              <div className="whitespace-pre-wrap break-words">{entry.message}</div>
              {entry.drawing && (
                <img
                  src={entry.drawing}
                  alt={`A drawing by ${entry.name}`}
                  data-entry-drawing
                  width={PAD_W}
                  height={PAD_H}
                  className="my-1 border border-[#808080]"
                />
              )}
              {entry.site && (
                <a
                  href={entry.site}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="text-[#0000cc] underline"
                >
                  {entry.site}
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form */}
      {composing && (
      <form ref={formRef} onSubmit={submit} className="border-t border-white bg-[#c0c0c0] p-3">
        <div className="mb-2 flex gap-2">
          <label className="flex flex-1 items-center gap-2">
            <span className="w-[52px] shrink-0">Name:</span>
            <input name="name" maxLength={40} required className={FIELD} data-name />
          </label>
          <label className="flex flex-1 items-center gap-2">
            <span className="w-[64px] shrink-0">Homepage:</span>
            <input name="site" maxLength={120} placeholder="http://" className={FIELD} data-site />
          </label>
        </div>

        <label className="mb-2 flex items-start gap-2">
          <span className="w-[52px] shrink-0 pt-1">Message:</span>
          <textarea name="message" maxLength={500} required rows={3} className={`${FIELD} resize-none`} data-message />
        </label>

        {/* A place to draw, because a 1995 guestbook without one is only half of it. */}
        <div className="mb-2 flex items-start gap-2">
          <span className="w-[52px] shrink-0 pt-1">Doodle:</span>
          <canvas
            ref={padRef}
            data-pad
            width={PAD_W}
            height={PAD_H}
            className="w-full cursor-crosshair border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white"
            onMouseDown={(e) => {
              const ctx = padRef.current?.getContext("2d")
              const point = padPoint(e)
              if (!ctx || !point) return
              drawing.current = true
              ctx.strokeStyle = "#000000"
              ctx.lineWidth = 2
              ctx.lineCap = "round"
              ctx.lineJoin = "round"
              ctx.beginPath()
              ctx.moveTo(point.x, point.y)
              // A single click should leave a dot, not nothing.
              ctx.lineTo(point.x + 0.1, point.y)
              ctx.stroke()
              setHasDrawing(true)
            }}
            onMouseMove={strokeTo}
            onMouseUp={() => (drawing.current = false)}
            onMouseLeave={() => (drawing.current = false)}
          />
          <button
            type="button"
            data-clear-pad
            onClick={clearPad}
            className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-2 py-[2px] active:border-t-[#404040] active:border-l-[#404040]"
          >
            Clear
          </button>
        </div>

        {/* Honeypot: off-screen and not reachable by tab, so only a bot fills it. */}
        <input
          type="text"
          name="homepage_url"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className={BUTTON} disabled={submitting} data-sign>
            {submitting ? "Signing..." : "Sign"}
          </button>
          <span data-status className="flex-1">
            {status}
          </span>
        </div>

        {ephemeral && (
          <div className="mt-2 text-[#808080]">
            Shared storage is not configured, so entries will not outlive this server.
          </div>
        )}
      </form>
      )}

      {/* The moderator prompt. A password field, so a shoulder learns nothing. */}
      {askingKey && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setAskingKey(false)}>
          <form
            data-key-prompt
            className="w-[300px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              void signIn()
            }}
          >
            <div className="bg-[#000080] px-2 py-[3px] font-bold text-white">Moderator</div>
            <div className="p-3">
              <label className="mb-2 block">Enter the moderator key:</label>
              <input
                autoFocus
                type="password"
                data-key-input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="mb-3 w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  data-key-ok
                  className="h-[23px] min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAskingKey(false)
                    setKeyInput("")
                  }}
                  className="h-[23px] min-w-[70px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
