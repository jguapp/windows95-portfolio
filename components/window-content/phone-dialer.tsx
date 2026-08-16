"use client"

import { useState } from "react"
import { play } from "@/lib/sound"

/**
 * Phone Dialer.
 *
 * The applet that dialled a number through your modem so you could pick
 * up the handset. This one has one number in its speed dial, and dialling
 * it opens the calendar where a call would actually be booked.
 */

const CALENDLY = "https://calendly.com/jfvasq1/30min"

/** The DTMF pair each key sounded, which is why dialling had a tune. */
const KEYS: [string, number, number][] = [
  ["1", 697, 1209],
  ["2", 697, 1336],
  ["3", 697, 1477],
  ["4", 770, 1209],
  ["5", 770, 1336],
  ["6", 770, 1477],
  ["7", 852, 1209],
  ["8", 852, 1336],
  ["9", 852, 1477],
  ["*", 941, 1209],
  ["0", 941, 1336],
  ["#", 941, 1477],
]

export default function PhoneDialer() {
  const [number, setNumber] = useState("")
  const [status, setStatus] = useState("Ready to dial.")
  const [dialling, setDialling] = useState(false)

  /** A real DTMF pair: two sine tones together, briefly. */
  const tone = (low: number, high: number) => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      const gain = ctx.createGain()
      gain.gain.value = 0.06
      gain.connect(ctx.destination)
      for (const freq of [low, high]) {
        const osc = ctx.createOscillator()
        osc.type = "sine"
        osc.frequency.value = freq
        osc.connect(gain)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      }
      window.setTimeout(() => ctx.close().catch(() => {}), 400)
    } catch {
      // No audio is a quiet phone, not a broken one.
    }
  }

  const press = (key: string, low: number, high: number) => {
    setNumber((n) => (n.length >= 16 ? n : n + key))
    tone(low, high)
  }

  const dial = () => {
    if (dialling) return
    setDialling(true)
    setStatus("Dialling...")
    play("click")
    window.setTimeout(() => setStatus("Ringing..."), 900)
    window.setTimeout(() => {
      setStatus("Connected. Opening the calendar so you can book a real one.")
      setDialling(false)
      window.open(CALENDLY, "_blank", "noopener,noreferrer")
    }, 2000)
  }

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-3 text-xs"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-dialer
    >
      <label className="mb-1 block">Number to dial:</label>
      <input
        data-dialer-number
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/[^0-9*#-]/g, ""))}
        className="mb-3 w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
      />

      <div className="mb-3 flex gap-3">
        <div className="grid grid-cols-3 gap-1" data-dialer-pad>
          {KEYS.map(([key, low, high]) => (
            <button
              key={key}
              type="button"
              data-key={key}
              onClick={() => press(key, low, high)}
              className="h-[26px] w-[34px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="mb-1 font-bold">Speed dial</div>
          <button
            type="button"
            data-speed-dial
            onClick={() => {
              setNumber("1-212-555-0195")
              setStatus("Joel's line. Press Dial.")
            }}
            className="w-full border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-2 py-[3px] text-left active:border-t-[#404040] active:border-l-[#404040]"
          >
            1 &nbsp;Joel Vasquez
          </button>
        </div>
      </div>

      <div data-dialer-status className="mb-3 flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-2">
        {status}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          data-dial
          onClick={dial}
          disabled={dialling || number.length === 0}
          className="h-[23px] min-w-[80px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          Dial
        </button>
        <button
          type="button"
          onClick={() => {
            setNumber("")
            setStatus("Ready to dial.")
          }}
          className="h-[23px] min-w-[80px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] active:border-t-[#404040] active:border-l-[#404040]"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
