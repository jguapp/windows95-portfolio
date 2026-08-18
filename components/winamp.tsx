"use client"

import { useEffect, useRef } from "react"

/**
 * The owner's fifteen, as listed on the profile: artist, title, seconds.
 *
 * The length is carried here because the repository ships silent
 * placeholders under these names, and Webamp reads a file's real duration:
 * with nothing supplied every track listed as 0:01, which told you only
 * that the recording was missing. These are the standard album-version
 * lengths, so the playlist reads like a playlist before anything is
 * installed. Drop a real recording in and its own duration takes over once
 * the file loads, so an alternate cut corrects itself.
 */
const PLAYLIST: [string, string, number][] = [
  ["The Smiths", "Please Please Please Let Me Get What You Want", 1 * 60 + 52],
  ["The Strokes", "Ode to the Mets", 5 * 60 + 51],
  ["Jeff Buckley", "Lover, You Should've Come Over", 6 * 60 + 43],
  ["Radiohead", "Fake Plastic Trees", 4 * 60 + 50],
  ["Mac Miller", "The Spins", 3 * 60 + 22],
  ["Frank Ocean", "Nights", 5 * 60 + 7],
  ["Anderson .Paak", "Heart Don't Stand a Chance", 3 * 60 + 54],
  ["Faye Webster", "A Dream With a Baseball Player", 3 * 60 + 20],
  ["Stevie Wonder", "Isn't She Lovely", 6 * 60 + 34],
  ["Mazzy Star", "Halah", 3 * 60 + 22],
  ["Michael Jackson", "Wanna Be Startin' Somethin'", 6 * 60 + 3],
  ["Fleetwood Mac", "Gypsy", 4 * 60 + 24],
  ["Tame Impala", "Feel Like We Only Go Backwards", 3 * 60 + 12],
  ["Mac DeMarco", "This Old Dog", 2 * 60 + 31],
  ["Elliott Smith", "Waltz #2 (XO)", 4 * 60 + 40],
]


/**
 * Winamp, the real one.
 *
 * Webamp is a faithful reimplementation of Winamp 2.9 that renders the actual
 * skin engine in the browser. It is the one dependency on this desktop that
 * was taken rather than built, because a pixel-correct Winamp is a project on
 * its own and the library is MIT-licensed and maintained.
 *
 * The library is imported only when the window is first opened, so its weight
 * is paid by the visitor who asked for it rather than by everyone.
 *
 * Every track is a drop-in slot: the repository ships silent placeholders
 * under the exact filenames, so the titles and lengths always list, and
 * overwriting a file with the real recording is the whole installation.
 * Visitors can also drop their own MP3s straight onto the playlist, which
 * Webamp supports natively.
 */
interface WinampProps {
  onClose: () => void
}

export default function Winamp({ onClose }: WinampProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    let webamp: { dispose: () => void } | null = null
    let disposed = false

    ;(async () => {
      const { default: Webamp } = await import("webamp")
      if (disposed) return

      // The playlist: the owner's actual taste, every entry a drop-in slot.
      const instance = new Webamp({
        initialTracks: PLAYLIST.map(([artist, title, duration], i) => ({
          metaData: { artist, title },
          /*
            encodeURIComponent, not encodeURI: a title like Waltz #2 puts a
            # in the filename, encodeURI preserves # as a fragment marker,
            and the browser would truncate the request right there.
          */
          url: `/audio/winamp/${encodeURIComponent(`${String(i + 1).padStart(2, "0")} - ${artist} - ${title}.mp3`)}`,
          duration,
        })),
      })
      webamp = instance
      instance.onClose(() => onCloseRef.current())
      if (containerRef.current) await instance.renderWhenReady(containerRef.current)
    })()

    return () => {
      disposed = true
      webamp?.dispose()
    }
  }, [])

  // Webamp renders its own draggable windows inside this container. The
  // container itself must not eat the desktop's clicks, so it is inert while
  // everything Webamp puts inside it accepts them again.
  return (
    <div
      ref={containerRef}
      data-winamp
      className="pointer-events-none fixed inset-0 z-[500] [&_#webamp]:pointer-events-auto"
    />
  )
}
