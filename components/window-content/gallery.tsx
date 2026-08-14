"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { eventCategories, galleryImages, type GalleryImage } from "./gallery-data"
import { CloseIcon } from "@/components/win95-controls"
import { messageBox } from "@/components/win95-dialog"

/**
 * The photo gallery, as Explorer in Thumbnail view.
 *
 * Windows 95 had no photo gallery, so this had to pick something to be, and it
 * was a modern grid with sort dropdowns and a slideshow bar. Explorer is the
 * honest answer: it reuses the file-manager chrome the rest of the shell uses
 * and puts the photos in C:\My Pictures, where they would have lived. Each
 * event is a subfolder, thumbnails carry filenames, and double-clicking one
 * opens it in a viewer window.
 */

/** Filenames are derived from the path, as a file manager would show them. */
function fileName(image: GalleryImage): string {
  return image.src.split("/").pop() ?? image.title
}

function folderOf(id: string): string {
  return eventCategories.find((c) => c.id === id)?.name ?? id
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })

type ViewMode = "thumbnails" | "large" | "list" | "details"

export default function Gallery() {
  /** The folder being shown; "all" is the root of My Pictures. */
  const [folder, setFolder] = useState("all")
  const [selected, setSelected] = useState<number | null>(null)
  const [opened, setOpened] = useState<number | null>(null)
  const [view, setView] = useState<ViewMode>("thumbnails")
  const [menu, setMenu] = useState<string | null>(null)
  const [slideshow, setSlideshow] = useState(false)
  const [history, setHistory] = useState<string[]>(["all"])
  const [historyIndex, setHistoryIndex] = useState(0)

  const folders = useMemo(() => eventCategories.filter((c) => c.id !== "all"), [])
  const shown = useMemo(
    () => galleryImages.filter((image) => folder === "all" || image.event === folder),
    [folder],
  )
  const current = opened !== null ? galleryImages.find((i) => i.id === opened) ?? null : null

  const navigate = (id: string) => {
    setFolder(id)
    setSelected(null)
    setHistory((h) => [...h.slice(0, historyIndex + 1), id])
    setHistoryIndex((i) => i + 1)
  }

  // The slideshow steps through whatever folder is open.
  useEffect(() => {
    if (!slideshow || shown.length === 0) return
    const timer = setInterval(() => {
      setOpened((prev) => {
        const at = shown.findIndex((i) => i.id === prev)
        return shown[(at + 1) % shown.length].id
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [slideshow, shown])

  useEffect(() => {
    if (slideshow && opened === null && shown.length > 0) setOpened(shown[0].id)
  }, [slideshow, opened, shown])

  /** Where the open photo sits in the folder, or -1 when nothing is open. */
  const position = opened === null ? -1 : shown.findIndex((i) => i.id === opened)

  /**
   * Step through the open folder, wrapping at both ends.
   *
   * @param by -1 for the previous photo, 1 for the next one.
   */
  const step = useCallback(
    (by: number) => {
      setOpened((prev) => {
        if (prev === null || shown.length === 0) return prev
        const at = shown.findIndex((i) => i.id === prev)
        if (at === -1) return shown[0].id
        return shown[(at + by + shown.length) % shown.length].id
      })
    },
    [shown],
  )

  // Escape closes the viewer, and the arrows step through the folder.
  useEffect(() => {
    if (opened === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpened(null)
        setSlideshow(false)
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault()
        step(e.key === "ArrowRight" ? 1 : -1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [opened, step])

  const menus: Record<string, { label: string; action: () => void; checked?: boolean; sep?: boolean }[]> = {
    File: [
      { label: "Open", action: () => selected !== null && setOpened(selected) },
      {
        label: "Close",
        action: () =>
          window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "gallery" } })),
        sep: true,
      },
    ],
    View: [
      { label: "Large Icons", action: () => setView("large"), checked: view === "large" },
      { label: "List", action: () => setView("list"), checked: view === "list" },
      { label: "Details", action: () => setView("details"), checked: view === "details" },
      { label: "Thumbnails", action: () => setView("thumbnails"), checked: view === "thumbnails" },
      { label: slideshow ? "Stop Slide Show" : "Slide Show", action: () => setSlideshow((s) => !s), sep: true },
    ],
    Help: [
      {
        label: "About My Pictures",
        action: () =>
          messageBox({
            title: "About My Pictures",
            text: `My Pictures\n\n${galleryImages.length} photographs across ${folders.length} folders.`,
            icon: "information",
          }),
      },
    ],
  }

  const path = folder === "all" ? "C:\\My Pictures" : `C:\\My Pictures\\${folderOf(folder)}`
  const thumbSize = view === "thumbnails" ? 96 : view === "large" ? 32 : 16

  return (
    <div
      className="win95-type relative flex h-full w-full flex-col bg-[#c0c0c0] text-black"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-gallery
    >
      {/* Menu bar */}
      <div className="flex border-b border-[#808080] px-1" onMouseLeave={() => setMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] ${menu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setMenu(menu === name ? null : name)}
              onMouseEnter={() => menu && setMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {menu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[160px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <div key={item.label}>
                    {item.sep && <div className="my-1 border-t border-t-[#808080] border-b border-b-white" />}
                    <button
                      type="button"
                      className="flex w-full items-center px-2 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                      onClick={() => {
                        item.action()
                        setMenu(null)
                      }}
                    >
                      <span className="mr-2 w-3">{item.checked ? "✓" : ""}</span>
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar and address bar */}
      <div className="flex items-center gap-1 border-b border-[#808080] p-1">
        <button
          type="button"
          aria-label="Back"
          disabled={historyIndex === 0}
          onClick={() => {
            setHistoryIndex((i) => i - 1)
            setFolder(history[historyIndex - 1])
            setSelected(null)
          }}
          className="h-[22px] w-[26px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Up One Level"
          disabled={folder === "all"}
          onClick={() => navigate("all")}
          className="h-[22px] w-[26px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          ↑
        </button>
        <span className="ml-2">Address</span>
        <div
          data-address
          className="ml-1 flex flex-1 items-center gap-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px]"
        >
          <img
            src="/images/win95/folder-open-16.png"
            alt=""
            className="h-4 w-4"
            style={{ imageRendering: "pixelated" }}
          />
          {path}
        </div>
      </div>

      {/* Panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree */}
        <div className="w-[200px] shrink-0 overflow-auto border-r border-[#808080] bg-white p-1">
          <button
            type="button"
            onClick={() => navigate("all")}
            className={`flex w-full items-center gap-1 px-1 text-left ${folder === "all" ? "bg-[#000080] text-white" : ""}`}
          >
            <img
              src="/images/win95/folder-open-16.png"
              alt=""
              className="h-4 w-4"
              style={{ imageRendering: "pixelated" }}
            />
            My Pictures
          </button>
          {folders.map((c) => (
            <button
              key={c.id}
              type="button"
              data-folder={c.id}
              onClick={() => navigate(c.id)}
              className={`ml-4 flex w-[calc(100%-1rem)] items-center gap-1 px-1 text-left ${
                folder === c.id ? "bg-[#000080] text-white" : ""
              }`}
            >
              <img
                src={
                  folder === c.id ? "/images/win95/folder-open-16.png" : "/images/win95/folder-closed-16.png"
                }
                alt=""
                className="h-4 w-4 shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Contents */}
        <div
          data-contents
          className="flex-1 overflow-auto bg-white p-2"
          onClick={() => {
            setSelected(null)
            setMenu(null)
          }}
        >
          {view === "details" ? (
            <table className="w-full">
              <thead>
                <tr>
                  {["Name", "Size", "Type", "Modified"].map((h) => (
                    <th
                      key={h}
                      className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-1 py-[1px] text-left font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <div className="px-2 py-2 text-[#808080]">There are no items in this view.</div>
                )}
                {shown.map((image) => (
                  <tr
                    key={image.id}
                    data-photo={image.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(image.id)
                    }}
                    onDoubleClick={() => setOpened(image.id)}
                    className={selected === image.id ? "bg-[#000080] text-white" : ""}
                  >
                    <td className="px-1">{fileName(image)}</td>
                    <td className="px-1">&mdash;</td>
                    <td className="px-1">JPEG Image</td>
                    <td className="px-1">{formatDate(image.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={view === "list" ? "flex flex-col" : "flex flex-wrap content-start gap-2"}>
              {shown.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  data-photo={image.id}
                  title={image.description}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(image.id)
                  }}
                  onDoubleClick={() => setOpened(image.id)}
                  className={`flex items-center ${
                    view === "list" ? "gap-1 px-1" : "flex-col gap-1 p-1 text-center"
                  } ${selected === image.id ? "bg-[#000080] text-white" : "text-black"}`}
                  style={view === "thumbnails" ? { width: 120 } : view === "large" ? { width: 84 } : undefined}
                >
                  {view === "thumbnails" ? (
                    <span
                      className="flex items-center justify-center border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#c0c0c0]"
                      style={{ width: thumbSize + 8, height: thumbSize + 8 }}
                    >
                      <img
                        src={image.src}
                        alt=""
                        loading="lazy"
                        style={{ maxWidth: thumbSize, maxHeight: thumbSize, objectFit: "contain" }}
                      />
                    </span>
                  ) : (
                    <img
                      src={image.src}
                      alt=""
                      loading="lazy"
                      style={{ width: thumbSize, height: thumbSize, objectFit: "cover" }}
                    />
                  )}
                  <span className={view === "thumbnails" ? "break-words leading-tight" : "truncate"}>
                    {fileName(image)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[3px]">
        <span data-status className="flex-1">
          {selected !== null
            ? galleryImages.find((i) => i.id === selected)?.title
            : `${shown.length} object(s)`}
        </span>
        {slideshow && <span>Slide Show</span>}
        <span>{folder === "all" ? "My Pictures" : folderOf(folder)}</span>
      </div>

      {/* Viewer */}

      {current &&
        createPortal(
        <div
          className="fixed inset-x-0 top-0 bottom-[34px] z-[900] flex items-center justify-center bg-[#808080] p-6"
          data-viewer
          onClick={() => {
            setOpened(null)
            setSlideshow(false)
          }}
        >
          <div
            data-viewer-window
            className="flex h-full w-full flex-col border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-[#000080] px-1 py-[2px] text-white">
              <span className="px-1 font-bold">{fileName(current)} - Imaging</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setOpened(null)
                  setSlideshow(false)
                }}
                className="flex h-[16px] w-[16px] items-center justify-center border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black active:border-t-[#404040] active:border-l-[#404040]"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white bg-black p-2">
              <img
                key={current.src}
                src={current.src}
                alt={current.title}
                data-viewer-image
                /* Fit to window, which is what Imaging did: a small photo is
                   scaled up to the frame rather than sitting in the middle of
                   it, and object-contain keeps the aspect ratio. */
                className="h-full w-full object-contain"
              />
            </div>

            {/* Caption, then the controls. Both are fixed height so the photo
                gets every remaining pixel. */}
            <div className="flex items-baseline gap-2 px-2 py-1">
              <span className="font-bold">{current.title}</span>
              <span className="flex-1 truncate">{current.description}</span>
              <span className="whitespace-nowrap text-[#404040]">
                {formatDate(current.date)} &mdash; {folderOf(current.event)}
              </span>
            </div>

            <div className="flex items-center gap-2 border-t border-white px-2 py-2">
              <ViewerButton
                label="<< Previous"
                onClick={() => step(-1)}
                disabled={shown.length < 2}
              />
              <ViewerButton label="Next >>" onClick={() => step(1)} disabled={shown.length < 2} />
              <span data-viewer-position className="px-2">
                {position + 1} of {shown.length}
              </span>
              <div className="flex-1" />
              <ViewerButton
                label={slideshow ? "Stop Slide Show" : "Slide Show"}
                onClick={() => setSlideshow((v) => !v)}
                disabled={shown.length < 2}
              />
              <ViewerButton
                label="Close"
                onClick={() => {
                  setOpened(null)
                  setSlideshow(false)
                }}
              />
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  )
}

/**
 * A raised Windows 95 push button for the viewer's control strip.
 *
 * @param label  Text on the face.
 * @param onClick  What pressing it does.
 * @param disabled  Greys the face and blocks the press, used when a folder has
 *                  a single photo and there is nowhere to step to.
 */
function ViewerButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[92px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-3 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white ${
        disabled ? "text-[#808080]" : "text-black"
      }`}
    >
      {label}
    </button>
  )
}
