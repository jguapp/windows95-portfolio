"use client"

import { useEffect, useRef, useState } from "react"
import { CloseIcon } from "@/components/win95-controls"

/**
 * Date/Time Properties, the dialog the taskbar clock opened on a double click.
 *
 * It is read only. The real one set the machine clock, which a web page has no
 * business doing and could not do anyway, so the fields show the browser's
 * clock and the OK button closes. Everything else is faithful: the month and
 * year pickers, the calendar grid with today boxed, the analogue face and the
 * time spinner beside it.
 */
interface DateTimePropertiesProps {
  onClose: () => void
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]

/** How many days a month has, leap years included. */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function DateTimeProperties({ onClose }: DateTimePropertiesProps) {
  const today = useRef(new Date())
  const [month, setMonth] = useState(today.current.getMonth())
  const [year, setYear] = useState(today.current.getFullYear())
  const [now, setNow] = useState(today.current)

  // The clock in the dialog ticks, as it did.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const firstWeekday = new Date(year, month, 1).getDay()
  const total = daysInMonth(year, month)
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number) =>
    day === today.current.getDate() &&
    month === today.current.getMonth() &&
    year === today.current.getFullYear()

  // The analogue face: hands as angles from twelve o'clock.
  const seconds = now.getSeconds()
  const minutes = now.getMinutes()
  const hours = now.getHours() % 12
  const hand = (turns: number, length: number, width: number, colour: string) => {
    const angle = turns * Math.PI * 2 - Math.PI / 2
    return (
      <line
        x1={50}
        y1={50}
        x2={50 + Math.cos(angle) * length}
        y2={50 + Math.sin(angle) * length}
        stroke={colour}
        strokeWidth={width}
        strokeLinecap="butt"
      />
    )
  }

  const two = (n: number) => String(n).padStart(2, "0")
  const hour12 = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30">
      <div
        data-datetime
        className="win95-type w-[400px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_8px_rgba(0,0,0,0.5)]"
        style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      >
        <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
          <span className="px-1 font-bold">Date/Time Properties</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-[16px] w-[16px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* The single tab. Time Zone was the other one and it did nothing here. */}
        <div className="px-2 pt-2">
          <div className="flex">
            <div className="border-2 border-b-0 border-t-white border-l-white border-r-[#404040] bg-[#c0c0c0] px-3 py-[2px]">
              Date &amp; Time
            </div>
          </div>
        </div>

        <div className="mx-2 mb-2 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-3">
          <div className="flex gap-4">
            {/* Date */}
            <div className="flex-1">
              <div className="mb-1">Date</div>
              <div className="mb-2 flex gap-1">
                <select
                  data-month
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  data-year
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || year)}
                  className="w-[64px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1"
                />
              </div>

              <table className="w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white">
                <thead>
                  <tr>
                    {DAY_INITIALS.map((d, i) => (
                      <th key={i} className="border-b border-[#808080] py-[1px] font-bold">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: cells.length / 7 }, (_, week) => (
                    <tr key={week}>
                      {cells.slice(week * 7, week * 7 + 7).map((day, i) => (
                        <td
                          key={i}
                          data-day={day ?? undefined}
                          data-today={day !== null && isToday(day) ? "" : undefined}
                          className={`py-[1px] text-center ${
                            day !== null && isToday(day) ? "bg-[#000080] text-white" : ""
                          }`}
                        >
                          {day ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Time */}
            <div className="flex w-[130px] flex-col items-center">
              <div className="mb-1 self-start">Time</div>
              <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#808080" strokeWidth="2" />
                {/* An hour mark every thirty degrees. */}
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 12) * Math.PI * 2 - Math.PI / 2
                  return (
                    <line
                      key={i}
                      x1={50 + Math.cos(a) * 40}
                      y1={50 + Math.sin(a) * 40}
                      x2={50 + Math.cos(a) * 45}
                      y2={50 + Math.sin(a) * 45}
                      stroke="#000000"
                      strokeWidth={i % 3 === 0 ? 3 : 1}
                    />
                  )
                })}
                {hand((hours + minutes / 60) / 12, 24, 4, "#000000")}
                {hand((minutes + seconds / 60) / 60, 36, 3, "#000000")}
                {hand(seconds / 60, 40, 1, "#c00000")}
                <circle cx="50" cy="50" r="3" fill="#000000" />
              </svg>
              <div
                data-time
                className="mt-2 w-full border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-2 py-[2px] text-center"
              >
                {`${two(hour12)}:${two(minutes)}:${two(seconds)} ${now.getHours() < 12 ? "AM" : "PM"}`}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-t-[#808080] pt-2">
            <span className="text-[#404040]">
              Current time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[76px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
