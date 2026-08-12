"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { type FsDir, type FsNode, displayPath, getRoot, iconFor, listDir, subscribe } from "@/lib/filesystem"

/**
 * Windows Explorer over the virtual C:\ drive.
 *
 * Folder tree on the left, contents on the right, with the four view modes.
 * Double-clicking a file opens the window that already handles it, so Explorer
 * is a second route into existing content rather than a new silo.
 */

type ViewMode = "large" | "small" | "list" | "details"

function bytes(n: number): string {
  if (n === 0) return ""
  if (n < 1024) return `${n}`
  return `${Math.ceil(n / 1024)}KB`
}

function TreeNode({
  name,
  node,
  path,
  cwd,
  expanded,
  onToggle,
  onSelect,
  depth,
}: {
  name: string
  node: FsNode
  path: string[]
  cwd: string[]
  expanded: Set<string>
  onToggle: (key: string) => void
  onSelect: (path: string[]) => void
  depth: number
}) {
  if (node.kind !== "dir") return null
  const key = path.join("/")
  const isOpen = expanded.has(key)
  const isCurrent = cwd.join("/") === key
  const subdirs = Object.entries(node.children).filter(([, c]) => c.kind === "dir")

  return (
    <div>
      <div className="flex items-center whitespace-nowrap" style={{ paddingLeft: depth * 14 }}>
        {subdirs.length > 0 ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${name}` : `Expand ${name}`}
            onClick={() => onToggle(key)}
            className="mr-1 flex h-[13px] w-[13px] shrink-0 items-center justify-center border border-[#808080] bg-white text-[10px] leading-none text-black"
          >
            {isOpen ? "-" : "+"}
          </button>
        ) : (
          <span className="mr-1 inline-block w-[13px]" />
        )}
        <button
          type="button"
          onClick={() => onSelect(path)}
          className={`flex items-center gap-1 px-1 text-xs ${isCurrent ? "bg-[#000080] text-white" : ""}`}
        >
          <img
            src={iconFor(name, node, isOpen)}
            alt=""
            className="h-4 w-4"
            style={{ imageRendering: "pixelated" }}
          />
          {name}
        </button>
      </div>
      {isOpen &&
        subdirs.map(([childName, child]) => (
          <TreeNode
            key={childName}
            name={childName}
            node={child}
            path={[...path, childName]}
            cwd={cwd}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </div>
  )
}

export default function Explorer() {
  const [cwd, setCwd] = useState<string[]>([])
  const [history, setHistory] = useState<string[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>("large")
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]))
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Re-reads when the drive changes, so a file saved in Notepad appears here
  // without needing the window reopened.
  const root = useSyncExternalStore(subscribe, getRoot, getRoot)
  const entries = useMemo(() => listDir(cwd, root), [cwd, root])

  const navigate = (path: string[]) => {
    setCwd(path)
    setSelected(null)
    setHistory((h) => [...h.slice(0, historyIndex + 1), path])
    setHistoryIndex((i) => i + 1)
  }

  const goBack = () => {
    if (historyIndex === 0) return
    setHistoryIndex((i) => i - 1)
    setCwd(history[historyIndex - 1])
    setSelected(null)
  }

  const goForward = () => {
    if (historyIndex >= history.length - 1) return
    setHistoryIndex((i) => i + 1)
    setCwd(history[historyIndex + 1])
    setSelected(null)
  }

  const goUp = () => {
    if (!cwd.length) return
    navigate(cwd.slice(0, -1))
  }

  const activate = (name: string, node: FsNode) => {
    if (node.kind === "dir") {
      navigate([...cwd, name])
      setExpanded((prev) => new Set(prev).add(cwd.join("/")))
      return
    }
    if (node.opens) {
      window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: node.opens } }))
    }
  }

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const folders = entries.filter(([, n]) => n.kind === "dir").length
  const files = entries.length - folders

  const menus: Record<string, { label: string; action: () => void; checked?: boolean }[]> = {
    File: [{ label: "Close", action: () => window.dispatchEvent(new CustomEvent("windowAction", { detail: { action: "close", id: "explorer" } })) }],
    View: [
      { label: "Large Icons", action: () => setView("large"), checked: view === "large" },
      { label: "Small Icons", action: () => setView("small"), checked: view === "small" },
      { label: "List", action: () => setView("list"), checked: view === "list" },
      { label: "Details", action: () => setView("details"), checked: view === "details" },
    ],
    Help: [{ label: "About Windows Explorer", action: () => alert("Windows Explorer\n\nWindows 95 recreation.") }],
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#c0c0c0]" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      {/* Menu bar */}
      <div className="flex border-b border-[#808080] px-1" onMouseLeave={() => setOpenMenu(null)}>
        {Object.keys(menus).map((name) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] text-xs ${openMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenMenu(openMenu === name ? null : name)}
              onMouseEnter={() => openMenu && setOpenMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[180px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {menus[name].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center px-3 py-[2px] text-left text-xs hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      item.action()
                      setOpenMenu(null)
                    }}
                  >
                    <span className="mr-2 w-3">{item.checked ? "✓" : ""}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[#808080] p-1">
        <button
          type="button"
          aria-label="Back"
          disabled={historyIndex === 0}
          onClick={goBack}
          className="h-[22px] w-[26px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Forward"
          disabled={historyIndex >= history.length - 1}
          onClick={goForward}
          className="h-[22px] w-[26px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          →
        </button>
        <button
          type="button"
          aria-label="Up One Level"
          disabled={!cwd.length}
          onClick={goUp}
          className="h-[22px] w-[26px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
        >
          ↑
        </button>
        <span className="ml-2 text-xs">Address</span>
        <div
          data-address
          className="ml-1 flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white px-1 py-[2px] text-xs"
        >
          {displayPath(cwd)}
        </div>
      </div>

      {/* Panes */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[190px] shrink-0 overflow-auto border-r border-[#808080] bg-white p-1">
          <TreeNode
            name="C:\\"
            node={root as FsDir}
            path={[]}
            cwd={cwd}
            expanded={expanded}
            onToggle={toggle}
            onSelect={(p) => navigate(p)}
            depth={0}
          />
        </div>

        <div data-contents className="flex-1 overflow-auto bg-white p-1">
          {view === "details" ? (
            <table className="w-full text-xs">
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
                {entries.map(([name, node]) => (
                  <tr
                    key={name}
                    onClick={() => setSelected(name)}
                    onDoubleClick={() => activate(name, node)}
                    className={selected === name ? "bg-[#000080] text-white" : ""}
                  >
                    <td className="px-1">
                      <span className="flex items-center gap-1">
                        <img src={iconFor(name, node)} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
                        {name}
                      </span>
                    </td>
                    <td className="px-1">{node.kind === "file" ? bytes(node.size) : ""}</td>
                    <td className="px-1">{node.kind === "dir" ? "File Folder" : "File"}</td>
                    <td className="px-1">{node.kind === "file" ? node.modified : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className={
                view === "large"
                  ? "flex flex-wrap content-start gap-2"
                  : view === "small"
                    ? "flex flex-wrap content-start gap-x-4 gap-y-1"
                    : "flex flex-col"
              }
            >
              {entries.map(([name, node]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelected(name)}
                  onDoubleClick={() => activate(name, node)}
                  className={`flex items-center text-xs ${
                    view === "large" ? "w-[84px] flex-col gap-1 p-1 text-center" : "gap-1 px-1"
                  } ${selected === name ? "bg-[#000080] text-white" : "text-black"}`}
                >
                  <img
                    src={iconFor(name, node)}
                    alt=""
                    className={view === "large" ? "h-8 w-8" : "h-4 w-4"}
                    style={{ imageRendering: "pixelated" }}
                  />
                  <span className={view === "large" ? "break-words leading-tight" : ""}>{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[2px] text-xs">
        <span data-status>{entries.length} object(s)</span>
        <span>
          {folders} folder(s), {files} file(s)
        </span>
      </div>
    </div>
  )
}
