const isDev = process.env.NODE_ENV === "development"

// Next injects inline bootstrap/hydration scripts and styled-components emits
// inline <style> tags, so 'unsafe-inline' is required here. The directives that
// do real work for a site like this are frame-ancestors, object-src and
// base-uri. 'unsafe-eval' is dev-only (React Refresh needs it).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self' https://api.web3forms.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
  webpack(config) {
    // webpack's default xxhash64 runs through a WASM module whose buffer
    // handling crashes on Node 22+ once the input crosses a size threshold:
    // "TypeError: Cannot read properties of undefined (reading 'length')" from
    // WasmHash._updateWithBuffer. Any sizeable addition to the project can
    // reach it. Node's own sha256 avoids the WASM path and costs little here.
    config.output.hashFunction = "sha256"
    return config
  },
}

export default nextConfig
