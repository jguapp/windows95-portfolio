/**
 * The page proxy's guards, checked without a network.
 *
 * These are the rules that stop /api/browse being a server-side request
 * forgery engine, so they are driven directly against the real module: a
 * failure here is a hole, whatever a browser happens to render. Node runs
 * the TypeScript source with its own type stripping, so there is no build
 * step between the check and the code it is checking.
 */
const { execFileSync } = require("child_process")
const { join } = require("path")
const { pathToFileURL } = require("url")

const ok = (l, c, e = "") => console.log(`  ${c ? "PASS" : "FAIL"}  ${l}${e ? "  " + e : ""}`)

const guardUrl = pathToFileURL(join(process.cwd(), "lib", "browse-guard.ts")).href

const probe = `
import(${JSON.stringify(guardUrl)}).then((m) => {
  const results = {}
  const blocked = ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254",
    "0.0.0.0", "::1", "fe80::1", "fd00::1", "100.64.0.1", "224.0.0.1", "::ffff:127.0.0.1"]
  const publicOnes = ["8.8.8.8", "93.184.216.34", "1.1.1.1", "2606:4700::1111"]
  results.leaked = blocked.filter((ip) => !m.isBlockedAddress(ip))
  results.overblocked = publicOnes.filter((ip) => m.isBlockedAddress(ip))

  const refuse = ["file:///etc/passwd", "javascript:alert(1)", "http://localhost:22",
    "http://user:pass@example.com/", "", "data:text/html,x", "http://example.com:8080/"]
  const accept = ["example.com", "http://example.com/", "https://example.com/a?b=c"]
  results.allowedThrough = refuse.filter((u) => m.parseTarget(u).ok)
  results.wronglyRefused = accept.filter((u) => !m.parseTarget(u).ok)

  const source = "<html><head></head><body>" +
    "<scr" + "ipt>evil()</scr" + "ipt>" +
    '<img onerror="evil()" src=x>' +
    '<a href="/next">n</a>' +
    '<a href="javascript:evil()">j</a>' +
    '<form action="/post"></form>' +
    "</body></html>"
  results.html = m.rewritePage(source, new URL("https://example.com/dir/page"))
  console.log("RESULT " + JSON.stringify(results))
}).catch((e) => { console.log("ERR " + e.message); process.exit(1) })
`

let results
try {
  const out = execFileSync(process.execPath, ["--experimental-strip-types", "-e", probe], {
    encoding: "utf-8",
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  })
  const line = out.split("\n").find((l) => l.startsWith("RESULT "))
  if (!line) throw new Error(out.slice(0, 300))
  results = JSON.parse(line.slice(7))
} catch (err) {
  console.log("SCRIPT ERROR " + String(err.stdout || err.message).slice(0, 400))
  process.exit(1)
}

ok("every private and reserved address is blocked", results.leaked.length === 0, results.leaked.join(", "))
ok("ordinary public addresses still resolve", results.overblocked.length === 0, results.overblocked.join(", "))
ok("dangerous URLs are refused", results.allowedThrough.length === 0, results.allowedThrough.join(", "))
ok("ordinary URLs are accepted", results.wronglyRefused.length === 0, results.wronglyRefused.join(", "))

const html = results.html
ok("scripts are stripped", !/<script/i.test(html))
ok("inline handlers are stripped", !/onerror/i.test(html))
ok("javascript: links are defused", !/href="javascript:/i.test(html))
ok("a base element is injected", /<base href="https:\/\/example\.com\/dir\/page">/.test(html))
ok(
  "links route back through the proxy",
  html.includes("/api/browse?url=https%3A%2F%2Fexample.com%2Fnext"),
  html.slice(0, 0),
)
ok("forms are neutralised", /<form onsubmit="return false">/.test(html))

console.log("  (guards checked without touching the network)")
