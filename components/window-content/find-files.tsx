"use client"

import { useEffect, useState } from "react"
import { getRoot, subscribe, type FsDir } from "@/lib/filesystem"

/**
 * Find: Files or Folders, searching the drive that actually exists.
 *
 * The Windows 95 layout: a Named field, a Containing text field, Find Now and
 * Stop, and a results list that fills in below. The search walks the virtual
 * C: drive from lib/filesystem, so anything Notepad or DOS has written is
 * findable the moment it lands.
 */

interface Hit {
  name: string
  /** The containing folder, printed the way the era printed it. */
  folder: string
  kind: "file" | "dir"
  size: number
  opens?: string
  modified?: string
}

/** Walks the tree collecting matches on name and, when asked, file bodies. */
function search(root: FsDir, named: string, containing: string): Hit[] {
  const name = named.trim().toLowerCase()
  const text = containing.trim().toLowerCase()
  if (!name && !text) return []

  const hits: Hit[] = []
  const walk = (dir: FsDir, path: string) => {
    for (const [entry, node] of Object.entries(dir.children)) {
      const nameMatch = !name || entry.toLowerCase().includes(name)
      if (node.kind === "dir") {
        if (nameMatch && !text) hits.push({ name: entry, folder: path, kind: "dir", size: 0 })
        walk(node, `${path}\\${entry}`)
      } else {
        const bodyMatch = !text || (node.body ?? "").toLowerCase().includes(text)
        if (nameMatch && bodyMatch) {
          hits.push({
            name: entry,
            folder: path,
            kind: "file",
            size: node.size,
            opens: node.opens,
            modified: node.modified,
          })
        }
      }
    }
  }
  walk(root, "C:")
  return hits
}

const iconFor = (hit: Hit) =>
  hit.kind === "dir"
    ? "/images/win95/folder-closed-16.png"
    : hit.opens === "notepad"
      ? "/images/win95/notepad-16.png"
      : "/images/win95/file-16.png"

export default function FindFiles() {
  const [named, setNamed] = useState("")
  const [containing, setContaining] = useState("")
  const [hits, setHits] = useState<Hit[] | null>(null)

  // A search already on screen re-runs if the drive changes underneath it,
  // so a file saved after the window opened is not invisible to it.
  useEffect(
    () =>
      subscribe(() => {
        setHits((prev) => (prev === null ? prev : search(getRoot(), named, containing)))
      }),
    [named, containing],
  )

  const run = () => setHits(search(getRoot(), named, containing))

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-find
    >
      <form
        className="border-b border-[#808080] p-3"
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="find-named" className="w-[110px]">
            <span className="underline">N</span>amed:
          </label>
          <input
            id="find-named"
            data-find-named
            value={named}
            onChange={(e) => setNamed(e.target.value)}
            autoFocus
            className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px] outline-none"
          />
          <button
            type="submit"
            data-find-now
            className="min-w-[92px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            <span className="underline">F</span>ind Now
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="find-text" className="w-[110px]">
            <span className="underline">C</span>ontaining text:
          </label>
          <input
            id="find-text"
            data-find-text
            value={containing}
            onChange={(e) => setContaining(e.target.value)}
            className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px] outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setNamed("")
              setContaining("")
              setHits(null)
            }}
            className="min-w-[92px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            New <span className="underline">S</span>earch
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="w-[110px]">Look in:</span>
          <span className="flex items-center gap-1">
            <img src="/images/win95/hard-disk-drive-16.png" alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
            (C:)
          </span>
        </div>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-auto bg-white">
        {hits === null ? (
          <div className="p-3 text-[#808080]">Enter a name or some text and choose Find Now.</div>
        ) : hits.length === 0 ? (
          <div className="p-3">There are no items to show. Your search found 0 files.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {["Name", "In Folder", "Size", "Modified"].map((h) => (
                  <th
                    key={h}
                    className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-2 py-[1px] text-left font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hits.map((hit) => (
                <tr
                  key={`${hit.folder}\\${hit.name}`}
                  data-find-hit
                  className="cursor-default hover:bg-[#000080] hover:text-white"
                  onDoubleClick={() => {
                    if (hit.opens) {
                      window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: hit.opens } }))
                    } else {
                      window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: "explorer" } }))
                    }
                  }}
                >
                  <td className="flex items-center gap-1 px-2 py-[2px]">
                    <img src={iconFor(hit)} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
                    {hit.name}
                  </td>
                  <td className="px-2 py-[2px]">{hit.folder}</td>
                  <td className="px-2 py-[2px]">{hit.kind === "dir" ? "" : `${(hit.size / 1024).toFixed(1)}KB`}</td>
                  <td className="px-2 py-[2px]">{hit.modified ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-white bg-[#c0c0c0] px-2 py-[3px]" data-find-status>
        {hits === null ? "Ready" : `${hits.length} file(s) found`}
      </div>
    </div>
  )
}
