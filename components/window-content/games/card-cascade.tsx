"use client"

import { useEffect, useRef } from "react"

/**
 * The winning cascade from Windows 95 Solitaire.
 *
 * Cards launch off the foundations one at a time, fall under gravity and bounce
 * off the bottom of the table. The canvas is never cleared between frames, so
 * each card smears a ribbon of copies down the screen and the table slowly
 * fills up. That smear is the whole effect: the original did it because
 * erasing was expensive, and it became the most recognisable animation of the
 * era. Clicking cuts it short, exactly as it did in 1995.
 */

type Suit = "hearts" | "diamonds" | "clubs" | "spades"

export type CascadeCard = {
  suit: Suit
  rank: string
  id: string
}

const CARD_W = 64
const CARD_H = 96

// Pixels per second. The originals were tuned per-frame at 60Hz; these are the
// same numbers scaled up so the motion is identical on any refresh rate.
const GRAVITY = 1500
const BOUNCE = 0.78
const LAUNCH_INTERVAL = 0.16

const SYMBOL: Record<Suit, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }

/** Draws one card face onto its own canvas so the loop can blit it cheaply. */
function renderFace(card: CascadeCard): HTMLCanvasElement {
  const face = document.createElement("canvas")
  face.width = CARD_W
  face.height = CARD_H
  const ctx = face.getContext("2d")
  if (!ctx) return face

  const red = card.suit === "hearts" || card.suit === "diamonds"
  const ink = red ? "#ff0000" : "#000000"

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, CARD_W - 1, CARD_H - 1)

  ctx.fillStyle = ink
  ctx.font = "bold 12px 'MS Sans Serif', sans-serif"
  ctx.textBaseline = "top"
  ctx.fillText(card.rank, 4, 4)
  ctx.fillText(SYMBOL[card.suit], 4, 17)

  ctx.font = "26px 'MS Sans Serif', sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(SYMBOL[card.suit], CARD_W / 2, CARD_H / 2)

  // The mirrored corner, drawn by spinning the whole card half a turn.
  ctx.save()
  ctx.translate(CARD_W, CARD_H)
  ctx.rotate(Math.PI)
  ctx.font = "bold 12px 'MS Sans Serif', sans-serif"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(card.rank, 4, 4)
  ctx.fillText(SYMBOL[card.suit], 4, 17)
  ctx.restore()

  return face
}

type Flyer = { face: HTMLCanvasElement; x: number; y: number; vx: number; vy: number }

export default function CardCascade({
  cards,
  origins,
  onDone,
}: {
  /** Foundation piles, bottom card first. Cards launch from the top down. */
  cards: CascadeCard[][]
  /** Where each pile sits, in coordinates relative to this overlay. */
  origins: { x: number; y: number }[]
  onDone: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const finish = useRef(onDone)
  finish.current = onDone

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish.current()
      return
    }

    const width = parent.clientWidth
    const height = parent.clientHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Queue the piles top card first, cycling across the foundations the way
    // the original did rather than emptying one pile at a time.
    const piles = cards.map((pile, i) => ({ cards: [...pile].reverse(), origin: origins[i] ?? { x: 0, y: 0 } }))
    const queue: { card: CascadeCard; origin: { x: number; y: number } }[] = []
    for (let depth = 0; ; depth += 1) {
      const row = piles.filter((p) => p.cards[depth])
      if (row.length === 0) break
      for (const pile of row) queue.push({ card: pile.cards[depth], origin: pile.origin })
    }

    const flyers: Flyer[] = []
    let sinceLaunch = LAUNCH_INTERVAL
    let previous = performance.now()
    let frame = 0
    let stopped = false

    const stop = () => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(frame)
      finish.current()
    }

    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05)
      previous = now

      sinceLaunch += dt
      if (sinceLaunch >= LAUNCH_INTERVAL && queue.length > 0) {
        sinceLaunch = 0
        const next = queue.shift()!
        // Always thrown away from the nearer wall, so cards cross the table
        // instead of falling straight off the edge they started on.
        const toLeft = next.origin.x > width / 2
        const speed = 260 + Math.random() * 260
        flyers.push({
          face: renderFace(next.card),
          x: next.origin.x,
          y: next.origin.y,
          vx: toLeft ? -speed : speed,
          vy: -(60 + Math.random() * 180),
        })
      }

      for (let i = flyers.length - 1; i >= 0; i -= 1) {
        const f = flyers[i]
        f.vy += GRAVITY * dt
        f.x += f.vx * dt
        f.y += f.vy * dt

        const floor = height - CARD_H
        if (f.y > floor) {
          f.y = floor
          f.vy = -f.vy * BOUNCE
          // A card that has stopped bouncing would sit and vibrate, so give it
          // a last shove and let it slide off the table.
          if (Math.abs(f.vy) < 120) f.vy = -140
        }

        ctx.drawImage(f.face, Math.round(f.x), Math.round(f.y))

        if (f.x < -CARD_W || f.x > width) flyers.splice(i, 1)
      }

      if (queue.length === 0 && flyers.length === 0) {
        stop()
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    window.addEventListener("mousedown", stop)
    window.addEventListener("keydown", stop)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("mousedown", stop)
      window.removeEventListener("keydown", stop)
    }
  }, [cards, origins])

  return <canvas ref={canvasRef} data-cascade className="pointer-events-none absolute inset-0 z-40" />
}
