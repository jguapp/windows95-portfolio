# Icon attribution

The icons in this directory come from [`@react95/icons`](https://github.com/React95/React95),
an openly licensed Windows 95 icon recreation set, used under the MIT License.

They were extracted as static assets rather than pulled in as a runtime
dependency, so the site ships only the icons it actually uses (27 files, 14 KB)
instead of the full set of 1,537.

Each is an original 16x16 or 32x32 bitmap at 16 colours. They are not resized,
which is why they stay crisp with `image-rendering: pixelated` where a
downscaled large PNG would look soft.

Four are exceptions. Reversi shipped with Windows 3.1 but the set has no tile
for it, and Chess, Tetris and Pong never shipped with Windows at all, so
`reversi-32.png`, `chess-32.png`, `tetris-32.png` and `pong-32.png` are original
artwork drawn for this project on the same 32x32 grid at 16 colours.

`charmap-32.png`, `charmap-16.png`, `cdplayer-32.png`, `phone-32.png`,
`hyperterm-32.png` and `defrag-32.png` are from the `@react95/icons` npm
package, version 2.5.3 (MIT), which extracts the original Windows 95 icon
resources: Charmap1, Cdplayer107, Dialer1, Dpmodemx701 and Defrag. They
replaced drawings made for this project that never matched the set.

```
MIT License

Copyright (c) React95

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## From Yuteoctober/wins95Portfolio (MIT)

`winamp-32.png`, `contact-32.png`, `contact-16.png`
and the Clippy animation frames in `../clippy/` and the start menu sidebar
`../blob/sidebar95.png` are from
https://github.com/Yuteoctober/wins95Portfolio, MIT licensed.

## From 1j01/98

`ie-32.png`, `ie-16.png`, `wordpad-32.png`, `mediaplayer-32.png`,
`soundrec-32.png` and `scandisk-32.png` are from https://github.com/1j01/98, the
open-source Windows 98 recreation.

## Wallpapers

The patterns in `../wallpapers/` named after the Windows 95 wallpaper set
(Black Thatch, Blue Rivets, Bubbles, Carved Stone, Egypt, Houndstooth,
Metal Links, Pinstripe, Red Blocks, Sandstone, Straw Mat, Tiles, Triangles)
are drawn imitations generated from scripted geometry for this project. They
are not Microsoft's bitmap files and were not derived from them.

## GitHub mark

`../blob/github.png` is the Simple Icons GitHub glyph (CC0), rasterised at
24x24 with every pixel hardened to full black or transparent so it stays
crisp at the menu's display size. GitHub's mark remains a GitHub trademark,
used here to link to GitHub.

## Battle sprites

The twelve creature sprites in the hidden battle are derived from front
battlers in the Tuxemon project (https://github.com/Tuxemon/Tuxemon),
CC BY-SA 4.0: nuenflu, eskipup, pythwire, pigabyte, corvix, tadcool,
trojerror, fluttaflap, waysprite, gupphish, chillimp and xeon, credited
per monster in the project's ATTRIBUTIONS.md and wiki, including
josepharaoh99 (Pigabyte), Catch Challenger (Corvix), Spalding004
(Fluttaflap), Chickenshowman (Chillimp) and Redshrike (Xeon). Each was
trimmed, fitted to a 28x28 grid and quantised to four Game Boy tones;
the derived grids in components/pokemon-roster.ts remain CC BY-SA 4.0.
