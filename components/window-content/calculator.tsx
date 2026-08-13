"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { messageBox } from "@/components/win95-dialog"

/**
 * Windows 95 Calculator, Standard and Scientific.
 *
 * Arithmetic runs through a small decimal helper rather than raw doubles. The
 * real Calculator was notable for 0.1 + 0.2 showing 0.3, and printing
 * 0.30000000000000004 would give the game away immediately.
 */

type Op = "+" | "-" | "*" | "/" | null
type Radix = "hex" | "dec" | "oct" | "bin"
type AngleUnit = "deg" | "rad" | "grad"

const DIGITS_BY_RADIX: Record<Radix, string> = {
  hex: "0123456789ABCDEF",
  dec: "0123456789",
  oct: "01234567",
  bin: "01",
}

const RADIX_BASE: Record<Radix, number> = { hex: 16, dec: 10, oct: 8, bin: 2 }

/** Round away the floating-point dust before display, as the original did. */
function clean(n: number): number {
  if (!Number.isFinite(n)) return n
  return Number.parseFloat(n.toPrecision(15))
}

function formatDec(n: number): string {
  if (!Number.isFinite(n)) return "Cannot divide by zero"
  const rounded = clean(n)
  if (Object.is(rounded, -0)) return "0"
  return String(rounded)
}

function formatRadix(n: number, radix: Radix): string {
  if (!Number.isFinite(n)) return "Cannot divide by zero"
  const i = Math.trunc(n)
  const s = (i < 0 ? -i : i).toString(RADIX_BASE[radix]).toUpperCase()
  return (i < 0 ? "-" : "") + s
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return Number.NaN
  if (n > 170) return Number.POSITIVE_INFINITY
  let out = 1
  for (let i = 2; i <= n; i++) out *= i
  return out
}

function toRadians(v: number, unit: AngleUnit): number {
  if (unit === "rad") return v
  if (unit === "grad") return (v * Math.PI) / 200
  return (v * Math.PI) / 180
}

function fromRadians(v: number, unit: AngleUnit): number {
  if (unit === "rad") return v
  if (unit === "grad") return (v * 200) / Math.PI
  return (v * 180) / Math.PI
}

/** A raised Windows 95 key. Colour follows the original: digits black,
 *  operators red, memory and clear keys their own reds. */
function Key({
  label,
  onClick,
  color = "#000080",
  wide = false,
  disabled = false,
  title,
}: {
  label: React.ReactNode
  onClick: () => void
  color?: string
  wide?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`h-[26px] ${wide ? "col-span-2" : ""} bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white disabled:text-[#808080] font-bold leading-none select-none`}
      style={{ color: disabled ? "#808080" : color }}
    >
      {label}
    </button>
  )
}

export default function Calculator() {
  const [mode, setMode] = useState<"standard" | "scientific">("standard")
  const [radix, setRadix] = useState<Radix>("dec")
  const [angle, setAngle] = useState<AngleUnit>("deg")
  const [inverse, setInverse] = useState(false)

  const [display, setDisplay] = useState("0")
  const [memory, setMemory] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Pending left operand and operator.
  const acc = useRef<number | null>(null)
  const pendingOp = useRef<Op>(null)
  // True while the next digit should start a fresh entry.
  const fresh = useRef(true)

  const shownValue = useCallback((): number => {
    if (radix === "dec") return Number.parseFloat(display) || 0
    const parsed = Number.parseInt(display.replace("-", ""), RADIX_BASE[radix])
    const n = Number.isNaN(parsed) ? 0 : parsed
    return display.startsWith("-") ? -n : n
  }, [display, radix])

  const show = useCallback(
    (n: number) => {
      setDisplay(radix === "dec" ? formatDec(n) : formatRadix(n, radix))
      setError(!Number.isFinite(n))
    },
    [radix],
  )

  const clearAll = useCallback(() => {
    acc.current = null
    pendingOp.current = null
    fresh.current = true
    setError(false)
    setDisplay("0")
  }, [radix])

  const clearEntry = useCallback(() => {
    fresh.current = true
    setError(false)
    setDisplay("0")
  }, [radix])

  const inputDigit = useCallback(
    (d: string) => {
      if (error) return
      if (!DIGITS_BY_RADIX[radix].includes(d)) return
      setDisplay((prev) => {
        if (fresh.current) {
          fresh.current = false
          return d
        }
        return prev === "0" ? d : prev + d
      })
    },
    [error, radix],
  )

  const inputPoint = useCallback(() => {
    if (error || radix !== "dec") return
    setDisplay((prev) => {
      if (fresh.current) {
        fresh.current = false
        return "0."
      }
      return prev.includes(".") ? prev : `${prev}.`
    })
  }, [error, radix])

  const backspace = useCallback(() => {
    if (error) return
    setDisplay((prev) => {
      const next = prev.slice(0, -1)
      return !next || next === "-" ? "0" : next
    })
  }, [error, radix])

  const applyPending = useCallback((right: number): number => {
    const left = acc.current
    const op = pendingOp.current
    if (left === null || op === null) return right
    switch (op) {
      case "+":
        return clean(left + right)
      case "-":
        return clean(left - right)
      case "*":
        return clean(left * right)
      case "/":
        return right === 0 ? Number.POSITIVE_INFINITY : clean(left / right)
    }
    return right
  }, [])

  const setOperator = useCallback(
    (op: Exclude<Op, null>) => {
      if (error) return
      const current = shownValue()
      const result = pendingOp.current !== null && !fresh.current ? applyPending(current) : current
      acc.current = result
      pendingOp.current = op
      fresh.current = true
      show(result)
    },
    [applyPending, error, show, shownValue],
  )

  const equals = useCallback(() => {
    if (error) return
    const result = applyPending(shownValue())
    acc.current = null
    pendingOp.current = null
    fresh.current = true
    show(result)
  }, [applyPending, error, show, shownValue])

  /** Unary keys act on the displayed value immediately. */
  const unary = useCallback(
    (fn: (v: number) => number) => {
      if (error) return
      const out = fn(shownValue())
      fresh.current = true
      show(out)
    },
    [error, show, shownValue],
  )

  const percent = useCallback(() => {
    if (error) return
    const left = acc.current ?? 0
    show(clean((left * shownValue()) / 100))
    fresh.current = true
  }, [error, show, shownValue])

  // Keyboard entry, which the original supported throughout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (/^[0-9]$/.test(k) || /^[a-fA-F]$/.test(k)) {
        inputDigit(k.toUpperCase())
      } else if (k === ".") inputPoint()
      else if (k === "+" || k === "-" || k === "*" || k === "/") setOperator(k)
      else if (k === "Enter" || k === "=") {
        e.preventDefault()
        equals()
      } else if (k === "Backspace") backspace()
      else if (k === "Escape") clearAll()
      else if (k === "Delete") clearEntry()
      else if (k === "%") percent()
      else return
      e.stopPropagation()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [backspace, clearAll, clearEntry, equals, inputDigit, inputPoint, percent, setOperator])

  // Switching radix re-renders the same value in the new base.
  const changeRadix = (next: Radix) => {
    const value = shownValue()
    setRadix(next)
    setDisplay(next === "dec" ? formatDec(value) : formatRadix(value, next))
    fresh.current = true
  }

  const memActive = memory !== null
  const digitDisabled = (d: string) => !DIGITS_BY_RADIX[radix].includes(d)

  const menus: Record<string, { label: string; action: () => void; checked?: boolean }[]> = {
    Edit: [
      { label: "Copy\tCtrl+C", action: () => navigator.clipboard?.writeText(display.replace(/\.$/, "")) },
      { label: "Paste\tCtrl+V", action: () => {} },
    ],
    View: [
      { label: "Standard", action: () => setMode("standard"), checked: mode === "standard" },
      { label: "Scientific", action: () => setMode("scientific"), checked: mode === "scientific" },
    ],
    Help: [{ label: "About Calculator", action: () => messageBox({ title: "About Calculator", text: "Calculator\n\nWindows 95 recreation.", icon: "information" }) }],
  }

  return (
    <div
      className="flex h-full w-full flex-col bg-[#c0c0c0] p-0 select-none"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
    >
      {/* Menu bar */}
      <div className="flex border-b border-[#808080] bg-[#c0c0c0] px-1" onMouseLeave={() => setOpenMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] text-xs ${openMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenMenu(openMenu === name ? null : name)}
              onMouseEnter={() => openMenu && setOpenMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[160px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center px-4 py-[2px] text-left text-xs hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      item.action()
                      setOpenMenu(null)
                    }}
                  >
                    <span className="mr-2 w-3">{item.checked ? "✓" : ""}</span>
                    {item.label.split("\t")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 p-2">
        {/* Display */}
        <div
          data-calc-display
          className="mb-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-2 py-1 text-right font-bold"
          style={{ fontSize: 16, minHeight: 26 }}
        >
          {error || radix !== "dec" || display.includes(".") ? display : `${display}.`}
        </div>

        {mode === "scientific" && (
          <>
            <div className="mb-1 flex gap-4 text-xs">
              {(["hex", "dec", "oct", "bin"] as Radix[]).map((r) => (
                <label key={r} className="flex items-center gap-1">
                  <input type="radio" checked={radix === r} onChange={() => changeRadix(r)} />
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </label>
              ))}
            </div>
            <div className="mb-1 flex gap-4 text-xs">
              {(["deg", "rad", "grad"] as AngleUnit[]).map((a) => (
                <label key={a} className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={angle === a}
                    disabled={radix !== "dec"}
                    onChange={() => setAngle(a)}
                  />
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </label>
              ))}
              <label className="ml-auto flex items-center gap-1">
                <input type="checkbox" checked={inverse} onChange={() => setInverse((v) => !v)} />
                Inv
              </label>
            </div>
          </>
        )}

        <div className="flex gap-1">
          {/* Memory column */}
          <div className="flex w-[36px] flex-col gap-1">
            <div className="h-[26px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#c0c0c0] text-center text-xs leading-[22px]">
              {memActive ? "M" : ""}
            </div>
            <Key label="MC" color="#800000" onClick={() => setMemory(null)} />
            <Key label="MR" color="#800000" onClick={() => memActive && show(memory as number)} />
            <Key label="MS" color="#800000" onClick={() => setMemory(shownValue())} />
            <Key label="M+" color="#800000" onClick={() => setMemory((m) => clean((m ?? 0) + shownValue()))} />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            {/* Back / CE / C sit above the pad, right-aligned as in the original */}
            <div className="grid grid-cols-3 gap-1">
              <Key label="Back" color="#800000" onClick={backspace} />
              <Key label="CE" color="#800000" onClick={clearEntry} />
              <Key label="C" color="#800000" onClick={clearAll} />
            </div>

            <div className="grid grid-cols-5 gap-1">
              {["7", "8", "9"].map((d) => (
                <Key key={d} label={d} disabled={digitDisabled(d)} onClick={() => inputDigit(d)} />
              ))}
              <Key label="/" color="#800000" onClick={() => setOperator("/")} />
              <Key label="sqrt" onClick={() => unary((v) => (v < 0 ? Number.NaN : clean(Math.sqrt(v))))} />

              {["4", "5", "6"].map((d) => (
                <Key key={d} label={d} disabled={digitDisabled(d)} onClick={() => inputDigit(d)} />
              ))}
              <Key label="*" color="#800000" onClick={() => setOperator("*")} />
              <Key label="%" onClick={percent} />

              {["1", "2", "3"].map((d) => (
                <Key key={d} label={d} disabled={digitDisabled(d)} onClick={() => inputDigit(d)} />
              ))}
              <Key label="-" color="#800000" onClick={() => setOperator("-")} />
              <Key label="1/x" onClick={() => unary((v) => (v === 0 ? Number.POSITIVE_INFINITY : clean(1 / v)))} />

              <Key label="0" disabled={digitDisabled("0")} onClick={() => inputDigit("0")} />
              <Key label="+/-" onClick={() => unary((v) => -v)} />
              <Key label="." disabled={radix !== "dec"} onClick={inputPoint} />
              <Key label="+" color="#800000" onClick={() => setOperator("+")} />
              <Key label="=" color="#800000" onClick={equals} />
            </div>
          </div>
        </div>

        {mode === "scientific" && (
          <div className="mt-1 grid grid-cols-6 gap-1">
            <Key
              label={inverse ? "asin" : "sin"}
              onClick={() =>
                unary((v) => (inverse ? clean(fromRadians(Math.asin(v), angle)) : clean(Math.sin(toRadians(v, angle)))))
              }
            />
            <Key
              label={inverse ? "acos" : "cos"}
              onClick={() =>
                unary((v) => (inverse ? clean(fromRadians(Math.acos(v), angle)) : clean(Math.cos(toRadians(v, angle)))))
              }
            />
            <Key
              label={inverse ? "atan" : "tan"}
              onClick={() =>
                unary((v) => (inverse ? clean(fromRadians(Math.atan(v), angle)) : clean(Math.tan(toRadians(v, angle)))))
              }
            />
            <Key label={inverse ? "10^x" : "log"} onClick={() => unary((v) => clean(inverse ? 10 ** v : Math.log10(v)))} />
            <Key label={inverse ? "e^x" : "ln"} onClick={() => unary((v) => clean(inverse ? Math.exp(v) : Math.log(v)))} />
            <Key label="n!" onClick={() => unary((v) => factorial(v))} />

            <Key label="x^2" onClick={() => unary((v) => clean(v * v))} />
            <Key label="x^3" onClick={() => unary((v) => clean(v ** 3))} />
            <Key
              label="pi"
              onClick={() => {
                fresh.current = true
                show(Math.PI)
              }}
            />
            <Key label="Not" onClick={() => unary((v) => ~Math.trunc(v))} />
            <Key label="Int" onClick={() => unary((v) => Math.trunc(v))} />
            <Key label="Exp" onClick={() => unary((v) => clean(Math.exp(v)))} />
          </div>
        )}
      </div>
    </div>
  )
}
