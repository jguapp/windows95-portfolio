"use client"

/**
 * The rest of the Windows 95 program set.
 *
 * These shipped with the real thing and belong on the Start menu even where a
 * full recreation is not worth building. Each opens a faithful little window:
 * the right icon, the right framing, a line about what it was, and a pointer
 * at the working equivalent on this desktop where one exists.
 */

export interface StubProgram {
  id: string
  name: string
  icon: string
  /** What the program was, in one period sentence. */
  was: string
  /** Where the working version of the idea lives here, if anywhere. */
  instead?: { label: string; opens: string }
}

export const STUB_PROGRAMS: StubProgram[] = [
  {
    id: "wordpad",
    name: "WordPad",
    icon: "/images/win95/wordpad-32.png",
    was: "The word processor between Notepad and Word: rich text, no page numbers.",
    instead: { label: "The resume opens in Microsoft Word", opens: "resume" },
  },
  {
    id: "charmap",
    name: "Character Map",
    icon: "/images/win95/charmap-32.png",
    was: "Every character in every font, for the day you needed a © or an é.",
  },
  {
    id: "mediaplayer",
    name: "Media Player",
    icon: "/images/win95/mediaplayer-32.png",
    was: "Played .avi and .wav files in a window the size of a stamp.",
    instead: { label: "Winamp is on the desktop, and it really plays", opens: "winamp" },
  },
  {
    id: "soundrec",
    name: "Sound Recorder",
    icon: "/images/win95/soundrec-32.png",
    was: "Sixty seconds of microphone to a .wav, with an oscilloscope to watch.",
  },
  {
    id: "cdplayer",
    name: "CD Player",
    icon: "/images/win95/cdplayer-32.png",
    was: "Track listings for the disc in your drive, if you typed them in yourself.",
    instead: { label: "Winamp took this job in 1997", opens: "winamp" },
  },
  {
    id: "phonedialer",
    name: "Phone Dialer",
    icon: "/images/win95/phone-32.png",
    was: "Dialled a telephone through your modem so you could pick up the handset.",
  },
  {
    id: "hyperterm",
    name: "HyperTerminal",
    icon: "/images/win95/hyperterm-32.png",
    was: "Serial and dial-up terminal sessions: BBSes, routers, other computers.",
    instead: { label: "The MS-DOS Prompt is the terminal here", opens: "msdos" },
  },
  {
    id: "scandisk",
    name: "ScanDisk",
    icon: "/images/win95/scandisk-32.png",
    was: "Checked your disk for errors, mostly after you turned it off wrong.",
  },
  {
    id: "defrag",
    name: "Disk Defragmenter",
    icon: "/images/win95/defrag-32.png",
    was: "Shuffled file fragments into order while you watched the blocks move.",
  },
]

export const STUB_IDS = new Set(STUB_PROGRAMS.map((s) => s.id))

export default function StubApp({ program }: { program: StubProgram }) {
  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
      data-stub={program.id}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <img
          src={program.icon}
          alt=""
          className="h-16 w-16"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="font-bold">{program.name}</div>
        <p className="max-w-[320px]">{program.was}</p>
        {program.instead ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openWindow", { detail: { id: program.instead!.opens } }))
            }
            className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-[3px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            {program.instead.label}
          </button>
        ) : (
          <p className="text-[#808080]">This one is here for the shelf, not the workbench.</p>
        )}
      </div>
      <div className="border-t border-white bg-[#c0c0c0] px-2 py-[3px] text-[#404040]">
        Shipped with Windows 95. Present for completeness.
      </div>
    </div>
  )
}
