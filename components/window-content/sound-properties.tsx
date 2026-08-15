"use client"

import { useEffect, useState } from "react"
import { getVolume, isMuted, play, setMuted, setVolume, subscribeVolume, type SfxName } from "@/lib/sound"

/**
 * Sound Properties, the Sounds control panel.
 *
 * The desktop carries a synthesised sound scheme that nothing surfaced: you
 * could hear it only by tripping the events. This lists the scheme the way
 * the Sounds applet did, an event per row with a preview, over the same
 * volume and mute the tray slider drives, so the two controls always agree.
 */

/** The scheme, named as Windows named its events. */
const EVENTS: { label: string; sfx: SfxName }[] = [
  { label: "Asterisk", sfx: "ding" },
  { label: "Critical Stop", sfx: "chord" },
  { label: "Question", sfx: "question" },
  { label: "Exclamation", sfx: "exclamation" },
  { label: "Start Windows", sfx: "startup" },
  { label: "Open program", sfx: "windowOpen" },
  { label: "Close program", sfx: "windowClose" },
  { label: "Minimize", sfx: "minimize" },
  { label: "Maximize", sfx: "maximize" },
  { label: "Empty Recycle Bin", sfx: "emptyBin" },
  { label: "Menu command", sfx: "select" },
]

export default function SoundProperties() {
  const [selected, setSelected] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMutedState] = useState(false)

  // Mirror the shared audio store, so the tray and this window agree.
  useEffect(() => {
    const sync = () => {
      setVolumeState(getVolume())
      setMutedState(isMuted())
    }
    sync()
    return subscribeVolume(sync)
  }, [])

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0] p-3"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-sound-properties
    >
      <fieldset className="mb-3 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-3 pb-3">
        <legend className="px-1">Events</legend>
        <div className="h-[220px] overflow-auto border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
          <ul className="list-none">
            {EVENTS.map((event, i) => (
              <li key={event.sfx}>
                <button
                  type="button"
                  data-sound-event={event.sfx}
                  onClick={() => setSelected(i)}
                  onDoubleClick={() => play(event.sfx)}
                  className={`flex w-full items-center gap-2 px-2 py-[2px] text-left ${
                    selected === i ? "bg-[#000080] text-white" : "text-black"
                  }`}
                >
                  <img
                    src="/images/blob/sound.png"
                    alt=""
                    className="h-4 w-4 object-contain"
                  />
                  {event.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex-1">Preview:</span>
          <button
            type="button"
            data-sound-preview
            onClick={() => play(EVENTS[selected].sfx)}
            className="min-w-[92px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            &#9658; <span className="underline">P</span>lay
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-3 pb-3">
        <legend className="px-1">Volume</legend>
        <div className="flex items-center gap-3 pt-1">
          <span>Low</span>
          <input
            type="range"
            data-sound-volume
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            aria-label="Scheme volume"
            onChange={(e) => {
              setVolume(Number(e.target.value) / 100)
              if (muted) setMuted(false)
            }}
            className="flex-1"
          />
          <span>High</span>
        </div>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            data-sound-mute
            checked={muted}
            onChange={(e) => {
              setMuted(e.target.checked)
              if (!e.target.checked) play("click")
            }}
          />
          <span className="underline">M</span>ute all sounds
        </label>
      </fieldset>

      <p className="mt-2 text-[#404040]">
        Every sound is synthesised in the browser. The scheme ships no recordings.
      </p>
    </div>
  )
}
