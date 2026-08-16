"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { bumpVisitors } from "@/actions/visitors"

/**
 * Internet Explorer, and the internet as it was.
 *
 * Modern sites refuse to be framed, so typing an address does not load
 * today's web. It loads the Internet Archive's snapshot of that address from
 * 1996, which is both allowed and better: microsoft.com arrives with its
 * grey background and its Best Viewed In badge. The Wayback Machine sends no
 * frame-blocking headers, so the pages render inside the window.
 *
 * A few built-in pages remain: the home page, the WebRing, the search page.
 * Input that is not an address at all still gets the grey "page cannot be
 * displayed" screen.
 */

interface Site {
  title: string
  render: (go: (url: string) => void) => React.ReactNode
}

const LINK = "cursor-pointer text-[#0000ee] underline"

/**
 * The hit counter, counting for real: one bump per page view, stored beside
 * the guestbook. Zero-padded to six digits because that is the law.
 */

/*
  One bump per view, even when React mounts twice.

  StrictMode runs mount effects twice in development, which counted every
  view as two. Concurrent mounts inside a short window share one in-flight
  request instead; a second page view a moment later still counts.
*/
let bumpInFlight: Promise<number> | null = null
function bumpOnce(): Promise<number> {
  if (!bumpInFlight) {
    bumpInFlight = bumpVisitors()
    setTimeout(() => {
      bumpInFlight = null
    }, 1000)
  }
  return bumpInFlight
}

function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let live = true
    bumpOnce().then((n) => {
      if (live) setCount(n)
    })
    return () => {
      live = false
    }
  }, [])
  return (
    <p className="mb-2 text-sm">
      You are visitor number:{" "}
      <span data-visitor-count className="border border-[#808080] bg-black px-2 font-mono text-[#00ff00]">
        {count === null ? "......" : String(count).padStart(6, "0")}
      </span>
    </p>
  )
}

const SITES: Record<string, Site> = {
  "http://www.joel95.net/": {
    title: "Joel's Home Page",
    render: (go) => (
      <div className="min-h-full bg-[#c0c0c0] p-6 text-center" style={{ fontFamily: '"Times New Roman", serif' }}>
        <h1 className="mb-1 text-3xl font-bold text-[#000080]">Welcome to Joel's Home Page</h1>
        <p className="mb-4 text-sm">Est. 1995. Best viewed at 800x600 in 256 colours.</p>
        <hr className="mb-4 border-[#808080]" />
        <p className="mb-4">
          Hello, surfer! You have reached the personal home page of{" "}
          <strong>Joel Vasquez</strong>, Computer Science student and builder of the desktop you are
          sitting at right now.
        </p>
        <table className="mx-auto mb-4 border-2 border-[#808080] bg-white text-left text-sm">
          <tbody>
            <tr>
              <td className="border border-[#c0c0c0] px-3 py-1 font-bold">Hot links</td>
              <td className="border border-[#c0c0c0] px-3 py-1">
                <button type="button" className={LINK} onClick={() => go("http://www.webring.org/")}>
                  The Retro Computing WebRing
                </button>
              </td>
            </tr>
            <tr>
              <td className="border border-[#c0c0c0] px-3 py-1 font-bold">Guestbook</td>
              <td className="border border-[#c0c0c0] px-3 py-1">
                <button
                  type="button"
                  className={LINK}
                  onClick={() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "guestbook" } }))}
                >
                  Sign my guestbook!
                </button>
              </td>
            </tr>
            <tr>
              <td className="border border-[#c0c0c0] px-3 py-1 font-bold">Projects</td>
              <td className="border border-[#c0c0c0] px-3 py-1">
                <button
                  type="button"
                  className={LINK}
                  onClick={() => window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "projects" } }))}
                >
                  My software
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mb-3 text-sm">
          Or type any address up there. <strong>microsoft.com</strong>, <strong>yahoo.com</strong>,
          <strong> spacejam.com</strong>: the address bar serves the web as it looked in 1996,
          by way of the Internet Archive.
        </p>
        <VisitorCounter />
        <p className="text-xs text-[#404040]">This page is under construction. It always will be.</p>
      </div>
    ),
  },
  "http://www.webring.org/": {
    title: "Retro Computing WebRing",
    render: (go) => (
      <div className="min-h-full bg-[#ffffcc] p-6" style={{ fontFamily: '"Times New Roman", serif' }}>
        <h1 className="mb-3 text-center text-2xl font-bold">The Retro Computing WebRing</h1>
        <p className="mb-4 text-center text-sm">Linking the finest personal pages of the old web since 1996.</p>
        <div className="mx-auto mb-4 w-[420px] border-2 border-[#808080] bg-white p-3 text-center">
          <p className="mb-2 font-bold">This site is a proud member.</p>
          <p className="text-sm">
            [{" "}
            <button type="button" className={LINK} onClick={() => go("http://www.joel95.net/")}>
              Previous
            </button>{" "}
            | <span className="text-[#808080]">Random</span> |{" "}
            <button type="button" className={LINK} onClick={() => go("http://www.joel95.net/")}>
              Next
            </button>{" "}
            ]
          </p>
        </div>
        <p className="text-center text-xs">Sites with animated banners get 40% more traffic. This is known.</p>
      </div>
    ),
  },
  "http://www.search.com/": {
    title: "WebCrawler's Cousin",
    render: (go) => (
      <div className="min-h-full bg-white p-6 text-center" style={{ fontFamily: '"Times New Roman", serif' }}>
        <h1 className="mb-4 text-3xl font-bold">
          <span className="text-[#0000ff]">Web</span>
          <span className="text-[#ff0000]">Finder</span>
        </h1>
        <div className="mx-auto mb-3 w-[360px] border-2 border-[#808080] bg-white p-1">
          <input className="w-full px-1 outline-none" placeholder="Search the entire World Wide Web (all 40 sites)" />
        </div>
        <p className="text-sm">
          Feeling lucky? Try{" "}
          <button type="button" className={LINK} onClick={() => go("http://www.joel95.net/")}>
            joel95.net
          </button>
        </p>
      </div>
    ),
  },
}

/**
 * The home page: archived Yahoo, the page most people actually started at,
 * by the owner's preference. The preconnect below starts the archive's TLS
 * handshake the moment the window opens, which softens the wait, and
 * joel95.net stays one typed address away.
 */
const HOME = "http://www.yahoo.com/"

/** Normalises whatever was typed into something the site table might hold. */
function normalise(input: string): string {
  let url = input.trim().toLowerCase()
  if (!url) return url
  if (!/^https?:\/\//.test(url)) url = `http://${url}`
  if (!url.endsWith("/")) url += "/"
  return url
}

export default function InternetExplorer() {
  const [history, setHistory] = useState<string[]>([HOME])
  /** True from asking the archive for a page until its iframe finishes. */
  const [loading, setLoading] = useState(true)

  // Typed addresses go to the Wayback Machine; starting the TLS handshake
  // the moment the window opens shaves the slowest part off the first fetch.
  useEffect(() => {
    const link = document.createElement("link")
    link.rel = "preconnect"
    link.href = "https://web.archive.org"
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])
  const [at, setAt] = useState(0)
  const [typed, setTyped] = useState(HOME)

  const current = history[at]
  // The built-ins answer with or without www, as the real sites did.
  const site = SITES[current] ?? SITES[current.replace("http://", "http://www.")]
  /** Anything with a dot in its host is worth sending to the archive. */
  const isWebby = (url: string) => {
    try {
      return new URL(url).hostname.includes(".")
    } catch {
      return false
    }
  }
  const webby = !site && isWebby(current)
  const waybackSrc = `https://web.archive.org/web/1996/${current}`

  const go = useCallback(
    (url: string) => {
      const target = normalise(url)
      if (!target) return
      setHistory((h) => [...h.slice(0, at + 1), target])
      setAt((i) => i + 1)
      setTyped(target)
      const builtIn = SITES[target] ?? SITES[target.replace("http://", "http://www.")]
      setLoading(!builtIn)
    },
    [at],
  )

  const navTo = (index: number) => {
    setAt(index)
    setTyped(history[index])
    const url = history[index]
    setLoading(!(SITES[url] ?? SITES[url.replace("http://", "http://www.")]))
  }

  const back = () => {
    if (at > 0) navTo(at - 1)
  }
  const forward = () => {
    if (at < history.length - 1) navTo(at + 1)
  }

  const toolButton =
    "flex flex-col items-center px-2 py-[2px] border-2 border-transparent enabled:hover:border-t-white enabled:hover:border-l-white enabled:hover:border-r-[#404040] enabled:hover:border-b-[#404040] disabled:text-[#808080]"

  // A loaded page shows nothing in the status bar; only a failure speaks.
  const status = useMemo(
    () => (site || webby ? "" : "Cannot find server"),
    [site, webby],
  )

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-ie
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[#808080] px-1 py-[2px]">
        <button type="button" className={toolButton} onClick={back} disabled={at === 0} data-ie-back>
          <span aria-hidden>&#8678;</span>
          <span className="t9">Back</span>
        </button>
        <button
          type="button"
          className={toolButton}
          onClick={forward}
          disabled={at >= history.length - 1}
          data-ie-forward
        >
          <span aria-hidden>&#8680;</span>
          <span className="t9">Forward</span>
        </button>
        <button type="button" className={toolButton} onClick={() => go(current)} data-ie-refresh>
          <span aria-hidden>&#8635;</span>
          <span className="t9">Refresh</span>
        </button>
        <button type="button" className={toolButton} onClick={() => go(HOME)} data-ie-home>
          <span aria-hidden>&#8962;</span>
          <span className="t9">Home</span>
        </button>
      </div>

      {/* Address bar */}
      <form
        className="flex items-center gap-1 border-b border-[#808080] px-2 py-1"
        onSubmit={(e) => {
          e.preventDefault()
          go(typed)
        }}
      >
        <span>Address</span>
        <input
          data-ie-address
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px] outline-none"
          spellCheck={false}
        />
      </form>

      {/* Page */}
      <div className="relative flex-1 overflow-auto bg-white" data-ie-page>
        {site ? (
          site.render(go)
        ) : webby ? (
          <>
            {loading && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-6 py-4 text-center shadow-[2px_2px_6px_rgba(0,0,0,0.4)]">
                  <div className="mb-2 text-xs">Opening page from 1996...</div>
                  <div className="relative mx-auto h-[14px] w-[160px] overflow-hidden border border-[#808080] bg-white shadow-[inset_1px_1px_#404040]">
                    <div className="ie-progress-chunk absolute top-[2px] h-[10px] w-[40px] bg-[#000080]" />
                  </div>
                  <style>{`
                    .ie-progress-chunk { animation: ie-progress 1.2s linear infinite; }
                    @keyframes ie-progress { from { left: -40px } to { left: 160px } }
                  `}</style>
                </div>
              </div>
            )}
            <iframe
              onLoad={() => setLoading(false)}
            key={current}
            data-ie-frame
            src={waybackSrc}
            title="The World Wide Web, 1996"
            className="h-full w-full border-0"
          />
          </>
        ) : (
          <div className="p-8" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
            <h1 className="mb-3 text-xl font-bold">The page cannot be displayed</h1>
            <p className="mb-3">
              The page you are looking for is currently unavailable. The Web site might be
              experiencing technical difficulties, or you may need to adjust your browser settings.
              Or it is 2026 and this browser only carries its own little internet.
            </p>
            <hr className="mb-3 border-[#808080]" />
            <p className="mb-1 text-sm">Please try the following:</p>
            <ul className="list-disc pl-6 text-sm">
              <li>
                Click the{" "}
                <button type="button" className={LINK} onClick={() => go(current)}>
                  Refresh
                </button>{" "}
                button, which will not help.
              </li>
              <li>
                Go{" "}
                <button type="button" className={LINK} onClick={() => go(HOME)}>
                  home
                </button>
                , which will.
              </li>
            </ul>
            <p className="mt-4 text-sm text-[#808080]">HTTP 404 - File not found
              <br />
              Internet Explorer</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex border-t border-white bg-[#c0c0c0] px-2 py-[2px]">
        <span data-ie-status className="flex-1">{status}</span>
        <span>Internet zone</span>
      </div>
    </div>
  )
}
