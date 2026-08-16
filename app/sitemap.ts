import type { MetadataRoute } from "next"

/**
 * The sitemap.
 *
 * The site is one route: the desktop. Everything else is a window inside
 * it, which no crawler can reach and none should be told about. One honest
 * entry beats a list of URLs that do not exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://builtbyjoel.dev",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
