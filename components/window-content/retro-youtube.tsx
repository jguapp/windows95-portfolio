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

/**
 * Player and rail sizes.
 *
 * The player was 420x236, which is a thumbnail rather than a video. YouTube's
 * default non-theatre player is 640 wide, and the related rail beside it is
 * wide enough to read a title in two lines rather than five.
 */
/** The floor for the player column. It grows past this to fill the window. */
const PLAYER_W = 640
/** The rail is the fixed column now, wide enough for a 120px thumbnail and a
 *  title in two lines. */
const RAIL_W = 320
const RAIL_THUMB_W = 120
const RAIL_THUMB_H = 90

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
  {
    id: "sentiment",
    title: "IMDB Sentiment Classifier - Reading 50,000 Reviews",
    description: `A sentiment model trained on fifty thousand IMDB reviews, which predicts whether a review it has never seen is positive or negative.

The interesting part of a task like this is not the accuracy number, it is what the model gets wrong. Sarcasm, faint praise and reviews that spend four paragraphs on the plot before one line of verdict are where a bag of words falls apart and where the work actually is.`,
    views: 1105,
    added: "11/14/2025",
    rating: 4,
    ratings: 22,
    tags: ["python", "jupyter", "nlp", "scikit-learn", "sentiment-analysis"],
    repo: "https://github.com/jguapp/IMDB-Reviews-Sentiment-Classifier",
  },
  {
    id: "sorting",
    title: "Sorting Algorithm Visualiser - Watch Them Race",
    description: `Bars on a screen, sorted in front of you, one comparison at a time.

Reading that quicksort is O(n log n) and watching it tear through a thousand bars while bubble sort is still working on the first fifty are different kinds of understanding, and only one of them survives an interview.`,
    views: 1492,
    added: "9/22/2025",
    rating: 5,
    ratings: 31,
    tags: ["python", "algorithms", "visualisation", "pygame"],
    repo: "https://github.com/jguapp/sorting-algorithm-visualizer",
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
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
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
    {
      name: "sync_or_swim",
      when: "2 months ago",
      text: "How do you handle a save that happens on two devices while one is offline?",
      replies: [
        {
          name: "jguapp",
          when: "2 months ago",
          owner: true,
          text: "Last write wins per field, not per article. Two devices editing different things merge cleanly; the same field twice keeps the newer stamp. Boring and predictable beats clever and wrong for a reading list.",
        },
      ],
    },
  ],
  calligraphy: [
    {
      name: "gopher99",
      when: "1 month ago",
      text: "Curious why Redis for the queue rather than NATS or Kafka?",
      replies: [
        {
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
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
    {
      name: "channel_select",
      when: "2 months ago",
      text: "What happens to a job whose worker dies mid-run? Does it just vanish?",
      replies: [
        {
          name: "jguapp",
          when: "2 months ago",
          owner: true,
          text: "A reaper reclaims anything that sat in the processing set past its lease. It goes back to pending with its retry count up by one, so a dead worker costs latency, not the job.",
        },
      ],
    },
    {
      name: "goroutine_greg",
      when: "3 months ago",
      text: "worker pools in go are half the tutorial content on the internet and still everyone ships one with a leak",
    },
  ],
  portfolio: [
    {
      name: "RetroTechFan",
      when: "2 weeks ago",
      text: "The window dragging feels right. How are you handling resize from the top and left edges?",
      replies: [
        {
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
          when: "1 month ago",
          owner: true,
          text: "It reads the same virtual drive Explorer and Notepad use. Save a file in Notepad and you can type it out in DOS without reloading anything.",
        },
      ],
    },
    {
      name: "msdos_forever",
      when: "5 days ago",
      text: "Typed dir in the DOS prompt expecting a joke and got an actual directory listing of an actual file tree. Respect.",
      replies: [
        {
          name: "jguapp",
          when: "5 days ago",
          owner: true,
          text: "The C: drive is one tree that DOS, Explorer, Notepad and Find all share. Save a file in one and the others see it, which is the part that makes it feel like a computer instead of a set.",
        },
      ],
    },
    {
      name: "y2k_prepper",
      when: "1 week ago",
      text: "does the clock survive the year 2000",
    },
  ],
  rmp: [
    {
      name: "cunyfirst_survivor",
      when: "3 days ago",
      text: "Registration used to mean twenty tabs open at once. This is the thing I wanted for four years.",
      replies: [
        {
          name: "jguapp",
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
          name: "jguapp",
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
          name: "jguapp",
          when: "1 week ago",
          owner: true,
          text: "All 26 CUNY colleges. It reads which campus you are on straight off the page rather than asking you to pick.",
        },
      ],
    },
    {
      name: "manifest_v3_victim",
      when: "2 weeks ago",
      text: "Content script or does it hit an API from the background worker? MV3 killed half my extensions.",
      replies: [
        {
          name: "jguapp",
          when: "2 weeks ago",
          owner: true,
          text: "Content script reads the instructor names off the page and the service worker does the lookups, so the ratings request never runs in page context. MV3's service worker lifecycle is the annoying part; every lookup has to assume the worker just woke up.",
        },
      ],
    },
    {
      name: "prof_shopper",
      when: "3 weeks ago",
      text: "The amount of time this saves during enrollment week is honestly embarrassing to admit",
    },
    {
      name: "webstore_wary",
      when: "1 month ago",
      text: "What data does it collect? Asking before I install anything with access to my student portal.",
      replies: [
        {
          name: "jguapp",
          when: "1 month ago",
          owner: true,
          text: "None. No analytics, no account, nothing leaves the browser except the rating lookups themselves, and those carry professor names only. The source is public if you would rather read than trust.",
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
          name: "jguapp",
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
          name: "jguapp",
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
    {
      name: "hero_banner_hater",
      when: "2 weeks ago",
      text: "Autoplaying hero video on a sports site is brave. Data usage?",
      replies: [
        {
          name: "jguapp",
          when: "2 weeks ago",
          owner: true,
          text: "The hero is a poster frame until you interact. Autoplay on a page you opened to browse fixtures is how you lose people on mobile plans.",
        },
      ],
    },
    {
      name: "kickoff_karen",
      when: "3 weeks ago",
      text: "Timezones. Every sports site gets them wrong. Tell me kickoff shows in my time.",
      replies: [
        {
          name: "jguapp",
          when: "3 weeks ago",
          owner: true,
          text: "Everything renders from the viewer's clock. The schedule data is stored in UTC and formatted at the edge of the UI, never before.",
        },
      ],
    },
    {
      name: "relegation_zone",
      when: "1 month ago",
      text: "the hover card showing form over the last five fixtures is a nice touch",
    },
  ],
  sentiment: [
    {
      name: "df_head",
      when: "2 months ago",
      text: "What did it actually get wrong? Everyone posts the accuracy and nobody posts the failures.",
      replies: [
        {
          name: "jguapp",
          when: "2 months ago",
          owner: true,
          text: "Sarcasm, mostly, and reviews that describe the plot for four paragraphs and give the verdict in one line. A bag of words weights all of that equally, so a glowing plot summary of a film someone hated reads as positive.",
        },
      ],
    },
    {
      name: "notebook_nate",
      when: "3 months ago",
      text: "50k reviews is the classic dataset. Did you hold out a proper test set or just cross-validate?",
    },
    {
      name: "tfidf_tina",
      when: "2 months ago",
      text: "Raw counts or tf-idf? It changes what the model pays attention to more than people expect.",
      replies: [
        {
          name: "jguapp",
          when: "2 months ago",
          owner: true,
          text: "Both, compared. Downweighting the words that appear everywhere helps exactly as advertised: the model stops caring that every review contains the word movie.",
        },
      ],
    },
    {
      name: "gpu_poor",
      when: "3 months ago",
      text: "Refreshing to see a linear model instead of somebody fine-tuning a transformer to classify movie reviews on a laptop",
    },
    {
      name: "overfit_owen",
      when: "3 months ago",
      text: "What did the confusion matrix look like? Balanced misses or one-sided?",
      replies: [
        {
          name: "jguapp",
          when: "3 months ago",
          owner: true,
          text: "Close to symmetric, which the balanced dataset makes easier. The interesting errors were not the counts but the confident ones: five-star vocabulary wrapped around a negative verdict.",
        },
      ],
    },
    {
      name: "ml_lurker",
      when: "4 months ago",
      text: "the error analysis section is the part most write-ups skip. good on you for reading the actual misclassified reviews",
    },
  ],
  sorting: [
    {
      name: "bigO_bandit",
      when: "4 months ago",
      text: "The bubble sort one hurts to watch. That is the point though isn't it.",
      replies: [
        {
          name: "jguapp",
          when: "4 months ago",
          owner: true,
          text: "Entirely the point. You can read O(n squared) and nod, or you can watch it still working on the first fifty bars while quicksort has finished and gone home.",
        },
      ],
    },
    {
      name: "merge_purist",
      when: "3 months ago",
      text: "Merge sort looking stately and predictable while quicksort thrashes around and still wins. Poetry.",
      replies: [
        {
          name: "jguapp",
          when: "3 months ago",
          owner: true,
          text: "Until you hand quicksort a sorted array with a bad pivot choice and the poetry ends. The visualiser makes that failure mode watchable too.",
        },
      ],
    },
    {
      name: "cs101_ta",
      when: "4 months ago",
      text: "Sent this to my recitation section instead of explaining partitioning for the fifth time. It did my job better than I do.",
    },
    {
      name: "insertion_enjoyer",
      when: "4 months ago",
      text: "insertion sort on nearly-sorted input deserves more respect and this shows why",
    },
    {
      name: "audio_on",
      when: "5 months ago",
      text: "the pitch mapped to bar height turns every algorithm into a little song. bubble sort is a dirge",
    },
    {
      name: "shellsort_stan",
      when: "5 months ago",
      text: "No shell sort? The gap sequence race is the best one.",
      replies: [
        {
          name: "jguapp",
          when: "5 months ago",
          owner: true,
          text: "Fair request. The frame is built to take another algorithm as one function plus a name, so it is on the list.",
        },
      ],
    },
  ],
  orbit: [
    {
      name: "adhd_dev",
      when: "2 months ago",
      text: "Most ADHD apps are a to-do list with a nicer font. The Eisenhower Matrix next to the timer is actually the workflow.",
      replies: [
        {
          name: "jguapp",
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
          name: "jguapp",
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
    {
      name: "widget_wendy",
      when: "3 months ago",
      text: "Does the timer survive backgrounding? Half the focus apps quietly stop counting when iOS suspends them.",
      replies: [
        {
          name: "jguapp",
          when: "3 months ago",
          owner: true,
          text: "The end time is stored, not the elapsed seconds, so suspension costs nothing: on return the display recomputes from the clock. A notification fires at the end either way.",
        },
      ],
    },
    {
      name: "quadrant_two",
      when: "4 months ago",
      text: "important-not-urgent is where my whole life lives and no app ever makes it visible. the matrix as the home screen is the right call",
    },
    {
      name: "not_a_designer",
      when: "4 months ago",
      text: "what did you build the ui in, storyboards or swiftui?",
      replies: [
        {
          name: "jguapp",
          when: "4 months ago",
          owner: true,
          text: "SwiftUI throughout. The matrix is a LazyVGrid and the timer ring is one Canvas view; storyboards never entered the conversation.",
        },
      ],
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
          <img src="/2005-youtube-logo.png" alt="YouTube" style={{ height: 52 }} />
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
        <div style={{ flex: 1, minWidth: PLAYER_W }}>
          <h1 className="t15" style={{ fontWeight: "bold", marginBottom: 6 }}>{selected.title}</h1>

          {/* Flash-era player */}
          {/* Fills the column so nothing is left over on the right, with the
              height capped so the controls, description and comments stay above
              the fold on a maximised window. A player letterboxing a video is
              normal; a player you have to scroll past is not. */}
          <div
            data-player
            style={{
              background: "#000",
              width: "100%",
              height: "clamp(320px, 54vh, 620px)",
              position: "relative",
            }}
          >
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
              jguapp
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
        <div style={{ width: RAIL_W, flexShrink: 0 }}>
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
                    style={{
                      width: RAIL_THUMB_W,
                      height: RAIL_THUMB_H,
                      objectFit: "cover",
                      border: "1px solid #CCC",
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    <span className="t11" style={{ ...LINK, display: "block" }}>{p.title}</span>
                    <span className="t10" style={{ color: "#666" }}>
                      {p.views.toLocaleString()} views
                      <br />
                      From: jguapp
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
              <p style={{ marginBottom: 6 }}>
                <strong>Name:</strong> Joel Vasquez
                <br />
                <strong>Channel Views:</strong> 12,847
                <br />
                <strong>Joined:</strong> March 2005
              </p>
              <p style={{ marginBottom: 6 }}>
                Computer Science student at Baruch College, class of 2027, focused on backend and infrastructure
                engineering. Software Engineer Intern at Liberty Mutual. Previously built AI agent pipelines at the
                Robert Wood Johnson Foundation and data pipelines at the CUNY Institute for Demographic Research.
              </p>
              <p style={{ marginBottom: 6 }}>
                This channel collects my projects: distributed systems, APIs, developer tools and the occasional
                game. Source for everything is on GitHub.
              </p>
              <p>
                <a href="https://github.com/jguapp" target="_blank" rel="noopener noreferrer" style={LINK}>
                  github.com/jguapp
                </a>
                {" · "}
                <a href="https://builtbyjoel.dev" target="_blank" rel="noopener noreferrer" style={LINK}>
                  builtbyjoel.dev
                </a>
              </p>
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
