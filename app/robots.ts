import type { MetadataRoute } from "next"

/** Everything is crawlable; there is only the one page to crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://builtbyjoel.dev/sitemap.xml",
  }
}
