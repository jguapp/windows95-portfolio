export interface GalleryImage {
  id: number
  title: string
  src: string
  description: string
  date: string
  event: string
}

export interface EventCategory {
  id: string
  name: string
}

// Updated event categories - removed Fall 2024
export const eventCategories: EventCategory[] = [
  { id: "all", name: "All Events" },
  { id: "spring2025", name: "Club Events - Spring 2025" },
  { id: "nsbe", name: "NSBE Convention 2025" },
]

// Updated gallery images - removed Fall 2024 events
export const galleryImages: GalleryImage[] = [
  // Spring 2025 Events
  {
    id: 1,
    title: "Break Into Tech With CodePath - Baruch ColorStack Eboard",
    src: "/images/gallery/codepath-group1.jpeg",
    description: "Take a look at the wonderful Baruch ColorStack Eboard",
    date: "2025-04-24",
    event: "spring2025",
  },
  {
    id: 2,
    title: "Break Into Tech With CodePath - Group Photo",
    src: "/images/gallery/codepath-group2.jpeg",
    description: "Group picture of all of our attendees at the CodePath event!",
    date: "2025-04-24",
    event: "spring2025",
  },
  {
    id: 3,
    title: "Women's History Month - Panel Speakers",
    src: "/images/gallery/women-tech-panel.jpeg",
    description:
      "Our wonderful panel speakers at the ColorStack Women's History Month event celebrating Women of Color in Tech",
    date: "2025-03-25",
    event: "spring2025",
  },
  {
    id: 4,
    title: "Women's History Month - Group Photo",
    src: "/images/gallery/women-tech-group.jpeg",
    description: "Group photo of all the amazing people who came to ColorStack's Women's History Month panel at Baruch College",
    date: "2025-03-25",
    event: "spring2025",
  },
  {
    id: 5,
    title: "Bloomberg Office Visit - Tech Lab Workshop",
    src: "/images/gallery/bloomberg-visit.jpg",
    description:
      "All of the attendees at the Bloomberg Tech Lab on Campus workshop!",
    date: "2025-03-14",
    event: "spring2025",
  },
  {
    id: 6,
    title: "Bloomberg Office Visit - Baruch ColorStack Eboard selfie",
    src: "/images/gallery/bloomberg-outside.jpg",
    description:
      "ColorStack Baruch eboard selfie outside the Bloomberg!",
    date: "2025-03-14",
    event: "spring2025",
  },
  {
    id: 7,
    title: "Protiviti Technology Consulting Workshop",
    src: "/images/gallery/protiviti-workshop.jpeg",
    description:
      "Students working in small groups during the Protiviti case study workshop, with acutal Provitiviti consultants providing guidance on consulting challenges",
    date: "2025-02-20",
    event: "spring2025",
  },
  {
    id: 14,
    title: "Protiviti Technology Consulting - Group Photo",
    src: "/images/gallery/protiviti-group.jpeg",
    description:
      "Group photo of all of our participants with Protiviti representatives after completing the technology consulting workshop",
    date: "2025-02-20",
    event: "spring2025",
  },

  // NSBE Convention 2025
  {
    id: 8,
    title: "NSBE Convention - Opening Ceremony",
    src: "/images/gallery/nsbe-opening-ceremony.jpeg",
    description: "Main hall during the opening ceremony of the 2025 NSBE Annual Convention in Chicago",
    date: "2025-03-05",
    event: "nsbe",
  },
  {
    id: 9,
    title: "NSBE Convention - Day 1 Selfie",
    src: "/images/gallery/nsbe-career-fair.jpeg",
    description: "Students showcasing their convention badges at the NSBE career fair with company sponsors",
    date: "2025-03-06",
    event: "nsbe",
  },
  {
    id: 10,
    title: "NSBE Convention - Career Fair",
    src: "/images/gallery/nsbe-group1.jpeg",
    description: "Our chapter members standing outside the NSBE Career Fair!",
    date: "2025-03-07",
    event: "nsbe",
  },
]
