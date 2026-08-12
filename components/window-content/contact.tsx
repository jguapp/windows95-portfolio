"use client"

import type React from "react"
import { useRef, useState } from "react"
import { sendEmail } from "@/actions/send-email"
import { CloseIcon } from "@/components/win95-controls"

/**
 * The Contact window, as Outlook Express.
 *
 * The three-pane silhouette is the point: folder tree, message list, preview
 * pane. Compose opens as a separate window with its own toolbar, as it did.
 *
 * The send path is untouched. Rate limiting, the honeypot and the length caps
 * all live in the server action, not here, so this is a visual rebuild that
 * cannot weaken them. The hidden company_website field must stay.
 */

interface Message {
  id: number
  from: string
  fromName: string
  subject: string
  date: string
  read: boolean
  body: string
}

const INBOX: Message[] = [
  {
    id: 1,
    fromName: "Sarah Johnson",
    from: "recruiter@techcompany.com",
    subject: "Interview Opportunity at TechCorp",
    date: "5/09/2025 9:14 AM",
    read: true,
    body: `Dear Portfolio Visitor,

Thank you for sharing your portfolio with us. Your projects demonstrate strong technical skills that align well with what we're looking for at TechCorp.

We would like to invite you for an initial interview to discuss your experience. Are you available next week for a video call?

Best regards,
Sarah Johnson
Technical Recruiter, TechCorp`,
  },
  {
    id: 2,
    fromName: "Michael Chen",
    from: "conference@webdev.org",
    subject: "Speaker Invitation: WebDev Summit 2025",
    date: "5/01/2025 2:38 PM",
    read: false,
    body: `Hello,

Based on your portfolio work, we would like to invite you to speak at the upcoming WebDev Summit 2025 in San Francisco, August 15-17.

Speakers receive a full conference pass, travel stipend and a place at the networking dinner.

Regards,
Michael Chen
WebDev Summit Organizer`,
  },
  {
    id: 3,
    fromName: "David Park",
    from: "david@startupfounders.net",
    subject: "Potential collaboration on new project",
    date: "4/25/2025 11:02 AM",
    read: false,
    body: `Hi there,

I came across your portfolio and was impressed, especially the Windows 95 interface. Very creative.

I'm the founder of a startup focused on nostalgic digital experiences and think your aesthetic sense would suit a project we're developing. Would you be interested in discussing it?

Best,
David Park
Founder, RetroDigital`,
  },
  {
    id: 4,
    fromName: "Alex Rivera",
    from: "mentor@techmentor.org",
    subject: "Feedback on your recent project",
    date: "4/15/2025 4:47 PM",
    read: false,
    body: `Hi,

I reviewed the project you shared last week and I'm impressed. The Windows 95 portfolio is technically sound and shows real attention to detail.

A few suggestions: consider keyboard shortcuts for power users, and think about Easter eggs, which would suit the retro theme.

Keep up the excellent work.

Alex Rivera
Senior Developer Mentor`,
  },
]

type FolderId = "inbox" | "outbox" | "sent" | "deleted" | "drafts"

const FOLDERS: { id: FolderId; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "/images/win95/folder-closed-16.png" },
  { id: "outbox", label: "Outbox", icon: "/images/win95/folder-closed-16.png" },
  { id: "sent", label: "Sent Items", icon: "/images/win95/folder-closed-16.png" },
  { id: "deleted", label: "Deleted Items", icon: "/images/win95/recycle-empty-16.png" },
  { id: "drafts", label: "Drafts", icon: "/images/win95/folder-closed-16.png" },
]

/** Toolbar button: large glyph over a label, as Outlook Express had. */
function ToolButton({
  label,
  glyph,
  onClick,
  disabled,
}: {
  label: string
  glyph: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-[62px] flex-col items-center gap-[1px] border-2 border-transparent px-1 py-[2px] text-[10px] leading-none enabled:hover:border-t-white enabled:hover:border-l-white enabled:hover:border-r-[#404040] enabled:hover:border-b-[#404040] enabled:active:border-t-[#404040] enabled:active:border-l-[#404040] enabled:active:border-r-white enabled:active:border-b-white disabled:text-[#808080]"
    >
      <span className="text-[18px] leading-none">{glyph}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

export default function Contact() {
  const [folder, setFolder] = useState<FolderId>("inbox")
  const [messages, setMessages] = useState<Message[]>(INBOX)
  const [selected, setSelected] = useState<number | null>(INBOX[0].id)
  const [composing, setComposing] = useState(false)
  const [sent, setSent] = useState<Message[]>([])

  const [to] = useState("Joel Vasquez")
  const [subject, setSubject] = useState("")
  const [from, setFrom] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const shown = folder === "inbox" ? messages : folder === "sent" ? sent : []
  const current = shown.find((m) => m.id === selected) ?? null
  const unread = messages.filter((m) => !m.read).length

  const open = (id: number) => {
    setSelected(id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!from || !subject || !body) {
      setNotice({ ok: false, text: "Please fill out all fields." })
      return
    }
    try {
      setSubmitting(true)
      const result = await sendEmail(new FormData(e.currentTarget))
      setNotice({ ok: result.success, text: result.message })
      if (result.success) {
        setSent((prev) => [
          ...prev,
          {
            id: Date.now(),
            from,
            fromName: from,
            subject,
            date: new Date().toLocaleString(),
            read: true,
            body,
          },
        ])
        formRef.current?.reset()
        setSubject("")
        setFrom("")
        setBody("")
        setComposing(false)
      }
    } catch {
      setNotice({ ok: false, text: "An error occurred. Please email jfvasq1@gmail.com directly." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#c0c0c0]" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      {/* Menu bar */}
      <div className="flex gap-3 border-b border-[#808080] px-2 py-[2px] text-xs">
        {["File", "Edit", "View", "Go", "Tools", "Compose", "Help"].map((m) => (
          <span key={m}>
            <span className="underline">{m[0]}</span>
            {m.slice(1)}
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[#808080] px-1 py-1">
        <ToolButton label="Compose" glyph="✉" onClick={() => setComposing(true)} />
        <ToolButton label="Send/Recv" glyph="📨" onClick={() => setNotice({ ok: true, text: "No new messages." })} />
        <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
        <ToolButton label="Reply" glyph="↩" onClick={() => setComposing(true)} disabled={!current} />
        <ToolButton label="Reply All" glyph="↪" onClick={() => setComposing(true)} disabled={!current} />
        <ToolButton label="Forward" glyph="➡" disabled={!current} />
        <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
        <ToolButton
          label="Delete"
          glyph="🗑"
          disabled={!current}
          onClick={() => {
            if (!current) return
            setMessages((prev) => prev.filter((m) => m.id !== current.id))
            setSelected(null)
          }}
        />
        <ToolButton label="Address Book" glyph="📕" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree */}
        <div className="w-[170px] shrink-0 overflow-auto border-r border-[#808080] bg-white p-1">
          <div className="flex items-center gap-1 text-xs font-bold">
            <img src="/images/win95/computer-16.png" alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
            Outlook Express
          </div>
          <div className="ml-3 mt-1 flex items-center gap-1 text-xs">
            <img src="/images/win95/folder-open-16.png" alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
            Local Folders
          </div>
          <ul className="ml-6">
            {FOLDERS.map((f) => {
              const count = f.id === "inbox" ? unread : f.id === "sent" ? 0 : 0
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFolder(f.id)
                      setSelected(null)
                    }}
                    className={`flex w-full items-center gap-1 px-1 text-left text-xs ${
                      folder === f.id ? "bg-[#000080] text-white" : "text-black"
                    }`}
                  >
                    <img src={f.icon} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
                    <span className={count ? "font-bold" : ""}>
                      {f.label}
                      {count ? ` (${count})` : ""}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Message list over preview pane */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div data-list className="h-[40%] overflow-auto border-b border-[#808080] bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["From", "Subject", "Received"].map((h) => (
                    <th
                      key={h}
                      className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-1 py-[1px] text-left font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-xs text-[#808080]">
                      There are no items in this view.
                    </td>
                  </tr>
                ) : (
                  shown.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => open(m.id)}
                      className={`cursor-default ${selected === m.id ? "bg-[#000080] text-white" : "text-black"} ${
                        m.read ? "" : "font-bold"
                      }`}
                    >
                      <td className="px-1">{m.fromName}</td>
                      <td className="px-1">{m.subject}</td>
                      <td className="whitespace-nowrap px-1">{m.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div data-preview className="flex-1 overflow-auto bg-white">
            {current ? (
              <>
                <div className="border-b border-[#808080] bg-[#c0c0c0] px-2 py-1 text-xs">
                  <div>
                    <strong>From:</strong> {current.fromName} &lt;{current.from}&gt;
                  </div>
                  <div>
                    <strong>Date:</strong> {current.date}
                  </div>
                  <div>
                    <strong>To:</strong> Joel Vasquez
                  </div>
                  <div>
                    <strong>Subject:</strong> {current.subject}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap p-2 text-xs" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
                  {current.body}
                </pre>
              </>
            ) : (
              <p className="p-2 text-xs text-[#808080]">No message selected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[2px] text-xs">
        <span data-status>
          {shown.length} message(s), {unread} unread
        </span>
        {notice && <span className={notice.ok ? "" : "text-[#800000]"}>{notice.text}</span>}
      </div>

      {/* Compose opens as its own window, as it did in Outlook Express */}
      {composing && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-6">
          <div className="w-[92%] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[4px_4px_10px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between bg-[#000080] px-2 py-[3px]">
              <span className="text-xs font-bold text-white">New Message</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setComposing(false)}
                className="flex h-4 w-4 items-center justify-center border border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
              >
                <CloseIcon />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Honeypot: hidden from real users, so a filled value means a bot. */}
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
              />

              <div className="flex items-center gap-1 border-b border-[#808080] px-1 py-1">
                <ToolButton label="Send" glyph="📤" />
                <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
                <ToolButton label="Cut" glyph="✂" />
                <ToolButton label="Copy" glyph="⧉" />
                <ToolButton label="Paste" glyph="📋" />
                <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
                <ToolButton label="Attach" glyph="📎" />
              </div>

              <div className="p-2">
                {[
                  ["To:", to, null],
                  ["From:", from, setFrom],
                  ["Subject:", subject, setSubject],
                ].map(([label, value, setter]) => (
                  <div key={label as string} className="mb-1 flex items-center">
                    <span className="w-14 text-xs">{label as string}</span>
                    <input
                      type="text"
                      name={label === "From:" ? "from" : label === "Subject:" ? "subject" : "to"}
                      aria-label={(label as string).replace(":", "")}
                      readOnly={!setter}
                      value={value as string}
                      onChange={setter ? (e) => (setter as (v: string) => void)(e.target.value) : undefined}
                      required={Boolean(setter)}
                      className={`flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-1 text-xs outline-none ${
                        setter ? "bg-white" : "bg-[#c0c0c0]"
                      }`}
                    />
                  </div>
                ))}

                <textarea
                  name="message"
                  aria-label="Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={10}
                  className="mt-1 w-full resize-none border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-1 text-xs outline-none"
                />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs">Include your name so I can get back to you.</span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
                  >
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
