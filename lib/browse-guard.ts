/**
 * Guards for the page proxy behind Internet Explorer.
 *
 * The browser refuses to frame most of the web: sites send X-Frame-Options
 * or a frame-ancestors policy and there is nothing client-side that gets
 * around it. Showing a real page therefore means fetching it on the server
 * and serving it from this origin, which turns the site into something that
 * will fetch any URL a stranger hands it. That is a server-side request
 * forgery engine unless it is fenced in, so the fencing lives here, apart
 * from the route, where it can be tested without a network.
 *
 * Everything in this file is pure. The route does the DNS and the fetching.
 */

/** Only the two schemes and the two ports a browser would have used. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])
const ALLOWED_PORTS = new Set(["", "80", "443"])

/** How much of a page is worth reading before calling it hostile. */
export const MAX_BYTES = 2_000_000
/** How long to wait on a slow host. */
export const TIMEOUT_MS = 10_000
/** How many hops to follow, each one re-checked. */
export const MAX_REDIRECTS = 3

export type TargetResult = { ok: true; url: URL } | { ok: false; reason: string }

/**
 * Parses and vets a URL typed into the address bar.
 *
 * @param raw What the visitor typed, with or without a scheme.
 * @returns The parsed URL, or why it was refused.
 */
export function parseTarget(raw: string): TargetResult {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return { ok: false, reason: "No address given." }
  if (trimmed.length > 2048) return { ok: false, reason: "That address is too long." }

  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `http://${trimmed}`)
  } catch {
    return { ok: false, reason: "That is not an address." }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return { ok: false, reason: "Only http and https are supported." }
  if (!ALLOWED_PORTS.has(url.port)) return { ok: false, reason: "Only ports 80 and 443 are supported." }
  if (!url.hostname.includes(".")) return { ok: false, reason: "That host does not look like a site." }
  // Credentials in a URL would be forwarded to whoever the host resolves to.
  if (url.username || url.password) return { ok: false, reason: "Addresses with credentials are refused." }

  return { ok: true, url }
}

/**
 * True for an address the proxy must never be pointed at.
 *
 * The danger is not the hostname but where it resolves: a public name can
 * answer with 127.0.0.1 or a cloud metadata address, which is how a proxy
 * gets used to read things only the server can reach. Every hop is checked
 * against this after its DNS lookup, not just the first.
 *
 * @param ip A resolved IPv4 or IPv6 address.
 */
export function isBlockedAddress(ip: string): boolean {
  const address = ip.trim().toLowerCase()
  if (!address) return true

  // IPv4, including the ::ffff: form an IPv6 stack reports for v4 hosts.
  const v4 = address.startsWith("::ffff:") ? address.slice(7) : address
  const octets = v4.split(".")
  if (octets.length === 4 && octets.every((o) => /^\d{1,3}$/.test(o))) {
    const [a, b] = octets.map(Number)
    if (octets.some((o) => Number(o) > 255)) return true
    if (a === 0) return true // this network
    if (a === 10) return true // private
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local, and cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    if (a === 192 && b === 0) return true // IETF protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
    if (a >= 224) return true // multicast, reserved, broadcast
    return false
  }

  // IPv6.
  if (address === "::" || address === "::1") return true // unspecified, loopback
  if (address.startsWith("fe80")) return true // link-local
  if (address.startsWith("fc") || address.startsWith("fd")) return true // unique local
  if (address.startsWith("ff")) return true // multicast
  if (address.startsWith("2002:") || address.startsWith("64:ff9b")) return true // v4 mapping games
  return false
}

/**
 * Rewrites a fetched page so it can be shown safely in the frame.
 *
 * Three jobs. A base element so the page's own images and stylesheets load
 * from where they really live, since only framing is blocked and assets are
 * not. Every script removed, along with inline handlers and frame-busting,
 * because a 1996 browser had no business running a modern page's JavaScript
 * and because not running it is what makes third-party HTML safe to show.
 * And links pointed back through the proxy, so following one stays inside
 * the window instead of escaping to the real web.
 *
 * @param html The page as fetched.
 * @param finalUrl Where it was actually fetched from, after redirects.
 * @param proxyPath The route that serves this proxy.
 */
export function rewritePage(html: string, finalUrl: URL, proxyPath = "/api/browse"): string {
  let out = html

  // Scripts, in every form that would execute.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
  out = out.replace(/<script\b[^>]*\/?>/gi, "")
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, "")
  // Inline handlers: on<name>= with quoted or bare values.
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
  // javascript: URLs, which survive attribute stripping.
  out = out.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
  // A page's own frame-blocking meta tag is not ours to obey twice.
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?(x-frame-options|content-security-policy)[^>]*>/gi, "")

  // Anchors point back through the proxy so navigation stays in the window.
  out = out.replace(/<a\b([^>]*?)href\s*=\s*(["'])(.*?)\2/gi, (match, before, quote, href) => {
    const target = String(href).trim()
    if (!target || target.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(target)) return match
    try {
      const absolute = new URL(target, finalUrl)
      if (!ALLOWED_PROTOCOLS.has(absolute.protocol)) return match
      return `<a${before}href=${quote}${proxyPath}?url=${encodeURIComponent(absolute.href)}${quote}`
    } catch {
      return match
    }
  })

  // Forms would post to the real site from inside the frame; neutralise them.
  out = out.replace(/<form\b[^>]*>/gi, "<form onsubmit=\"return false\">")

  const base = `<base href="${finalUrl.href.replace(/"/g, "&quot;")}">`
  if (/<head\b[^>]*>/i.test(out)) return out.replace(/<head\b[^>]*>/i, (m) => `${m}${base}`)
  return `${base}${out}`
}
