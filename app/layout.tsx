import type React from "react"
import type { Metadata } from "next"
import { Press_Start_2P, VT323 } from "next/font/google"
import "./globals.css"

/*
  The two pixel faces, self-hosted.

  They used to be @imported from inside globals.css, where the browser
  cannot discover them until the stylesheet has parsed, so they blocked
  first paint and cost a round trip to Google. next/font downloads them at
  build time, serves them from this origin, and hands back a class that
  declares the family.
*/
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
})

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
})
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
  keywords: [
    "Joel Vasquez",
    "software engineer portfolio",
    "Windows 95",
    "Baruch College",
    "backend engineer",
    "interactive portfolio",
  ],
  authors: [{ name: "Joel Vasquez", url: siteUrl }],
  creator: "Joel Vasquez",
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
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
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
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
