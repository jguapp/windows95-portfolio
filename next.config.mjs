const isDev = process.env.NODE_ENV === "development"

// Next injects inline bootstrap/hydration scripts and styled-components emits
// inline <style> tags, so 'unsafe-inline' is required here. The directives that
// do real work for a site like this are frame-ancestors, object-src and
// base-uri. 'unsafe-eval' is dev-only (React Refresh needs it).
// Wallpapers, desktop icons and game audio are served from Vercel blob storage.
const BLOB_HOSTS = "https://*.public.blob.vercel-storage.com https://v0.blob.com"

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${BLOB_HOSTS}`,
  `media-src 'self' data: blob: ${BLOB_HOSTS}`,
  `connect-src 'self' https://api.web3forms.com ${BLOB_HOSTS}`,
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
}

export default nextConfig
