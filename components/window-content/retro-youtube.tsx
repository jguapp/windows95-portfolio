"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface VideoProject {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  description: string
  views: number
  uploadDate: string
  githubUrl?: string
  technologies: string[]
}

interface Comment {
  id: string
  name: string
  text: string
  date: string
  isChannelOwner?: boolean
  replies?: Reply[]
}

interface Reply {
  id: string
  name: string
  text: string
  date: string
  isChannelOwner: boolean
}

// Project-specific comments
const projectComments: Record<string, Comment[]> = {
  portfolio: [
    {
      id: "p1c1",
      name: "RetroTechFan",
      text: "This Windows 95 design is so nostalgic! How did you handle the window dragging functionality?",
      date: "2 weeks ago",
      replies: [
        {
          id: "p1c1r1",
          name: "JoelVasquez",
          text: "Thanks! For the window dragging, I used React's useRef and useState hooks along with mouse event listeners. The tricky part was making sure windows stay within viewport bounds and handling z-index for active windows.",
          date: "2 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p1c2",
      name: "WebDevNewbie",
      text: "Love the attention to detail with the pixelated icons and that startup sound! Did you create all the icons yourself?",
      date: "3 weeks ago",
      replies: [
        {
          id: "p1c2r1",
          name: "JoelVasquez",
          text: "I recreated some of the icons to match the Windows 95 aesthetic, but also used some authentic resources from that era. The startup sound is the actual Windows 95 boot audio!",
          date: "3 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p1c3",
      name: "UXDesigner2000",
      text: "This is amazing! How did you handle responsiveness with such a pixel-perfect design?",
      date: "1 month ago",
      replies: [
        {
          id: "p1c3r1",
          name: "JoelVasquez",
          text: "That was definitely challenging! I used a combination of CSS Grid, Flexbox, and media queries. For the desktop icons, I had to make sure they maintain their aspect ratio while scaling down on smaller screens.",
          date: "1 month ago",
          isChannelOwner: true,
        },
      ],
    },
  ],
  bloomberg: [
    {
      id: "p2c1",
      name: "FullStackDev",
      text: "How did you implement the Redis caching layer? Did you use any specific patterns?",
      date: "1 week ago",
      replies: [
        {
          id: "p2c1r1",
          name: "JoelVasquez",
          text: "I implemented a time-based cache invalidation strategy with Redis. For frequently accessed data, I used Redis Sorted Sets to maintain a priority queue, which helped optimize memory usage while keeping the most relevant data readily available.",
          date: "1 week ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p2c2",
      name: "DockerExpert",
      text: "Nice containerization setup! Did you face any challenges with the Docker networking between services?",
      date: "2 weeks ago",
      replies: [
        {
          id: "p2c2r1",
          name: "JoelVasquez",
          text: "Thanks! Initially, I had some issues with the Flask service not being able to connect to Redis. I solved it by setting up a custom Docker network and making sure the services could discover each other by container name. Also implemented health checks to ensure dependencies were ready before service startup.",
          date: "2 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p2c3",
      name: "ReactEnthusiast",
      text: "What state management solution did you use for the React frontend?",
      date: "3 weeks ago",
      replies: [
        {
          id: "p2c3r1",
          name: "JoelVasquez",
          text: "I used a combination of React Context API for global state and React Query for server state management. This separation helped keep the codebase clean while providing great performance for data fetching, caching, and synchronization with the backend.",
          date: "3 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
  ],
  sentiment: [
    {
      id: "p4c1",
      name: "MLEngineer",
      text: "What model architecture did you use for the sentiment analysis? LSTM or Transformer-based?",
      date: "1 week ago",
      replies: [
        {
          id: "p4c1r1",
          name: "JoelVasquez",
          text: "I used a BERT-based transformer model fine-tuned on the IMDB dataset. The pre-training really helped with understanding context in reviews, especially for detecting sarcasm and nuanced opinions.",
          date: "1 week ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p4c2",
      name: "DataScientist101",
      text: "What was your accuracy on the test set? Did you try any data augmentation techniques?",
      date: "3 weeks ago",
      replies: [
        {
          id: "p4c2r1",
          name: "JoelVasquez",
          text: "The model achieved 92% accuracy on the test set. I did use data augmentation including synonym replacement, random insertion/deletion, and back-translation which improved accuracy by about 3%.",
          date: "3 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p4c3",
      name: "NLPResearcher",
      text: "How are you handling negations in the text? That's usually tricky for sentiment analysis.",
      date: "1 month ago",
      replies: [
        {
          id: "p4c3r1",
          name: "JoelVasquez",
          text: "Great question! The transformer architecture helps with this, but I also added a preprocessing step that identifies negation patterns and marks them with special tokens. This improved performance on negation-heavy sentences by about 7%.",
          date: "1 month ago",
          isChannelOwner: true,
        },
      ],
    },
  ],
  chess: [
    {
      id: "p5c1",
      name: "ChessMaster2000",
      text: "What's the ELO rating of your chess AI? I'd love to play against it!",
      date: "2 weeks ago",
      replies: [
        {
          id: "p5c1r1",
          name: "JoelVasquez",
          text: "The AI plays at approximately 1600-1800 ELO depending on the difficulty setting. I calibrated it by testing against Stockfish at various depth settings. I'm working on a web version so people can play against it online!",
          date: "2 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p5c2",
      name: "AlgorithmNerd",
      text: "How deep does your minimax search go? And what evaluation function are you using?",
      date: "3 weeks ago",
      replies: [
        {
          id: "p5c2r1",
          name: "JoelVasquez",
          text: "The search depth varies from 3-6 plies depending on the position complexity and time constraints. For evaluation, I'm using a combination of material value, piece-square tables, pawn structure analysis, and king safety metrics.",
          date: "3 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p5c3",
      name: "PythonLearner",
      text: "Did you implement the chess rules from scratch or use a library?",
      date: "1 month ago",
      replies: [
        {
          id: "p5c3r1",
          name: "JoelVasquez",
          text: "I used the python-chess library for move generation and board representation, which saved a lot of time. This let me focus on the AI aspects rather than implementing all the chess rules (especially edge cases like en passant and castling rights).",
          date: "1 month ago",
          isChannelOwner: true,
        },
      ],
    },
  ],
  orbit: [
    {
      id: "p6c1",
      name: "iOSDeveloper",
      text: "The space theme is gorgeous! How did you implement the particle effects in the timer?",
      date: "1 week ago",
      replies: [
        {
          id: "p6c1r1",
          name: "JoelVasquez",
          text: "Thanks! I used SwiftUI's Canvas API combined with Core Animation for the particle system. The stars and planets are procedurally generated with different sizes and velocities, and I'm using SpriteKit for some of the more complex physics interactions during the timer completion animation.",
          date: "1 week ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p6c2",
      name: "UXEnthusiast",
      text: "The haptic feedback is so satisfying! What patterns did you use for different actions?",
      date: "2 weeks ago",
      replies: [
        {
          id: "p6c2r1",
          name: "JoelVasquez",
          text: "I created a custom haptic engine wrapper that provides different feedback patterns based on the action. For example, starting a timer uses a soft double tap, completing a session has a success pattern, and the countdown uses progressively stronger pulses. I also added spatial audio cues that complement the haptics for a more immersive experience.",
          date: "2 weeks ago",
          isChannelOwner: true,
        },
      ],
    },
    {
      id: "p6c3",
      name: "ProductivityNerd",
      text: "How did you approach the Eisenhower Matrix implementation? It's so intuitive!",
      date: "1 month ago",
      replies: [
        {
          id: "p6c3r1",
          name: "JoelVasquez",
          text: "I designed the Eisenhower Matrix with a drag-and-drop interface using SwiftUI's gesture recognizers. Tasks automatically sort into quadrants based on their priority and urgency attributes, but users can manually override the placement. The matrix also adapts to different screen sizes and orientation changes while maintaining the relative positions of tasks.",
          date: "1 month ago",
          isChannelOwner: true,
        },
      ],
    },
  ],
}

// Default comments for any project not in the map
const defaultComments: Comment[] = [
  {
    id: "d1",
    name: "CuriousCoder",
    text: "This is a really interesting project! What technologies did you use to build it?",
    date: "1 week ago",
    replies: [
      {
        id: "d1r1",
        name: "JoelVasquez",
        text: "Thanks! I built this using a combination of React, TypeScript, and Node.js. The frontend uses Tailwind CSS for styling, and the backend is connected to a MongoDB database.",
        date: "1 week ago",
      },
    ],
  },
  {
    id: "d2",
    name: "PortfolioReviewer",
    text: "Great addition to your portfolio! How long did this project take you to complete?",
    date: "2 weeks ago",
    replies: [
      {
        id: "d2r1",
        name: "JoelVasquez",
        text: "It took about 3 weeks of part-time work. Most of the time was spent on refining the UI and making sure the user experience was smooth.",
        date: "2 weeks ago",
      },
    ],
  },
]

export default function RetroYoutube() {
  const [selectedVideo, setSelectedVideo] = useState<VideoProject | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState({ name: "", text: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("All")
  const videoRef = useRef<HTMLVideoElement>(null)

  // Sample project data
  const projects: VideoProject[] = [
    {
      id: "portfolio",
      title: "Windows 95 Portfolio",
      thumbnail: "/images/demo-coming-soon.png",
      videoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/win95-demo-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd.mp4",
      description:
        "A nostalgic Windows 95-themed portfolio website built with React and Next.js. Features interactive windows, classic games, and retro UI elements.",
      views: 1254,
      uploadDate: "3/14/2024",
      githubUrl: "https://github.com/yourusername/win95-portfolio",
      technologies: ["React", "Next.js", "Tailwind CSS"],
    },
    {
      id: "bloomberg",
      title: "Bloomberg Tech Lab Project",
      thumbnail: "/images/demo-coming-soon.png",
      videoUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/weather-demo-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd.mp4",
      description:
        "Fullstack web application developed during Bloomberg-hosted Tech Lab using React, Flask, and Redis. Improved response times by 30% through optimized API calls and Redis caching. Deployed in a containerized environment with Docker and Docker Compose.",
      views: 872,
      uploadDate: "2/05/2024",
      githubUrl: "https://github.com/yourusername/bloomberg-tech-lab",
      technologies: ["React", "Flask", "Redis", "Docker"],
    },
    {
      id: "sentiment",
      title: "Sentiment Analysis Tool",
      thumbnail: "/images/demo-coming-soon.png",
      videoUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sentiment-demo-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd.mp4",
      description:
        "Machine learning model for sentiment analysis on movie reviews. Classifies text as positive, negative, or neutral with high accuracy.",
      views: 329,
      uploadDate: "3/01/2024",
      githubUrl: "https://github.com/yourusername/sentiment-analysis",
      technologies: ["Python", "TensorFlow", "NLP"],
    },
    {
      id: "chess",
      title: "AI Chess Bot",
      thumbnail: "/images/demo-coming-soon.png",
      videoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chess-demo-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd.mp4",
      description:
        "Chess engine using minimax algorithm with alpha-beta pruning. Features multiple difficulty levels and move suggestions.",
      views: 412,
      uploadDate: "2/10/2024",
      githubUrl: "https://github.com/yourusername/chess-ai",
      technologies: ["Python", "AI Algorithms"],
    },
    {
      id: "orbit",
      title: "ORBIT - Productivity Universe",
      thumbnail: "/images/demo-coming-soon.png",
      videoUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fitness-demo-Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd9Yd.mp4",
      description:
        "Modern iOS productivity app combining focus timer functionality with task management in a beautiful space-themed interface. Features include Pomodoro-style timers, Eisenhower Matrix task organization, habit tracking, screen time analytics, and customizable themes with haptic feedback.",
      views: 587,
      uploadDate: "4/15/2024",
      githubUrl: "https://github.com/yourusername/orbit-productivity",
      technologies: ["Swift", "SwiftUI", "Core Data", "CloudKit", "Haptics API"],
    },
  ]

  // Set the first video as selected by default and load its comments
  useEffect(() => {
    if (projects.length > 0 && !selectedVideo) {
      setSelectedVideo(projects[0])
      setComments(projectComments[projects[0].id] || defaultComments)
    }
  }, [projects, selectedVideo])

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  // Format time for display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Video playback failed:", err)
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseInt(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100
    }
  }

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number.parseFloat(e.target.value)
    setCurrentTime(seekTime)
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime
    }
  }

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.name && newComment.text) {
      const newCommentObj: Comment = {
        id: `new-${Date.now()}`,
        name: newComment.name,
        text: newComment.text,
        date: "Just now",
        replies: [],
      }

      setComments([newCommentObj, ...comments])
      setNewComment({ name: "", text: "" })
    }
  }

  // Filter projects based on search and category
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      category === "All" || project.technologies.some((tech) => tech.toLowerCase() === category.toLowerCase())

    return matchesSearch && matchesCategory
  })

  // Get unique categories from all projects
  const categories = ["All", ...Array.from(new Set(projects.flatMap((p) => p.technologies)))]

  return (
    <div className="retro-youtube bg-white text-black h-full overflow-auto">
      <style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`}</style>

      {/* Header - 2005 YouTube Style */}
      <div className="header bg-white border-b border-[#ccc] p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="logo">
            <img src="/2005-youtube-logo.png" alt="YouTube 2005" className="h-8" />
          </div>
          <div className="search-bar flex">
            <input
              type="text"
              placeholder="Search"
              className="px-2 py-1 border border-[#ccc] w-40 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-[#CCCCCC] text-black border border-[#999] px-2 py-1 text-xs">Search</button>
          </div>
        </div>
        <div className="nav-tabs flex border-b border-[#ccc] text-xs">
          <div className="tab px-3 py-1 border-r border-[#ccc] cursor-pointer hover:bg-[#f4f4f4]">Home</div>
          <div className="tab px-3 py-1 border-r border-[#ccc] cursor-pointer hover:bg-[#f4f4f4]">My Videos</div>
          <div className="tab px-3 py-1 border-r border-[#ccc] cursor-pointer hover:bg-[#f4f4f4]">Favorites</div>
          <div className="tab px-3 py-1 border-r border-[#ccc] cursor-pointer hover:bg-[#f4f4f4] bg-[#f4f4f4] font-bold">
            My Projects
          </div>
          <div className="tab px-3 py-1 cursor-pointer hover:bg-[#f4f4f4]">Subscriptions</div>
        </div>
      </div>

      {/* Main Content - 2005 YouTube Style */}
      <div className="flex flex-col md:flex-row bg-[#f9f9f9] p-2">
        {/* Left Column - Video Player */}
        <div className="video-player w-full md:w-3/4 pr-2">
          {selectedVideo && (
            <>
              {/* Video Title - Above video in 2005 style */}
              <div className="video-title mb-2">
                <h2 className="text-base font-bold text-[#333]">{selectedVideo.title}</h2>
              </div>

              {/* Video Container - More boxy 2005 style */}
              <div className="video-container bg-black border border-[#ccc] relative overflow-hidden mb-2">
                <video
                  ref={videoRef}
                  src={selectedVideo.videoUrl}
                  className="w-full aspect-video"
                  poster={selectedVideo.thumbnail}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Play/Pause Overlay - Simpler 2005 style */}
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                  {!isPlaying && (
                    <div className="bg-black bg-opacity-50 rounded-sm p-2">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-16 border-transparent border-l-white"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Controls - 2005 style */}
              <div className="video-controls bg-[#f2f2f2] p-1 border border-[#ccc] flex items-center mb-3">
                <button
                  className="bg-[#e5e5e5] text-black border border-[#ccc] px-2 py-0.5 mr-2 text-xs"
                  onClick={togglePlay}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>

                <div className="flex-1 mx-2 flex items-center">
                  <span className="text-xs mr-2">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1"
                    style={{ height: "6px" }}
                  />
                  <span className="text-xs ml-2">{formatTime(duration)}</span>
                </div>

                <div className="volume-control flex items-center">
                  <span className="text-xs mr-1">Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-12"
                    style={{ height: "6px" }}
                  />
                </div>
              </div>

              {/* Video Info - 2005 style */}
              <div className="video-info mb-3 text-xs">
                <div className="flex justify-between mb-1">
                  <div>
                    <span className="text-[#666]">Added: {selectedVideo.uploadDate}</span>
                    <span className="text-[#666] ml-3">
                      From: <span className="text-[#0033CC]">JoelVasquez</span>
                    </span>
                  </div>
                  <div className="views text-[#666]">{selectedVideo.views.toLocaleString()} views</div>
                </div>

                <div className="flex justify-between mb-2">
                  <div className="rating flex items-center">
                    <span className="mr-1">Rating:</span>
                    <div className="stars flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-[#f90] text-lg">
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-1">(32 ratings)</span>
                  </div>
                  <div className="actions">
                    <button className="bg-[#e5e5e5] text-[#333] border border-[#ccc] px-2 py-0.5 mr-1 text-xs">
                      Share
                    </button>
                    <button className="bg-[#e5e5e5] text-[#333] border border-[#ccc] px-2 py-0.5 text-xs">
                      Favorite
                    </button>
                  </div>
                </div>

                <div className="description bg-white border border-[#ccc] p-2">
                  <p>{selectedVideo.description}</p>
                  <div className="mt-2">
                    <span className="font-bold">Technologies: </span>
                    {selectedVideo.technologies.map((tech, index) => (
                      <span key={index} className="text-xs bg-[#f2f2f2] border border-[#ccc] px-1 mr-1">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {selectedVideo.githubUrl && (
                    <a
                      href={selectedVideo.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-[#0033CC] underline"
                    >
                      View on GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Comments Section - 2005 style */}
              <div className="comments-section mb-3">
                <h3 className="text-sm font-bold border-b border-[#ccc] pb-1 mb-2">
                  Comments & Responses ({comments.length})
                </h3>

                {/* Comment Form - 2005 style */}
                <form onSubmit={handleCommentSubmit} className="mb-4 bg-[#f2f2f2] border border-[#ccc] p-2">
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Username:</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full px-2 py-1 border border-[#ccc] text-xs"
                      value={newComment.name}
                      onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Comment:</label>
                    <textarea
                      placeholder="Add a comment..."
                      className="w-full px-2 py-1 border border-[#ccc] h-16 text-xs"
                      value={newComment.text}
                      onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                    ></textarea>
                  </div>
                  <button type="submit" className="bg-[#e5e5e5] text-[#333] border border-[#ccc] px-2 py-1 text-xs">
                    Post Comment
                  </button>
                </form>

                {/* Comments List - 2005 style */}
                <div className="comments-list">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className={`comment mb-3 pb-2 border-b border-[#ccc] ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-xs text-[#0033CC]">
                          {comment.name} {comment.isChannelOwner && "(Video Owner)"}
                        </span>
                        <span className="text-xs text-[#666]">{comment.date}</span>
                      </div>
                      <p className="text-xs mb-1">{comment.text}</p>
                      <div className="text-xs text-[#0033CC] cursor-pointer">Reply to this comment</div>

                      {/* Replies - 2005 style */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies ml-4 mt-2 border-l-2 border-[#ccc] pl-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="reply mt-2 bg-[#f2f2f2] p-1">
                              <div className="flex justify-between mb-1">
                                <span className="font-bold text-xs text-[#0033CC]">
                                  {reply.name} {reply.isChannelOwner && "(Video Owner)"}
                                </span>
                                <span className="text-xs text-[#666]">{reply.date}</span>
                              </div>
                              <p className="text-xs">{reply.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Related Videos */}
        <div className="related-videos w-full md:w-1/4">
          {/* Categories - 2005 style */}
          <div className="categories mb-3 border border-[#ccc] bg-white">
            <h3 className="text-xs font-bold bg-[#f2f2f2] p-2 border-b border-[#ccc]">Categories</h3>
            <div className="p-2 flex flex-wrap gap-1">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  className={`text-xs px-2 py-0.5 border ${
                    category === cat ? "bg-[#e5e5e5] border-[#ccc] font-bold" : "bg-white border-[#ccc]"
                  }`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Video List - 2005 style */}
          <div className="video-list border border-[#ccc] bg-white">
            <h3 className="text-xs font-bold bg-[#f2f2f2] p-2 border-b border-[#ccc]">Related Videos</h3>

            {filteredProjects.length === 0 ? (
              <p className="text-xs text-center py-4">No videos match your search criteria</p>
            ) : (
              <div className="p-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`video-item mb-2 pb-2 border-b border-[#ccc] cursor-pointer ${
                      selectedVideo?.id === project.id ? "bg-[#f2f2f2]" : ""
                    }`}
                    onClick={() => {
                      setSelectedVideo(project)
                      setComments(projectComments[project.id] || defaultComments)
                    }}
                  >
                    <div className="flex mb-1">
                      <div className="thumbnail w-20 h-15 bg-black mr-2 flex-shrink-0 border border-[#ccc]">
                        <img
                          src={project.thumbnail || "/placeholder.svg"}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="video-details flex-1">
                        <h4 className="text-xs font-bold text-[#0033CC] hover:underline">{project.title}</h4>
                        <div className="text-[10px] text-[#666] mt-0.5">
                          <div>{project.views.toLocaleString()} views</div>
                          <div>Added: {project.uploadDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2005-style Ads */}
          <div className="ads mt-3 border border-[#ccc] bg-white">
            <h3 className="text-xs font-bold bg-[#f2f2f2] p-2 border-b border-[#ccc]">Advertisements</h3>
            <div className="p-2">
              <div className="ad mb-2 border border-[#ccc] p-1 text-center">
                <div className="text-xs font-bold">Download Firefox 1.5!</div>
                <div className="text-[10px]">The browser that's changing the web</div>
                <img src="/firefox_1_5_banner_2005.png" alt="Firefox 1.5" className="w-full h-12 object-contain mt-1" />
              </div>
              <div className="ad mb-2 border border-[#ccc] p-1 text-center">
                <div className="text-xs font-bold">iPod Video - 30GB $299</div>
                <div className="text-[10px]">Watch videos on the go!</div>
                <img src="/retro-ipod-ad.png" alt="iPod Video" className="w-full h-12 object-contain mt-1" />
              </div>
              <div className="ad mb-2 border border-[#ccc] p-1 text-center">
                <div className="text-xs font-bold">MySpace - A Place for Friends</div>
                <div className="text-[10px]">Connect with friends online!</div>
                <img src="/myspace-ad-2005.png" alt="MySpace" className="w-full h-12 object-contain mt-1" />
              </div>
              <div className="ad mb-2 border border-[#ccc] p-1 text-center">
                <div className="text-xs font-bold">Windows XP - Experience</div>
                <div className="text-[10px]">Upgrade to the best Windows ever</div>
                <img src="/windows-xp-ad.png" alt="Windows XP" className="w-full h-12 object-contain mt-1" />
              </div>
              <div className="ad mb-2 border border-[#ccc] p-1 text-center">
                <div className="text-xs font-bold">Nokia N-Gage - Game On!</div>
                <div className="text-[10px]">Mobile gaming revolution</div>
                <img src="/nokia-ngage-ad.png" alt="Nokia N-Gage" className="w-full h-12 object-contain mt-1" />
              </div>
              <div className="ad p-1 border border-[#ccc] text-center">
                <div className="text-xs font-bold">Napster To Go - $14.95/mo</div>
                <div className="text-[10px]">All the music you want!</div>
                <img src="/napster-ad.png" alt="Napster" className="w-full h-12 object-contain mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - 2005 YouTube Style */}
      <div className="footer bg-white border-t border-[#ccc] p-2 mt-2 text-center text-xs">
        <div className="links flex justify-center space-x-3 mb-1">
          <a href="#" className="text-[#0033CC] hover:underline">
            Help
          </a>
          <a href="#" className="text-[#0033CC] hover:underline">
            About
          </a>
          <a href="#" className="text-[#0033CC] hover:underline">
            Terms of Use
          </a>
          <a href="#" className="text-[#0033CC] hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="text-[#0033CC] hover:underline">
            Copyright
          </a>
          <a href="#" className="text-[#0033CC] hover:underline">
            Contact
          </a>
        </div>
        <p className="text-[#666]">© 2005 YouTube, LLC</p>
      </div>
    </div>
  )
}
