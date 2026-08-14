"use client"

import { useCallback, useMemo, useState } from "react"

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
        <p className="mb-2 text-sm">
          You are visitor number: <span className="border border-[#808080] bg-black px-2 font-mono text-[#00ff00]">013847</span>
        </p>
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

const HOME = "http://www.joel95.net/"

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
  const [at, setAt] = useState(0)
  const [typed, setTyped] = useState(HOME)

  const current = history[at]
  const site = SITES[current]
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
    },
    [at],
  )

  const back = () => {
    if (at > 0) {
      setAt(at - 1)
      setTyped(history[at - 1])
    }
  }
  const forward = () => {
    if (at < history.length - 1) {
      setAt(at + 1)
      setTyped(history[at + 1])
    }
  }

  const toolButton =
    "flex flex-col items-center px-2 py-[2px] border-2 border-transparent enabled:hover:border-t-white enabled:hover:border-l-white enabled:hover:border-r-[#404040] enabled:hover:border-b-[#404040] disabled:text-[#808080]"

  const status = useMemo(
    () => (site ? "Done" : webby ? "Opening page from 1996..." : "Cannot find server"),
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
      <div className="flex-1 overflow-auto bg-white" data-ie-page>
        {site ? (
          site.render(go)
        ) : webby ? (
          <iframe
            key={current}
            data-ie-frame
            src={waybackSrc}
            title="The World Wide Web, 1996"
            className="h-full w-full border-0"
          />
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
