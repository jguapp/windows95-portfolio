import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

// Flat config rather than `next lint`, which is deprecated and removed in
// Next 16. Run with `eslint .` (see the "lint" script).
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The copy throughout the site is prose full of apostrophes ("I'm",
      // "Joel's"). Escaping every one to &apos; makes the JSX harder to read
      // and catches nothing real here.
      "react/no-unescaped-entities": "off",

      // The desktop deliberately uses raw <img> for pixel-art icons: they are
      // tiny, need image-rendering: pixelated, and next/image is a no-op while
      // images.unoptimized is set. Left on, this fires ~150 times and buries
      // every other warning.
      "@next/next/no-img-element": "off",
    },
  },
]

export default eslintConfig
