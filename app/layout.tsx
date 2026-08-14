import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

const siteUrl = "https://builtbyjoel.dev"

/** Set by Vercel on its own deployments, and by nothing else. */
const onVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)
const title = "joel.codes() // human-readable"
const description =
  "Joel Vasquez's portfolio, rebuilt as a working Windows 95 desktop — draggable windows, a Start menu, MS Paint, and five playable classic games."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    type: "website",
    // Image comes from app/opengraph-image.tsx via the file convention.
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    // The Windows 95 flag, lifted from the wallpaper the desktop already
    // ships, so the tab carries the logo rather than a generic mark.
    icon: [
      { url: "/win95-flag-16.png", sizes: "16x16", type: "image/png" },
      { url: "/win95-flag-32.png", sizes: "32x32", type: "image/png" },
      { url: "/win95-flag-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/win95-flag-180.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/ms-sans-serif.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-['MS_Sans_Serif',sans-serif]">
        <Suspense>
          {children}
          {/*
            Only on Vercel. The analytics component asks for
            /_vercel/insights/script.js, which is served by Vercel's edge and
            exists nowhere else, so running the site locally or anywhere else
            filled the console with a 404, a MIME-type refusal and a failed
            request on every single page load.
          */}
          {onVercel && <Analytics />}
        </Suspense>
      </body>
    </html>
  )
}
