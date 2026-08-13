"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { getEntries, signGuestbook } from "@/actions/guestbook"
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

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState("")
  const [ephemeral, setEphemeral] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

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
      const result = await signGuestbook(new FormData(e.currentTarget))
      setStatus(result.message)
      if (result.success) {
        if (result.entries) setEntries(result.entries)
        formRef.current?.reset()
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
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-guestbook
    >
      <div className="border-b border-[#808080] px-3 py-2">
        <div className="font-bold">Sign my guestbook</div>
        <div className="text-[#404040]">
          {entries.length === 1 ? "1 person has" : `${entries.length} people have`} signed so far.
        </div>
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
                <span className="shrink-0 text-[#808080]">{formatDate(entry.at)}</span>
              </div>
              {/* Rendered as text, never as markup. */}
              <div className="whitespace-pre-wrap break-words">{entry.message}</div>
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
    </div>
  )
}
