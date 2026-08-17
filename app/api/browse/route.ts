import { lookup } from "node:dns/promises"
import { NextResponse } from "next/server"

import {
  MAX_BYTES,
  MAX_REDIRECTS,
  TIMEOUT_MS,
  isBlockedAddress,
  parseTarget,
  rewritePage,
} from "@/lib/browse-guard"
import { rateLimit } from "@/lib/rate-limit"

/**
 * The page proxy behind Internet Explorer.
 *
 * Real sites cannot be framed: they send X-Frame-Options or a
 * frame-ancestors policy, the browser enforces it, and no client-side trick
 * gets around it. So the page is fetched here and served from this origin,
 * with its scripts stripped and its links pointed back through this route.
 *
 * That makes this an endpoint that fetches whatever URL it is handed, which
 * is worth being careful about:
 *
 *   - Only http and https, only ports 80 and 443, no credentials in the URL.
 *   - Every hostname is resolved and the address checked before the socket
 *     is opened, and every redirect is re-resolved and re-checked, because a
 *     public name that answers with 127.0.0.1 is the whole SSRF trick.
 *   - Redirects are followed by hand, at most three.
 *   - Ten seconds, two megabytes, then it gives up.
 *   - Rate limited per address, since this spends someone else's bandwidth.
 *   - Nothing is forwarded from the visitor: no cookies, no auth header, no
 *     referrer. The proxy is not logged into anything and cannot be.
 *   - The response carries a CSP that forbids scripts, and the frame that
 *     shows it is sandboxed without allow-same-origin, so the page lands in
 *     an opaque origin and cannot read anything of this site's.
 */

export const runtime = "nodejs"

const MAX_PAGES = 40
const WINDOW_MS = 5 * 60 * 1000

/** The page IE shows when the proxy will not fetch something. */
function refusal(reason: string, status = 400) {
  const body = `<!doctype html><meta charset="utf-8"><title>Cannot find server</title>
<style>body{font-family:"MS Sans Serif",sans-serif;padding:2rem;background:#fff;color:#000}
h1{font-size:1.25rem;margin:0 0 .75rem}hr{border:0;border-top:1px solid #808080;margin:1rem 0}
p{margin:.5rem 0;font-size:.9rem}</style>
<h1>The page cannot be displayed</h1>
<p>${reason.replace(/[<>&]/g, "")}</p><hr>
<p>Try another address, or one of the built-in pages from Favorites.</p>`
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      "x-robots-tag": "noindex",
    },
  })
}

/** Resolves a hostname and refuses anything pointing somewhere private. */
async function addressIsSafe(hostname: string): Promise<boolean> {
  try {
    const records = await lookup(hostname, { all: true })
    if (records.length === 0) return false
    return records.every((record) => !isBlockedAddress(record.address))
  } catch {
    return false
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

export async function GET(request: Request) {
  const limit = rateLimit(`browse:${clientIp(request)}`, MAX_PAGES, WINDOW_MS)
  if (!limit.allowed) {
    return refusal("Too many pages requested. Give it a minute.", 429)
  }

  const raw = new URL(request.url).searchParams.get("url") ?? ""
  const target = parseTarget(raw)
  if (!target.ok) return refusal(target.reason)

  let current = target.url
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await addressIsSafe(current.hostname))) {
        return refusal("That address cannot be reached from here.")
      }

      const response = await fetch(current.href, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          // A period user agent, and nothing of the visitor's.
          "user-agent": "Mozilla/4.0 (compatible; MSIE 3.0; Windows 95)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-US,en;q=0.9",
        },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location) return refusal("That page redirected to nowhere.")
        if (hop === MAX_REDIRECTS) return refusal("That page redirected too many times.")
        try {
          current = new URL(location, current)
        } catch {
          return refusal("That page redirected somewhere unreadable.")
        }
        // The loop re-resolves and re-checks the new host before fetching it.
        continue
      }

      if (!response.ok) return refusal(`The server said ${response.status}.`, 502)

      const type = response.headers.get("content-type") ?? ""
      if (!type.includes("html")) {
        return refusal("That address is not a web page this browser can show.")
      }

      // Read to the cap rather than trusting content-length.
      const reader = response.body?.getReader()
      if (!reader) return refusal("That page sent nothing.")
      const chunks: Uint8Array[] = []
      let total = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > MAX_BYTES) {
          await reader.cancel()
          return refusal("That page is too large for this browser.")
        }
        chunks.push(value)
      }

      const merged = new Uint8Array(total)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.byteLength
      }
      const html = new TextDecoder("utf-8").decode(merged)

      return new NextResponse(rewritePage(html, current), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          // Belt and braces with the sandboxed frame: no scripts, no frames
          // of its own, and nothing may be sent anywhere.
          "content-security-policy":
            "default-src 'none'; img-src * data:; style-src * 'unsafe-inline'; font-src * data:; frame-ancestors 'self'",
          "referrer-policy": "no-referrer",
          "x-robots-tag": "noindex",
          "cache-control": "public, max-age=300",
        },
      })
    }
    return refusal("That page redirected too many times.")
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError"
    return refusal(aborted ? "That server took too long to answer." : "That server could not be reached.", 504)
  } finally {
    clearTimeout(timer)
  }
}
