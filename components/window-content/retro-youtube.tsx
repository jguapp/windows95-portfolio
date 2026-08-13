"use client"

import { useState } from "react"

/**
 * The Projects window, as YouTube looked in 2005.
 *
 * The window frame stays Windows 95 on purpose: a 2005 site viewed through a
 * Windows 95 window is the joke. Everything inside the frame is the web page,
 * so it uses Arial and Verdana on white with #0000CC links, not MS Sans Serif
 * on #c0c0c0.
 *
 * Reference points from the period: a fixed-width left column rather than a
 * centred one, hard 1px #CCCCCC borders, no rounded corners beyond the header
 * boxes, five-star ratings under the player, and the URL/Embed pair that every
 * 2005 video page carried.
 */

interface Project {
  id: string
  title: string
  description: string
  views: number
  added: string
  rating: number
  ratings: number
  tags: string[]
  repo?: string
  live?: string
}

const PROJECTS: Project[] = [
  {
    id: "booklet",
    title: "Booklet - Read-It-Later API & Sync Platform",
    description: `A Fastify/PostgreSQL backend with 82 REST endpoints and a 20-table Prisma schema, serving web, mobile and browser-extension clients through one API.

Two-tier in-memory/Redis caching with in-flight request deduplication raised concurrent inference throughput 2.86x. Eliminating ONNX thread-pool oversubscription on 2 vCPUs cut cold-start time 25% to 8.9s and concurrent-request latency 21% to 14.8s.`,
    views: 1284,
    added: "3/02/2026",
    rating: 5,
    ratings: 34,
    tags: ["typescript", "nodejs", "fastify", "postgresql", "redis", "prisma", "onnx"],
    repo: "https://github.com/jguapp",
  },
  {
    id: "calligraphy",
    title: "Calligraphy - Distributed Task Queue System",
    description: `A distributed Go worker pool built on goroutines, channels and Redis-backed queues, processing 10,000+ jobs at 99.04%+ completion reliability under load.

Dynamic worker scaling, connection pooling and concurrent scheduling across 7 containerised workers improved throughput 60%. Fault tolerance covers persistent job state, automatic retries with exponential backoff, dead-letter queues and graceful recovery of interrupted jobs.`,
    views: 947,
    added: "1/18/2026",
    rating: 5,
    ratings: 21,
    tags: ["go", "docker", "grafana", "grpc", "redis", "distributed-systems"],
    repo: "https://github.com/jguapp",
  },
  {
    id: "portfolio",
    title: "Windows 95 Portfolio",
    description: `The desktop you are looking at. Every window is real: draggable, resizable, closable. There is a working MS-DOS prompt over a virtual C:\\ drive, Explorer, Notepad, Calculator, a Recycle Bin that restores, and five playable games.

Built with Next.js and TypeScript. All the sound is synthesised with the Web Audio API rather than shipped as files.`,
    views: 3106,
    added: "8/12/2026",
    rating: 5,
    ratings: 58,
    tags: ["nextjs", "react", "typescript", "tailwind", "web-audio"],
    repo: "https://github.com/jguapp/windows95-portfolio",
    live: "https://builtbyjoel.dev",
  },
  {
    id: "rmp",
    title: "RMP for CUNYfirst - Professor Ratings Where You Register",
    description: `A browser extension that puts Rate My Professors data inside CUNYfirst and Schedule Builder, next to every instructor name, so you see it while you are picking classes instead of afterwards.

Names pick up a colour-coded badge with the rating count spelled out, because a 4.8 from three students should not look like a 4.8 from three hundred. Hovering gives the full breakdown: would-take-again, average difficulty, the Awesome/Good/Bad split, the 5-to-1 histogram and the tags students actually attached. All 26 CUNY colleges are recognised, read straight off the page.`,
    views: 2417,
    added: "8/11/2026",
    rating: 5,
    ratings: 46,
    tags: ["javascript", "chrome-extension", "cuny", "web-scraping"],
    repo: "https://github.com/jguapp/RMP-Extension",
  },
  {
    id: "sportsflix",
    title: "Sportsflix - Live Sport in a Streaming-Service Shape",
    description: `A sports front end built in the shape of a premium streaming service and pointed at live sport instead of film and television.

The mapping is the whole idea: genres become leagues, episodes become fixtures within a season, Top 10 becomes the top ten events today, Continue Watching becomes Live Now. Scores, fixtures and results come from ESPN's public endpoints, and playback resolves through the same pluggable source pattern a video site uses.`,
    views: 1663,
    added: "8/12/2026",
    rating: 4,
    ratings: 29,
    tags: ["typescript", "nextjs", "espn-api", "streaming"],
    repo: "https://github.com/jguapp/Sportsflix",
  },
  {
    id: "orbit",
    title: "ORBIT - A Productivity App for ADHD Minds",
    description: `A native iOS app in Swift for people whose executive function needs scaffolding rather than another checklist.

A space-themed Pomodoro timer with ambient sound and haptics sits alongside task management with priorities, due dates, subtasks and Eisenhower Matrix sorting. Screen Time analytics feed weekly and monthly trends back in, and the reward loop is deliberately dopamine-friendly rather than punitive.`,
    views: 812,
    added: "5/01/2025",
    rating: 5,
    ratings: 18,
    tags: ["swift", "swiftui", "ios", "accessibility", "screentime-api"],
    repo: "https://github.com/jguapp/Orbit",
  },
]

interface Comment {
  name: string
  when: string
  text: string
  owner?: boolean
  replies?: { name: string; when: string; text: string; owner?: boolean }[]
}

const COMMENTS: Record<string, Comment[]> = {
  booklet: [
    {
      name: "backend_andy",
      when: "2 weeks ago",
      text: "82 endpoints is a lot of surface. How are you keeping the Prisma schema from turning into spaghetti across 20 tables?",
      replies: [
        {
          name: "JoelVasquez",
          when: "2 weeks ago",
          owner: true,
          text: "Every table belongs to exactly one domain module and cross-domain reads go through a service layer rather than direct joins. It costs a little performance but the schema stays legible.",
        },
      ],
    },
    {
      name: "cachemeifyoucan",
      when: "3 weeks ago",
      text: "2.86x from caching alone? What was the hit rate?",
      replies: [
        {
          name: "JoelVasquez",
          when: "3 weeks ago",
          owner: true,
          text: "About 71% steady-state. The bigger win was in-flight deduplication: identical concurrent requests wait on one promise instead of each doing the work.",
        },
      ],
    },
    {
      name: "prisma_pete",
      when: "1 month ago",
      text: "Does the browser extension hit the same API as the mobile app or is there a separate surface for it?",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "Same API, different auth. The extension gets a scoped token that can only save and read, so a compromised extension cannot touch account settings.",
        },
      ],
    },
    {
      name: "onnx_curious",
      when: "1 month ago",
      text: "Thread-pool oversubscription on 2 vCPUs is such a specific catch. How did you find it?",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "Cold starts were slow but CPU sat below 100%, which never made sense. ONNX Runtime sizes its intra-op pool to the core count and the container was already running workers, so the threads fought each other. Pinning it to one fixed it.",
        },
      ],
    },
    {
      name: "just_here_for_the_api",
      when: "2 months ago",
      text: "any plans to open the API publicly?",
    },
  ],
  calligraphy: [
    {
      name: "gopher99",
      when: "1 month ago",
      text: "Curious why Redis for the queue rather than NATS or Kafka?",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "Redis was already in the stack and the job volume did not justify a broker. Sorted sets gave me delayed retries for free, which was most of what I needed.",
        },
      ],
    },
    {
      name: "sre_sam",
      when: "1 month ago",
      text: "99.04% is oddly specific. What was the remaining 1%?",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "Jobs that exhausted their retry budget and landed in the dead-letter queue, almost all of them hitting a downstream timeout. Tracked rather than silently dropped, which is the point.",
        },
      ],
    },
    {
      name: "channels_all_the_way",
      when: "2 months ago",
      text: "7 workers feels like a magic number. Did you tune that or is it just what the box fit?",
      replies: [
        {
          name: "JoelVasquez",
          when: "2 months ago",
          owner: true,
          text: "Tuned. Throughput climbed to seven and then flattened, and past nine the Redis round trips started dominating. Grafana made the knee obvious.",
        },
      ],
    },
    {
      name: "exponential_backoff_fan",
      when: "2 months ago",
      text: "graceful recovery of interrupted jobs is the part everyone skips. respect",
    },
  ],
  portfolio: [
    {
      name: "RetroTechFan",
      when: "2 weeks ago",
      text: "The window dragging feels right. How are you handling resize from the top and left edges?",
      replies: [
        {
          name: "JoelVasquez",
          when: "2 weeks ago",
          owner: true,
          text: "Those grips move the origin as well as the size so the opposite edge stays put. Each resize is computed from the pointer and rect captured at mousedown rather than accumulated per frame, so it cannot drift.",
        },
      ],
    },
    {
      name: "WebDevNewbie",
      when: "3 weeks ago",
      text: "Where did the sounds come from? They sound period-correct.",
      replies: [
        {
          name: "JoelVasquez",
          when: "3 weeks ago",
          owner: true,
          text: "They are generated in the browser. Square and triangle oscillators with short envelopes, plus filtered noise for the explosions. No audio files ship at all.",
        },
      ],
    },
    {
      name: "pixelpusher88",
      when: "1 month ago",
      text: "The Solitaire win cascade got me. Did not expect that to be in here.",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "It is a canvas that never clears between frames, which is exactly why the original left those ribbons behind. Clicking cuts it short, same as it did.",
        },
      ],
    },
    {
      name: "kernel_panic_kid",
      when: "1 month ago",
      text: "wait the DOS prompt actually works? just typed dir and got a real listing",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 month ago",
          owner: true,
          text: "It reads the same virtual drive Explorer and Notepad use. Save a file in Notepad and you can type it out in DOS without reloading anything.",
        },
      ],
    },
  ],
  rmp: [
    {
      name: "cunyfirst_survivor",
      when: "3 days ago",
      text: "Registration used to mean twenty tabs open at once. This is the thing I wanted for four years.",
      replies: [
        {
          name: "JoelVasquez",
          when: "3 days ago",
          owner: true,
          text: "That was the whole motivation. The data was always there, it was just in the wrong place at the wrong time.",
        },
      ],
    },
    {
      name: "stats_first",
      when: "1 week ago",
      text: "Glad you show the rating count. A 5.0 from two people tells you nothing and most tools hide that.",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 week ago",
          owner: true,
          text: "The badge colour comes from the score but the count sits right next to it in full, so a thin sample never reads as settled.",
        },
      ],
    },
    {
      name: "hunter_qc",
      when: "1 week ago",
      text: "Works on Hunter too, not just Baruch. Nice.",
      replies: [
        {
          name: "JoelVasquez",
          when: "1 week ago",
          owner: true,
          text: "All 26 CUNY colleges. It reads which campus you are on straight off the page rather than asking you to pick.",
        },
      ],
    },
  ],
  sportsflix: [
    {
      name: "matchday_mike",
      when: "4 days ago",
      text: "Continue Watching as Live Now is such a clean mapping. Did the rest of the layout survive the swap?",
      replies: [
        {
          name: "JoelVasquez",
          when: "4 days ago",
          owner: true,
          text: "Almost all of it. Rows, hero, hover cards, all the same. Sport is really a catalogue with a clock attached, so the browse patterns carry straight over.",
        },
      ],
    },
    {
      name: "f1_or_nothing",
      when: "6 days ago",
      text: "Does it handle races or is it just ball sports with fixtures?",
      replies: [
        {
          name: "JoelVasquez",
          when: "6 days ago",
          owner: true,
          text: "A race weekend is a season of events like any other league, so F1 slots in beside the NFL and the EPL without special casing.",
        },
      ],
    },
    {
      name: "espn_watcher",
      when: "1 week ago",
      text: "how are the public endpoints holding up under any real traffic?",
    },
  ],
  orbit: [
    {
      name: "adhd_dev",
      when: "2 months ago",
      text: "Most ADHD apps are a to-do list with a nicer font. The Eisenhower Matrix next to the timer is actually the workflow.",
      replies: [
        {
          name: "JoelVasquez",
          when: "2 months ago",
          owner: true,
          text: "Deciding what to do and actually starting it are two different failures, and most apps only help with the first. The timer is one tap from the matrix for that reason.",
        },
      ],
    },
    {
      name: "swiftui_sam",
      when: "3 months ago",
      text: "Screen Time API is a pain to work with. How did you find it?",
      replies: [
        {
          name: "JoelVasquez",
          when: "3 months ago",
          owner: true,
          text: "Restrictive by design, which is fair. You get aggregates rather than raw events, so the trends are weekly and monthly rather than live. That turned out to be healthier anyway.",
        },
      ],
    },
    {
      name: "focusmodefan",
      when: "3 months ago",
      text: "the haptics on session end are a small thing that makes it feel finished",
    },
  ],
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#F5C518", letterSpacing: 1 }}>
      {"★".repeat(n)}
      <span style={{ color: "#CCC" }}>{"★".repeat(5 - n)}</span>
    </span>
  )
}

const LINK = { color: "#0000CC", textDecoration: "none" } as const

export default function RetroYoutube() {
  const [selected, setSelected] = useState<Project>(PROJECTS[0])
  const [tab, setTab] = useState("Videos")
  const [commentText, setCommentText] = useState("")
  const [posted, setPosted] = useState<Comment[]>([])

  const comments = [...(COMMENTS[selected.id] ?? []), ...posted]

  return (
    <div
      className="page-2005 h-full w-full overflow-auto bg-white"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1px solid #CCC", padding: "8px 10px" }}>
        <div className="flex items-start justify-between">
          <img src="/2005-youtube-logo.png" alt="YouTube" style={{ height: 34 }} />
          <div className="t11">
            <a href="#" style={LINK}>
              Sign Up
            </a>
            {" | "}
            <a href="#" style={LINK}>
              My Account
            </a>
            {" | "}
            <a href="#" style={LINK}>
              History
            </a>
            {" | "}
            <a href="#" style={LINK}>
              Help
            </a>
            {" | "}
            <a href="#" style={LINK}>
              Log In
            </a>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <input
            type="text"
            aria-label="Search"
            style={{ border: "1px solid #7F9DB9", padding: "2px 4px", width: 260 }}
          />
          <button
            type="button"
            style={{ border: "1px solid #999", background: "#EFEFEF", padding: "2px 10px" }}
          >
            Search
          </button>
          <span className="t11" style={{ marginLeft: 8, color: "#666" }}>Broadcast Yourself&#8482;</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#F0F0F0", borderBottom: "1px solid #CCC", padding: "4px 10px" }}>
        {["Home", "Videos", "Categories", "Channels", "Upload"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              marginRight: 14,
              fontWeight: tab === t ? "bold" : "normal",
              color: tab === t ? "#000" : "#0000CC",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-3 p-3" style={{ alignItems: "flex-start" }}>
        {/* Main column */}
        <div style={{ width: 420, flexShrink: 0 }}>
          <h1 className="t15" style={{ fontWeight: "bold", marginBottom: 6 }}>{selected.title}</h1>

          {/* Flash-era player */}
          <div style={{ background: "#000", width: 420, height: 236, position: "relative" }}>
            <div
              className="flex h-full items-center justify-center"
              style={{ color: "#666", textAlign: "center", padding: 20 }}
            >
              Demo coming soon.
              <br />
              Meanwhile the source is on GitHub.
            </div>
            <div
              className="absolute bottom-0 left-0 flex w-full items-center gap-2"
              style={{ background: "#2B2B2B", padding: "3px 6px" }}
            >
              <span style={{ color: "#fff" }}>&#9654;</span>
              <div style={{ flex: 1, height: 6, background: "#555", position: "relative" }}>
                <div style={{ width: 0, height: "100%", background: "#C00" }} />
                <div
                  style={{ position: "absolute", left: 0, top: -2, width: 8, height: 10, background: "#DDD" }}
                />
              </div>
              <span style={{ color: "#CCC" }}>0:00 / 0:00</span>
              <span style={{ color: "#fff" }}>&#128266;</span>
            </div>
          </div>

          {/* Rating and stats */}
          <div className="t11 mt-2 flex items-center justify-between">
            <span>
              <Stars n={selected.rating} /> <span style={{ color: "#666" }}>({selected.ratings} ratings)</span>
            </span>
            <span style={{ color: "#666" }}>
              Views: <strong style={{ color: "#000" }}>{selected.views.toLocaleString()}</strong>
            </span>
          </div>

          <div className="t11 mt-1" style={{ color: "#666" }}>
            Added: {selected.added} &nbsp;From:{" "}
            <a href="https://github.com/jguapp" style={{ ...LINK, fontWeight: "bold" }}>
              JoelVasquez
            </a>
          </div>

          <div className="mt-2 flex gap-1">
            {["Share", "Favorite", "Playlists", "Flag"].map((b) => (
              <button
                key={b}
                type="button"
                style={{ border: "1px solid #999", background: "#EFEFEF", padding: "2px 8px" }}
              >
                {b}
              </button>
            ))}
          </div>

          <p className="mt-3" style={{ lineHeight: 1.45, whiteSpace: "pre-line" }}>
            {selected.description}
          </p>

          <div className="t11 mt-3">
            <strong>Tags:</strong>{" "}
            {selected.tags.map((t) => (
              <a key={t} href="#" style={{ ...LINK, marginRight: 6 }}>
                {t}
              </a>
            ))}
          </div>

          {/* The URL and Embed pair every 2005 video page had */}
          <div className="mt-3" style={{ border: "1px solid #CCC", background: "#F8F8F8", padding: 6 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <span style={{ width: 44 }}>URL</span>
              <input
                readOnly
                aria-label="Video URL"
                value={selected.live ?? selected.repo ?? ""}
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, border: "1px solid #7F9DB9", padding: "1px 3px" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 44 }}>Embed</span>
              <input
                readOnly
                aria-label="Embed code"
                value={`<embed src="${selected.id}.swf" width="425" height="350">`}
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, border: "1px solid #7F9DB9", padding: "1px 3px" }}
              />
            </div>
          </div>

          {selected.repo && (
            <div className="t11 mt-2">
              <a href={selected.repo} target="_blank" rel="noopener noreferrer" style={LINK}>
                View source on GitHub
              </a>
            </div>
          )}

          {/* Comments */}
          <div className="mt-4">
            <h2 className="t13" style={{ fontWeight: "bold", borderBottom: "1px solid #CCC", paddingBottom: 3 }}>
              Comments &amp; Responses
            </h2>

            <form
              className="mt-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!commentText.trim()) return
                setPosted((p) => [...p, { name: "You", when: "just now", text: commentText.trim() }])
                setCommentText("")
              }}
            >
              <textarea
                aria-label="Post a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                style={{ width: "100%", border: "1px solid #7F9DB9", padding: 3 }}
              />
              <button
                type="submit"
                style={{ border: "1px solid #999", background: "#EFEFEF", padding: "2px 10px", marginTop: 3 }}
              >
                Post a Comment
              </button>
            </form>

            <div className="mt-3" data-comments>
              {comments.map((c, i) => (
                <div key={`${c.name}-${i}`} style={{ borderTop: "1px solid #EEE", padding: "6px 0" }}>
                  <div className="t11">
                    <a href="#" style={{ ...LINK, fontWeight: "bold" }}>
                      {c.name}
                    </a>
                    {c.owner && <span style={{ color: "#666" }}> (Video Owner)</span>}
                    <span style={{ color: "#666" }}> &#8212; {c.when}</span>
                  </div>
                  <p style={{ marginTop: 2 }}>{c.text}</p>
                  {c.replies?.map((r, j) => (
                    <div key={j} style={{ marginLeft: 18, marginTop: 6, borderLeft: "2px solid #EEE", paddingLeft: 8 }}>
                      <div className="t11">
                        <a href="#" style={{ ...LINK, fontWeight: "bold" }}>
                          {r.name}
                        </a>
                        {r.owner && <span style={{ color: "#666" }}> (Video Owner)</span>}
                        <span style={{ color: "#666" }}> &#8212; {r.when}</span>
                      </div>
                      <p style={{ marginTop: 2 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related videos sidebar */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ border: "1px solid #CCC" }}>
            <div style={{ background: "#F0F0F0", borderBottom: "1px solid #CCC", padding: "3px 6px", fontWeight: "bold" }}>
              Related Videos
            </div>
            <div data-related>
              {PROJECTS.filter((p) => p.id !== selected.id).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex w-full gap-2 text-left"
                  style={{ padding: 6, borderBottom: "1px solid #EEE" }}
                >
                  <img
                    src="/images/demo-coming-soon.png"
                    alt=""
                    style={{ width: 60, height: 45, objectFit: "cover", border: "1px solid #CCC", flexShrink: 0 }}
                  />
                  <span>
                    <span className="t11" style={{ ...LINK, display: "block" }}>{p.title}</span>
                    <span className="t10" style={{ color: "#666" }}>
                      {p.views.toLocaleString()} views
                      <br />
                      From: JoelVasquez
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3" style={{ border: "1px solid #CCC" }}>
            <div style={{ background: "#F0F0F0", borderBottom: "1px solid #CCC", padding: "3px 6px", fontWeight: "bold" }}>
              About This Channel
            </div>
            <div className="t11" style={{ padding: 6, lineHeight: 1.5 }}>
              <strong>JoelVasquez</strong>
              <br />
              Backend &amp; infrastructure engineer.
              <br />
              Baruch College &#8217;27.
              <br />
              <a href="https://github.com/jguapp" target="_blank" rel="noopener noreferrer" style={LINK}>
                github.com/jguapp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="t10" style={{ borderTop: "1px solid #CCC", padding: "6px 10px", color: "#666" }}>
        &#169; 2005 YouTube, Inc. &nbsp;|&nbsp; Terms of Use &nbsp;|&nbsp; Privacy Policy
      </div>
    </div>
  )
}
