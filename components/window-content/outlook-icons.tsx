"use client"

/**
 * Outlook Express toolbar icons.
 *
 * The toolbar used emoji, which are the wrong shape, the wrong colours and a
 * different design on every platform: 📕 for the address book is a maroon
 * textbook on one machine and an orange one on another, and neither looks like
 * anything Microsoft shipped. These are drawn on a pixel grid, so they are the
 * same everywhere and sit correctly beside MS Sans Serif.
 */

const grid = {
  shapeRendering: "crispEdges" as const,
  "aria-hidden": true,
  focusable: false,
}

const Frame = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" {...grid}>
    {children}
  </svg>
)

/** A closed envelope, the base of half the toolbar. */
const envelope = (x = 1, y = 4, w = 18, h = 12, face = "#ffffff") => (
  <>
    <rect x={x} y={y} width={w} height={h} fill={face} stroke="#000000" />
    <path d={`M${x} ${y} L${x + w / 2} ${y + h / 2} L${x + w} ${y}`} fill="none" stroke="#000000" />
  </>
)

export function ComposeIcon() {
  return (
    <Frame>
      {envelope(0, 5, 15, 10)}
      {/* A pencil across the corner. */}
      <rect x="13" y="2" width="2" height="8" fill="#ffcc00" transform="rotate(-45 14 6)" />
      <rect x="13" y="1" width="2" height="2" fill="#808080" transform="rotate(-45 14 2)" />
    </Frame>
  )
}

export function SendReceiveIcon() {
  return (
    <Frame>
      {envelope(0, 6, 14, 10)}
      {/* Up and down arrows, which is what send and receive together mean. */}
      <rect x="15" y="4" width="2" height="9" fill="#008000" />
      <path d="M13 6 L16 2 L19 6 Z" fill="#008000" />
      <rect x="15" y="13" width="2" height="4" fill="#008000" />
    </Frame>
  )
}

export function ReplyIcon() {
  return (
    <Frame>
      {envelope(4, 6, 15, 10)}
      <path d="M8 3 L2 8 L8 13 Z" fill="#0000c0" />
      <rect x="6" y="7" width="4" height="2" fill="#0000c0" />
    </Frame>
  )
}

export function ReplyAllIcon() {
  return (
    <Frame>
      {envelope(6, 6, 13, 10)}
      <path d="M8 2 L2 7 L8 12 Z" fill="#0000c0" />
      <path d="M12 6 L6 11 L12 16 Z" fill="#4040ff" />
    </Frame>
  )
}

export function ForwardIcon() {
  return (
    <Frame>
      {envelope(0, 6, 14, 10)}
      <path d="M12 3 L18 8 L12 13 Z" fill="#008000" />
      <rect x="10" y="7" width="4" height="2" fill="#008000" />
    </Frame>
  )
}

export function DeleteIcon() {
  return (
    <Frame>
      {/* A waste basket: tapered body, lid, and three ribs. */}
      <rect x="5" y="2" width="10" height="2" fill="#000000" />
      <rect x="8" y="0" width="4" height="2" fill="#000000" />
      <path d="M5 5 L15 5 L13 18 L7 18 Z" fill="#c0c0c0" stroke="#000000" />
      <rect x="8" y="7" width="1" height="9" fill="#808080" />
      <rect x="11" y="7" width="1" height="9" fill="#808080" />
    </Frame>
  )
}

export function AddressBookIcon() {
  return (
    <Frame>
      {/* A bound book with a tabbed edge and a card showing. */}
      <rect x="3" y="1" width="14" height="18" fill="#c00000" stroke="#000000" />
      <rect x="6" y="1" width="11" height="18" fill="#ffffff" stroke="#000000" />
      <rect x="3" y="1" width="3" height="18" fill="#800000" stroke="#000000" />
      {/* Index tabs down the fore edge. */}
      <rect x="17" y="4" width="2" height="3" fill="#0000c0" />
      <rect x="17" y="9" width="2" height="3" fill="#008000" />
      <rect x="17" y="14" width="2" height="3" fill="#c0c000" />
      {/* A head and shoulders on the visible page. */}
      <rect x="10" y="5" width="3" height="3" fill="#000000" />
      <path d="M8 14 C8 10, 15 10, 15 14 Z" fill="#000000" />
    </Frame>
  )
}

export function SendIcon() {
  return (
    <Frame>
      {envelope(0, 5, 14, 10)}
      {/* Flying off to the right. */}
      <path d="M13 4 L19 9 L13 14 Z" fill="#0000c0" />
    </Frame>
  )
}

export function CutIcon() {
  return (
    <Frame>
      {/* Scissors: two blades crossing over two finger loops. */}
      <rect x="9" y="2" width="2" height="9" fill="#808080" transform="rotate(-14 10 6)" />
      <rect x="9" y="2" width="2" height="9" fill="#c0c0c0" stroke="#000000" transform="rotate(14 10 6)" />
      <circle cx="6" cy="15" r="3" fill="none" stroke="#000000" strokeWidth="2" />
      <circle cx="14" cy="15" r="3" fill="none" stroke="#000000" strokeWidth="2" />
    </Frame>
  )
}

export function CopyIcon() {
  return (
    <Frame>
      {/* Two sheets, the front one offset. */}
      <rect x="3" y="2" width="10" height="13" fill="#ffffff" stroke="#000000" />
      <rect x="7" y="5" width="10" height="13" fill="#ffffff" stroke="#000000" />
      <rect x="9" y="8" width="6" height="1" fill="#808080" />
      <rect x="9" y="11" width="6" height="1" fill="#808080" />
      <rect x="9" y="14" width="4" height="1" fill="#808080" />
    </Frame>
  )
}

export function PasteIcon() {
  return (
    <Frame>
      {/* A clipboard with its clip and a sheet on it. */}
      <rect x="3" y="3" width="14" height="16" fill="#c08040" stroke="#000000" />
      <rect x="6" y="6" width="8" height="12" fill="#ffffff" stroke="#000000" />
      <rect x="7" y="1" width="6" height="4" fill="#808080" stroke="#000000" />
      <rect x="8" y="9" width="4" height="1" fill="#808080" />
      <rect x="8" y="12" width="4" height="1" fill="#808080" />
    </Frame>
  )
}

export function AttachIcon() {
  return (
    <Frame>
      {/* A paperclip. */}
      <path
        d="M13 4 L13 14 A3 3 0 0 1 7 14 L7 5 A2 2 0 0 1 11 5 L11 13"
        fill="none"
        stroke="#404040"
        strokeWidth="2"
      />
    </Frame>
  )
}

/** Row markers. Outlook Express showed a sealed envelope beside unread mail and
 *  an opened one beside mail you had already looked at. */
export function MailUnreadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" {...grid}>
      <rect x="1" y="4" width="14" height="9" fill="#ffffff" stroke="#000000" />
      <path d="M1 4 L8 9 L15 4" fill="none" stroke="#000000" />
    </svg>
  )
}

export function MailReadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" {...grid}>
      <rect x="1" y="6" width="14" height="7" fill="#ffffff" stroke="#808080" />
      {/* Flap thrown back, so the envelope reads as opened. */}
      <path d="M1 6 L8 1 L15 6" fill="#e0e0e0" stroke="#808080" />
    </svg>
  )
}
