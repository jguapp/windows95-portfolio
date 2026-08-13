"use client"

import type React from "react"

/**
 * Playing cards, shared by the card games.
 *
 * Windows 95 drew its cards as 71x96 bitmaps with a hard black outline, a rank
 * and pip in the top-left corner, the same pair mirrored in the bottom-right,
 * and a large pip in the middle. Everything here is drawn rather than shipped
 * as images so the cards scale cleanly and cost nothing to load.
 */

export type Suit = "clubs" | "diamonds" | "hearts" | "spades"

export interface Card {
  /** Stable across a deal, so React keys and animations survive a re-render. */
  id: string
  suit: Suit
  /** 1 is an ace, 11 to 13 are jack, queen and king. */
  rank: number
}

export const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"]

export const SUIT_SYMBOL: Record<Suit, string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
}

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds"
}

export function rankLabel(rank: number): string {
  if (rank === 1) return "A"
  if (rank === 11) return "J"
  if (rank === 12) return "Q"
  if (rank === 13) return "K"
  return String(rank)
}

export function cardId(rank: number, suit: Suit): string {
  return `${rankLabel(rank)}-${suit}`
}

/** A full deck in a fixed order. Shuffling is the caller's business. */
export function orderedDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) deck.push({ id: cardId(rank, suit), suit, rank })
  }
  return deck
}

/** Fisher-Yates, seeded by nothing in particular. */
export function shuffled(deck: Card[]): Card[] {
  const out = [...deck]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const CARD_W = 71
export const CARD_H = 96

const FACE_GLYPH: Record<number, string> = { 11: "J", 12: "Q", 13: "K" }

/**
 * One card.
 *
 * `width` scales the whole thing, so a game can shrink its tableau without
 * every size inside the card needing its own prop.
 */
export function PlayingCard({
  card,
  faceUp = true,
  selected = false,
  dimmed = false,
  width = CARD_W,
  className = "",
  style,
  onClick,
  onDoubleClick,
  onMouseDown,
  title,
}: {
  card: Card
  faceUp?: boolean
  selected?: boolean
  /** Drawn greyed, for a card that cannot legally be moved right now. */
  dimmed?: boolean
  width?: number
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  title?: string
}) {
  const scale = width / CARD_W
  const height = CARD_H * scale
  const ink = isRed(card.suit) ? "#d40000" : "#000000"
  const symbol = SUIT_SYMBOL[card.suit]

  const base: React.CSSProperties = {
    width,
    height,
    borderRadius: 4 * scale,
    border: "1px solid #000",
    boxSizing: "border-box",
    position: "relative",
    userSelect: "none",
    ...style,
  }

  if (!faceUp) {
    return (
      <div
        data-card={card.id}
        data-face="down"
        className={className}
        style={{
          ...base,
          // The blue hatched back, drawn as two crossing gradients.
          backgroundColor: "#00007b",
          backgroundImage:
            "repeating-linear-gradient(45deg, #4a4ac8 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, #4a4ac8 0 2px, transparent 2px 5px)",
          boxShadow: `inset 0 0 0 ${Math.max(2, 3 * scale)}px #ffffff`,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        title={title}
      />
    )
  }

  const corner: React.CSSProperties = {
    position: "absolute",
    lineHeight: 0.95,
    fontFamily: '"MS Sans Serif", Arial, sans-serif',
    fontWeight: "bold",
    color: ink,
    textAlign: "center",
  }

  return (
    <div
      data-card={card.id}
      data-face="up"
      className={className}
      style={{
        ...base,
        backgroundColor: dimmed ? "#e4e4e4" : "#ffffff",
        opacity: dimmed ? 0.72 : 1,
        boxShadow: selected ? `0 0 0 ${Math.max(2, 2 * scale)}px #000080` : undefined,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      title={title ?? `${rankLabel(card.rank)} of ${card.suit}`}
    >
      <div style={{ ...corner, top: 3 * scale, left: 4 * scale, fontSize: 13 * scale }}>
        {rankLabel(card.rank)}
        <div style={{ fontSize: 12 * scale }}>{symbol}</div>
      </div>

      <div
        style={{
          ...corner,
          bottom: 3 * scale,
          right: 4 * scale,
          fontSize: 13 * scale,
          transform: "rotate(180deg)",
        }}
      >
        {rankLabel(card.rank)}
        <div style={{ fontSize: 12 * scale }}>{symbol}</div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ink,
          fontSize: (card.rank >= 11 ? 26 : 30) * scale,
          fontWeight: "bold",
          fontFamily: '"MS Sans Serif", Arial, sans-serif',
        }}
      >
        {FACE_GLYPH[card.rank] ?? symbol}
      </div>
    </div>
  )
}

/** The outline left where a card could go. */
export function CardSlot({
  width = CARD_W,
  label,
  highlight = false,
  className = "",
  style,
  onClick,
  children,
  ...rest
}: {
  width?: number
  /** Faint glyph in the middle, for a foundation waiting on a suit. */
  label?: string
  highlight?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
  children?: React.ReactNode
} & Record<string, unknown>) {
  const scale = width / CARD_W
  return (
    <div
      className={className}
      style={{
        width,
        height: CARD_H * scale,
        borderRadius: 4 * scale,
        border: `1px solid ${highlight ? "#ffffff" : "rgba(255,255,255,0.45)"}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.5)",
        fontSize: 26 * scale,
        position: "relative",
        ...style,
      }}
      onClick={onClick}
      {...rest}
    >
      {children ?? label}
    </div>
  )
}
