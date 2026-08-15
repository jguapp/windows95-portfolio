"use client"

import { useEffect, useRef, useState } from "react"
import { messageBox } from "@/components/win95-dialog"
import { STUB_PROGRAMS } from "@/components/window-content/stub-app"

interface StartMenuProps {
  onOpenWindow: (id: string) => void
}

/** Windows 95 waited about a third of a second before opening a cascade. */
const SUBMENU_DELAY_MS = 300
/** And a moment before closing it, so a diagonal move does not lose it. */
const SUBMENU_CLOSE_MS = 250

export default function StartMenu({ onOpenWindow }: StartMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  /** The Accessories cascade inside Programs, tracked separately so leaving
   *  it does not close Programs itself. */
  const [accessoriesOpen, setAccessoriesOpen] = useState(false)

  // The shutdown flow lives in its own component; the menu only asks for it.
  const handleShutDown = () => {
    window.dispatchEvent(new CustomEvent("openShutdown"))
  }

  /**
   * Submenus open on a short delay, and close on one too.
   *
   * Windows 95 waited a beat before opening a cascade, and waited again before
   * closing it. Both matter: opening instantly means dragging the pointer down
   * the menu flickers a submenu open at every item it passes, and closing
   * instantly means the diagonal move from a parent item across to its own
   * submenu closes the thing you were reaching for.
   */
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
  }

  const handleMouseEnter = (menu: string) => {
    cancelHover()
    // Already showing one, so switch without the wait; only the first opening
    // is deliberate enough to need it.
    if (activeSubmenu && activeSubmenu !== menu) {
      setActiveSubmenu(menu)
      return
    }
    hoverTimer.current = setTimeout(() => setActiveSubmenu(menu), SUBMENU_DELAY_MS)
  }

  const handleMouseLeave = () => {
    cancelHover()
    hoverTimer.current = setTimeout(() => setActiveSubmenu(null), SUBMENU_CLOSE_MS)
  }

  useEffect(() => cancelHover, [])

  return (
    <div
      id="start-menu"
      className="absolute bottom-[28px] left-0 w-[250px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[200] text-sm"
    >
      <div className="flex h-full">
        {/*
          The sidebar banner, as the original drew it: a black band down the
          left with the wordmark reading bottom to top from the bottom edge,
          "Windows" in silver and "95" in white, in a condensed gothic face.
          Centring it vertically or washing it in gray was never the look.
        */}
        <div className="relative w-[26px] overflow-hidden" style={{ backgroundColor: "#000000" }} data-start-banner>
          <span
            className="absolute bottom-[6px] left-1/2 whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              transform: "translateX(-50%) rotate(180deg)",
              fontSize: 20,
              lineHeight: 1,
              fontWeight: 700,
              fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif',
            }}
          >
            <span style={{ color: "#7f7f7f" }}>Windows</span>
            <span style={{ color: "#ffffff" }}>95</span>
          </span>
        </div>

        <ul className="list-none m-0 p-0 flex-1 relative">
          <li className="hover:bg-[#000080] hover:text-white" onMouseEnter={() => handleMouseEnter("programs")}>
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/programs-icon.png" alt="Programs Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">P</span>
              <span className="text-sm">rograms</span>
              <div className="ml-auto flex items-center">
                <span className="mr-2">▶</span>
              </div>
            </div>
            {activeSubmenu === "programs" && (
              <div
                className="absolute left-full top-0 w-[220px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
                onMouseLeave={handleMouseLeave}
              >
                <ul className="list-none m-0 p-0">
                  <li
                    className="relative hover:bg-[#000080] hover:text-white"
                    onMouseEnter={() => setAccessoriesOpen(true)}
                    onMouseLeave={() => setAccessoriesOpen(false)}
                  >
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/win95/folder-closed-16.png" alt="Accessories" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Accessories</span>
                      <span className="ml-auto mr-2">&#9654;</span>
                    </div>
                    {accessoriesOpen && (
                      <div className="absolute left-full top-0 w-[210px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]">
                        <ul className="list-none m-0 p-0">
                          {STUB_PROGRAMS.map((prog) => (
                            <li key={prog.id} className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow(prog.id)}>
                              <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[30px] cursor-pointer w-full">
                                <img src={prog.icon} alt="" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                                <span className="text-sm">{prog.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("about-me")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/about-me-16.png" alt="About Me" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">About Me</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("resume")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/resume-16.png" alt="Resume" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Resume</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("projects")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/projects-16.png" alt="My Projects" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">My Projects</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("contact")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/contact-16.png" alt="Mail" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Mail</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("gallery")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/gallery-16.png" alt="Gallery" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Gallery</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("games")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/games-16.png" alt="Games" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Games</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("paint")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/paint-16.png" alt="Paint" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Paint</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("guestbook")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/guestbook-16.png" alt="Guestbook" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Guestbook</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("explorer")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/explorer-16.png" alt="Windows Explorer" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Windows Explorer</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("msdos")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/msdos-16.png" alt="MS-DOS Prompt" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">MS-DOS Prompt</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("notepad")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/notepad-16.png" alt="Notepad" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Notepad</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("calculator")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/win95/calculator-16.png" alt="Calculator" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Calculator</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="hover:bg-[#000080] hover:text-white" onMouseEnter={() => handleMouseEnter("documents")}>
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/documents-icon.png" alt="Documents Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">D</span>
              <span className="text-sm">ocuments</span>
              <div className="ml-auto flex items-center">
                <span className="mr-2">▶</span>
              </div>
            </div>
            {activeSubmenu === "documents" && (
              <div
                className="absolute left-full top-[36px] w-[200px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
                onMouseLeave={handleMouseLeave}
              >
                <ul className="list-none m-0 p-0">
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("notepad")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/win95/notepad-16.png" alt="Readme" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Readme</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("patch-notes")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/win95/notepad-16.png" alt="Release Notes" className="mr-2 w-4 h-4" style={{ imageRendering: "pixelated" }} />
                      <span className="text-sm">Release Notes</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="hover:bg-[#000080] hover:text-white" onMouseEnter={() => handleMouseEnter("settings")}>
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/settings-icon.png" alt="Settings Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">S</span>
              <span className="text-sm">ettings</span>
              <div className="ml-auto flex items-center">
                <span className="mr-2">▶</span>
              </div>
            </div>
            {activeSubmenu === "settings" && (
              <div
                className="absolute left-full top-[72px] w-[200px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
                onMouseLeave={handleMouseLeave}
              >
                <ul className="list-none m-0 p-0">
                  <li
                    className="hover:bg-[#000080] hover:text-white"
                    onClick={() => window.dispatchEvent(new CustomEvent("openDisplayProperties"))}
                  >
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="/images/blob/controls-folder.ico"
                        alt="Control Panel"
                        className="mr-2 w-4 h-4"
                      />
                      <span className="text-sm">Control Panel</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("sound-properties")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/blob/sound.png" alt="Sounds" className="mr-2 w-5 h-5 object-contain" />
                      <span className="text-sm">Sounds</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="/images/blob/printers-folder.ico"
                        alt="Printers"
                        className="mr-2 w-4 h-4"
                      />
                      <span className="text-sm">Printers</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="/images/blob/windows-logo-without-text.ico"
                        alt="Windows Setup"
                        className="mr-2 w-4 h-4"
                      />
                      <span className="text-sm">Windows Setup</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="hover:bg-[#000080] hover:text-white" onMouseEnter={() => handleMouseEnter("find")}>
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/find-icon.png" alt="Find Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">F</span>
              <span className="text-sm">ind</span>
              <div className="ml-auto flex items-center">
                <span className="mr-2">▶</span>
              </div>
            </div>
            {activeSubmenu === "find" && (
              <div
                className="absolute left-full top-[108px] w-[200px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]"
                onMouseLeave={handleMouseLeave}
              >
                <ul className="list-none m-0 p-0">
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("find-files")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/find-icon.png" alt="Files or Folders" className="mr-2 w-7 h-7" />
                      <span className="text-sm">Files or Folders...</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li
            className="hover:bg-[#000080] hover:text-white"
            onClick={() =>
              void messageBox({
                title: "Windows Help",
                text:
                  "Welcome to Joel's desktop.\n\n" +
                  "Double-click an icon to open it. Drag windows by the title bar, and drag things onto the Recycle Bin to throw them away.\n\n" +
                  "Windows+R opens Run. Double-click the clock for the date. The games in Programs all work.\n\n" +
                  "There is one thing hidden here that this file will not tell you about.",
                icon: "information",
              })
            }
          >
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/help-icon.png" alt="Help Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">H</span>
              <span className="text-sm">elp</span>
            </div>
          </li>
          <li
            className="hover:bg-[#000080] hover:text-white"
            onClick={() => window.dispatchEvent(new CustomEvent("openRun"))}
          >
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/run-icon.png" alt="Run Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm">
                <span className="underline">R</span>un...
              </span>
            </div>
          </li>
          <li className="hover:bg-[#000080] hover:text-white">
            <a
              href="https://www.linkedin.com/in/jvasquezcs/"
              target="_blank"
              className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full text-black hover:text-white no-underline"
              rel="noreferrer"
            >
              <img
                src="/images/blob/linkedin.png"
                alt="LinkedIn Icon"
                className="mr-2 w-6 h-6"
              />
              <span className="text-sm">LinkedIn</span>
            </a>
          </li>
          <li className="hover:bg-[#000080] hover:text-white">
            <a
              href="https://github.com/jguapp"
              target="_blank"
              className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full text-black hover:text-white no-underline"
              rel="noreferrer"
            >
              <img
                src="/images/blob/github.png"
                alt="GitHub Icon"
                className="mr-2 w-6 h-6"
              />
              <span className="text-sm">GitHub</span>
            </a>
          </li>
          <li className="border-t border-t-[#808080] mt-1 mx-2"></li>
          <li className="hover:bg-[#000080] hover:text-white" onClick={handleShutDown}>
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/shutdown-icon.png" alt="Shut Down Icon" className="mr-2 w-8 h-8" />
              <span className="text-sm">Shut Down...</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
