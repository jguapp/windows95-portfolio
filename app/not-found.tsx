/**
 * The 404, in the desktop's own voice.
 *
 * A wrong path gets the dialog Windows 95 would have shown: an error box on
 * the teal desktop with one way out. Server-rendered, no client code; the
 * button is a plain link back to C:\.
 */
export default function NotFound() {
  return (
    <main
      className="flex h-screen w-full items-center justify-center"
      style={{ backgroundColor: "#008080", fontFamily: '"MS Sans Serif", sans-serif' }}
    >
      <div className="w-[420px] max-w-[calc(100vw-32px)] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[3px_3px_10px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between bg-[#000080] px-2 py-[3px] font-bold text-white">
          <span className="text-sm">Windows</span>
        </div>
        <div className="flex items-start gap-4 p-5">
          {/* The stock error glyph: a red circle with a white X. */}
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
            <circle cx="16" cy="16" r="15" fill="#ff0000" />
            <path d="M10 10 L22 22 M22 10 L10 22" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="text-sm text-black">
            <p className="mb-1 font-bold">This page cannot be found.</p>
            <p>
              The path you typed does not exist on this computer. It may have been moved, deleted, or
              never existed at all.
            </p>
          </div>
        </div>
        <div className="flex justify-center pb-4">
          <a
            href="/"
            className="min-w-[110px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-6 py-[5px] text-center text-sm text-black active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
          >
            Back to C:\
          </a>
        </div>
      </div>
    </main>
  )
}
