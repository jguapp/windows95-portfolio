"use client"

import { useState } from "react"

interface StartMenuProps {
  onClose: () => void
  onOpenWindow: (id: string) => void
}

export default function StartMenu({ onClose, onOpenWindow }: StartMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [activeNestedSubmenu, setActiveNestedSubmenu] = useState<string | null>(null)

  const handleShutDown = () => {
    // Close the website
    window.close()
    // If window.close() doesn't work (most browsers block it), show a message
    setTimeout(() => {
      alert("This would close the website in a real Windows 95 environment. Thanks for visiting!")
    }, 100)
  }

  const handleMouseEnter = (menu: string) => {
    setActiveSubmenu(menu)
    setActiveNestedSubmenu(null)
  }

  const handleNestedMouseEnter = (menu: string) => {
    setActiveNestedSubmenu(menu)
  }

  const handleMouseLeave = () => {
    setActiveSubmenu(null)
    setActiveNestedSubmenu(null)
  }

  return (
    <div
      id="start-menu"
      className="absolute bottom-[28px] left-0 w-[250px] bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.5)] z-[200] text-sm"
    >
      <div className="flex h-full">
        <div className="w-[30px] bg-[#808080] flex flex-col justify-center items-center">
          <div className="rotate-[270deg] whitespace-nowrap text-white font-bold text-sm uppercase origin-center tracking-widest">
            Windows 95
          </div>
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
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("about-me")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/about-me.png" alt="About Me" className="mr-2 w-10 h-10" />
                      <span className="text-sm">About Me</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("resume")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/resume.png" alt="Resume" className="mr-2 w-10 h-10" />
                      <span className="text-sm">Resume</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("projects")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/youtube.png" alt="My Projects" className="mr-2 w-10 h-10" />
                      <span className="text-sm">My Projects</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("contact")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/contact.png" alt="Contact Me" className="mr-2 w-10 h-10" />
                      <span className="text-sm">Contact Me</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("gallery")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/gallery.png" alt="Gallery" className="mr-2 w-10 h-10" />
                      <span className="text-sm">Gallery</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("games")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/games.png" alt="Games" className="mr-2 w-10 h-10" />
                      <span className="text-sm">Games</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white" onClick={() => onOpenWindow("paint")}>
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[40px] cursor-pointer w-full">
                      <img src="/images/desktop-icons/paint.png" alt="Paint" className="mr-2 w-10 h-10" />
                      <span className="text-sm">Paint</span>
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
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/notepad-icon.png" alt="Read Me" className="mr-2 w-5 h-5" />
                      <span className="text-sm">Readme</span>
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
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Controls%20Folder-wTwQW4YRtpeX6jhjksesrYjwRRDhLY.ico"
                        alt="Control Panel"
                        className="mr-2 w-7 h-7"
                      />
                      <span className="text-sm">Control Panel</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Printers%20folder-qgrFOkbQ7exn1GTYmyzVPVs3ninTPZ.ico"
                        alt="Printers"
                        className="mr-2 w-7 h-7"
                      />
                      <span className="text-sm">Printers</span>
                    </div>
                  </li>
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Windows%20logo%20%28without%20text%29-fP8PnMnbCrHEsmYNxUXi6chpdZucsG.ico"
                        alt="Windows Setup"
                        className="mr-2 w-7 h-7"
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
                  <li className="hover:bg-[#000080] hover:text-white">
                    <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
                      <img src="/images/find-icon.png" alt="Files or Folders" className="mr-2 w-5 h-5" />
                      <span className="text-sm">Files or Folders...</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="hover:bg-[#000080] hover:text-white">
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/help-icon.png" alt="Help Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm underline">H</span>
              <span className="text-sm">elp</span>
            </div>
          </li>
          <li className="hover:bg-[#000080] hover:text-white">
            <div className="p-[4px_4px_4px_8px] text-xs flex items-center h-[36px] cursor-pointer w-full">
              <img src="/images/run-icon.png" alt="Run Icon" className="mr-2 w-7 h-7" />
              <span className="text-sm">Run...</span>
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
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/linkedin-fsh0YDCuIuPndO9kIjMKWmSfAtK8jI.png"
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
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/github-cZT5gT46oBSpVLnyT8Hi2GkNR7AqZ4.png"
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
