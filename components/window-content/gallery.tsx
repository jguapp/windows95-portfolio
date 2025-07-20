"use client"

import { useState, useEffect } from "react"
import { galleryImages, eventCategories } from "./gallery-data"

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [slideshow, setSlideshow] = useState(false)
  const [slideshowIndex, setSlideshowIndex] = useState(0)

  // Filter images by category
  const filteredImages = galleryImages.filter((image) => selectedCategory === "all" || image.event === selectedCategory)

  // Sort images
  const sortedImages = [...filteredImages].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }
  })

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Handle slideshow
  useEffect(() => {
    if (!slideshow) return

    const interval = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % sortedImages.length)
      setSelectedImage(sortedImages[slideshowIndex]?.id || null)
    }, 3000)

    return () => clearInterval(interval)
  }, [slideshow, slideshowIndex, sortedImages])

  // Format date to Windows 95 style
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] text-black">
      {/* Menu Bar */}
      <div className="menu-bar bg-[#c0c0c0] flex p-[4px_8px] gap-[10px] text-xs border-b border-[#808080]">
        <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">File</span>
        <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">Edit</span>
        <span className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black">View</span>
        <span
          className="cursor-pointer p-[2px_5px] hover:bg-[#ffffff] hover:border hover:border-black"
          onClick={() => setShowHelp(true)}
        >
          Help
        </span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#c0c0c0] flex p-2 border-b border-[#808080] items-center">
        <div className="flex space-x-2 mr-4">
          <button
            className="px-2 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
            onClick={() => setViewMode("grid")}
          >
            Grid View
          </button>
          <button
            className="px-2 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
            onClick={() => setViewMode("list")}
          >
            List View
          </button>
        </div>

        <div className="flex items-center space-x-2 mr-4">
          <span className="text-xs">Sort by:</span>
          <select
            className="text-xs bg-white border border-[#808080] px-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "title")}
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
          </select>
          <button
            className="px-2 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <button
          className="px-2 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
          onClick={() => {
            setSlideshow(!slideshow)
            if (!slideshow && sortedImages.length > 0) {
              setSelectedImage(sortedImages[0].id)
              setSlideshowIndex(0)
            }
          }}
        >
          {slideshow ? "Stop Slideshow" : "Start Slideshow"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Categories */}
        <div className="w-48 bg-[#c0c0c0] border-r border-[#808080] p-2 overflow-y-auto">
          <div className="text-xs font-bold mb-2">Event Categories:</div>
          <div className="space-y-1">
            {eventCategories.map((category) => (
              <div
                key={category.id}
                className={`text-xs p-1 cursor-pointer ${selectedCategory === category.id ? "bg-[#000080] text-white" : "hover:bg-[#d0d0d0]"}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[#808080] pt-2">
            <div className="text-xs font-bold mb-2">Image Information:</div>
            {selectedImage !== null && (
              <div className="text-xs space-y-1">
                {galleryImages.find((img) => img.id === selectedImage) && (
                  <>
                    <div>
                      <span className="font-bold">Title:</span>{" "}
                      {galleryImages.find((img) => img.id === selectedImage)?.title}
                    </div>
                    <div>
                      <span className="font-bold">Date:</span>{" "}
                      {formatDate(galleryImages.find((img) => img.id === selectedImage)?.date || "")}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white overflow-auto p-4 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-64 h-6 bg-[#c0c0c0] border border-[#808080] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] mb-2">
                <div className="h-full bg-[#000080]" style={{ width: `${Math.random() * 100}%` }}></div>
              </div>
              <div className="text-xs">Loading gallery images...</div>
            </div>
          ) : selectedImage !== null ? (
            // Image Viewer
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center bg-[#000000] relative">
                <img
                  src={galleryImages.find((img) => img.id === selectedImage)?.src || ""}
                  alt={galleryImages.find((img) => img.id === selectedImage)?.title || ""}
                  className="h-[70vh] w-[80%] object-cover"
                />

                {/* Navigation Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <button
                    className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
                    onClick={() => {
                      const currentIndex = sortedImages.findIndex((img) => img.id === selectedImage)
                      const prevIndex = (currentIndex - 1 + sortedImages.length) % sortedImages.length
                      setSelectedImage(sortedImages[prevIndex].id)
                      setSlideshowIndex(prevIndex)
                    }}
                  >
                    Previous
                  </button>
                  <button
                    className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
                    onClick={() => setSelectedImage(null)}
                  >
                    Back to Gallery
                  </button>
                  <button
                    className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
                    onClick={() => {
                      const currentIndex = sortedImages.findIndex((img) => img.id === selectedImage)
                      const nextIndex = (currentIndex + 1) % sortedImages.length
                      setSelectedImage(sortedImages[nextIndex].id)
                      setSlideshowIndex(nextIndex)
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Image Description */}
              <div className="bg-[#c0c0c0] p-2 border-t border-[#808080]">
                <div className="text-sm font-bold">{galleryImages.find((img) => img.id === selectedImage)?.title}</div>
                <div className="text-xs mt-1">{galleryImages.find((img) => img.id === selectedImage)?.description}</div>
                <div className="text-xs mt-1">
                  <span className="font-bold">Date:</span>{" "}
                  {formatDate(galleryImages.find((img) => img.id === selectedImage)?.date || "")}
                </div>
              </div>
            </div>
          ) : // Gallery Grid/List View
          viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-4">
              {sortedImages.map((image) => (
                <div
                  key={image.id}
                  className="border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] p-2 cursor-pointer hover:bg-[#efefef]"
                  onClick={() => setSelectedImage(image.id)}
                >
                  <div className="h-32 bg-[#000000] flex items-center justify-center mb-2 overflow-hidden">
                    <img
                      src={image.src || "/placeholder.svg"}
                      alt={image.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-bold truncate">{image.title}</div>
                  <div className="text-xs">{formatDate(image.date)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000]">
              <table className="w-full text-xs">
                <thead className="bg-[#c0c0c0] border-b border-[#808080]">
                  <tr>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedImages.map((image, index) => (
                    <tr
                      key={image.id}
                      className={`cursor-pointer hover:bg-[#000080] hover:text-white ${index % 2 === 0 ? "bg-white" : "bg-[#f0f0f0]"}`}
                      onClick={() => setSelectedImage(image.id)}
                    >
                      <td className="p-2">{image.title}</td>
                      <td className="p-2">{formatDate(image.date)}</td>
                      <td className="p-2">{eventCategories.find((cat) => cat.id === image.event)?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-5 bg-[#c0c0c0] border-t border-[#808080] flex items-center text-xs px-2">
        <span>{sortedImages.length} items</span>
        <span className="ml-auto">
          {selectedCategory === "all" ? "All Events" : eventCategories.find((cat) => cat.id === selectedCategory)?.name}
        </span>
      </div>

      {/* Help Dialog */}
      {showHelp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#c0c0c0] border-2 border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] w-96">
            <div className="bg-[#000080] text-white p-1 flex justify-between items-center">
              <span className="font-bold">Gallery Help</span>
              <button
                className="w-5 h-5 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] flex items-center justify-center text-black"
                onClick={() => setShowHelp(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold mb-2">Using the Gallery</h3>
              <ul className="text-xs space-y-2">
                <li>
                  <span className="font-bold">View Images:</span> Click on any thumbnail to view the full image.
                </li>
                <li>
                  <span className="font-bold">Navigate:</span> Use Previous and Next buttons to browse through images.
                </li>
                <li>
                  <span className="font-bold">Categories:</span> Select a category from the left sidebar to filter
                  images.
                </li>
                <li>
                  <span className="font-bold">View Modes:</span> Switch between Grid and List views using the toolbar
                  buttons.
                </li>
                <li>
                  <span className="font-bold">Sort:</span> Sort images by date or title in ascending or descending
                  order.
                </li>
                <li>
                  <span className="font-bold">Slideshow:</span> Click "Start Slideshow" to automatically cycle through
                  images.
                </li>
              </ul>
              <div className="mt-4 flex justify-center">
                <button
                  className="px-4 py-1 bg-[#c0c0c0] border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] hover:bg-[#d0d0d0] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] text-xs"
                  onClick={() => setShowHelp(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
