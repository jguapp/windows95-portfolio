"use client"

import type React from "react"

/**
 * About Me, as a 2004 theFacebook profile.
 *
 * One component per section of the page, with the repeated markup driven by
 * data: the friends grid and the six information tables were near-identical
 * blocks pasted out by hand before this was split up.
 */

const NAV_LINKS = ["home", "search", "global", "social net", "invite", "faq", "logout"]

const SIDEBAR_LINKS = [
  "My Profile [ edit ]",
  "My Friends",
  "My Groups",
  "My Parties",
  "My Messages",
  "My Account",
  "My Privacy",
]

const FRIENDS = [
  { name: "Finn", src: "/images/blob/finn.jpeg" },
  { name: "Lelouch", src: "/images/blob/0a3bb1327b9e5f47b8793c63542219da.jpeg" },
  { name: "Cloud", src: "/images/blob/plau5p3a-400x400.jpeg" },
  { name: "Pancham", src: "/images/blob/d0547869a59f49cdcb23cf042d125d52.jpeg" },
  { name: "Aigis", src: "/images/blob/6jgfqdqw0dkb1.png" },
  { name: "Vader", src: "/images/blob/a75a12a66a148b903918388091c9bdcd.jpeg" },
]

/** A row of one of the profile's information tables. */
interface InfoRow {
  label: string
  value: React.ReactNode
  /** theFacebook rendered linkable values in its blue. */
  blue?: boolean
}

const ACCOUNT_ROWS: InfoRow[] = [
  { label: "Name:", value: "Joel Vasquez" },
  { label: "Member Since:", value: "February 4, 2004" },
  { label: "Last Update:", value: "August 16, 2026" },
]

const BASIC_ROWS: InfoRow[] = [
  { label: "School:", value: "Baruch College '27", blue: true },
  { label: "Status:", value: "Student" },
  { label: "Sex:", value: "Male", blue: true },
  { label: "Residence:", value: "New York, NY", blue: true },
  { label: "Birthday:", value: "May 21st" },
]

const CONTACT_ROWS: InfoRow[] = [
  { label: "Email:", value: "jfvasq1@gmail.com", blue: true },
  { label: "Screename:", value: "jguapp", blue: true },
  {
    label: "Websites:",
    value: (
      <>
        https://github.com/jguapp
        <br />
        https://www.linkedin.com/in/jvasquezcs/
      </>
    ),
    blue: true,
  },
]

const PERSONAL_ROWS: InfoRow[] = [
  { label: "Looking For:", value: "Networking, New Grad Opportunities", blue: true },
  { label: "Interested In:", value: "Backend, Infrastructure, Machine Learning", blue: true },
  {
    label: "Interests:",
    value:
      "Reading, Writing, Open Source, Basketball, Lego, Watching Movies, Guitar, Gaming, Math, Coding, Working Out, Sleeping",
    blue: true,
  },
]

const MUSIC_ROWS: InfoRow[] = [
  {
    label: "Favorite Music:",
    value:
      "The Strokes, Arctic Monkeys, Radiohead, Mac Miller, Kendrick Lamar, Bob Dylan, Marvin Gaye, Faye Webster, Stevie Wonder, Queen, Michael Jackson, Billy Joel, Tame Impala",
    blue: true,
  },
]

const MOVIE_ROWS: InfoRow[] = [
  {
    label: "Favorite Movies:",
    value:
      "Jojo Rabbit, Fantastic Mr. Fox, The Truman Show, The Grand Budapest Hotel, Pitch Perfect, Spiderman 2, Good Will Hunting, Star Wars",
    blue: true,
  },
]

const ABOUT_ROWS: InfoRow[] = [
  {
    label: "About Me:",
    value:
      "Hi there! I'm Joel, a Computer Science student at Baruch College, graduating in 2027. I build backend and infrastructure: the things that have to keep working when nobody is watching them. This summer I'm a Software Engineer Intern at Liberty Mutual, where I'm building a Kubernetes right-sizing engine and an automated disaster recovery tool for virtual machines. Before that I spent a year deploying AI agents at the Robert Wood Johnson Foundation and two years doing data work at the CUNY Institute for Demographic Research. Outside work I help run the ColorStack chapter here at Baruch, and I build things like the desktop you are reading this on.",
  },
]

/** The blue bar every profile box wears as its title. */
function BoxTitle({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">{children}</div>
}

function FacebookHeader() {
  return (
    <div className="w-full bg-[#3B5998]">
      <div className="relative h-[130px]">
        <div className="absolute inset-0">
          <img
            src="/images/blob/thefacebook-header.png"
            alt="TheFacebook Header"
            // Cropping from the right pins the wordmark to the right edge
            // at any window width, so the nav below can anchor to the same
            // edge and never drift from it.
            className="w-full h-full object-cover"
            // A touch above centre lifts the wordmark clear of the nav row.
            style={{ imageRendering: "auto", objectPosition: "right 35%" }}
          />
        </div>
        {/*
          The wordmark spans fractions 0.512 to 0.908 of the source bitmap,
          and the bitmap's displayed width is max(container, 1300px) because
          the art is 10:1 cropped from the right at 130px tall. Sizing the
          nav box from the same arithmetic keeps the links spread evenly
          under the logo, windowed and maximised alike.
        */}
        {/*
          justify-between pins the first and last link to the box's edges,
          so the row cannot drift with centring slack when the box scales.
        */}
        <div
          className="absolute bottom-0 flex items-center justify-between text-white text-sm"
          style={{
            width: "calc(max(100%, 1300px) * 0.396)",
            right: "calc(max(100%, 1300px) * 0.092)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="hover:underline">
              {link}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchSidebar() {
  return (
    <div className="w-48 flex flex-col gap-4 h-full relative">
      <div className="flex flex-col">
        <div className="bg-white p-3 border border-[#B7B7B7] border-b-0">
          <div className="border border-dashed border-[#538ADC] p-2 mb-3">
            <div>
              <input type="text" placeholder="" className="px-2 py-1 text-xs w-full border border-[#B7B7B7]" />
            </div>
            <div className="text-xs text-black mt-1 flex items-center">
              <span>quick search</span>
              <button className="bg-[#42a4f5] text-white px-2 py-0.5 text-xs ml-2 w-12">go</button>
            </div>
          </div>
          <ul className="text-[#42b3f5] text-sm space-y-1 border border-dashed border-[#538ADC] p-2">
            {SIDEBAR_LINKS.map((link) => (
              <li key={link}>
                <a href="#" className="hover:underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Advertisement Space - McDonald's 90s Ad */}
        <div
          className="bg-white border border-[#B7B7B7] flex flex-col flex-grow h-full overflow-hidden"
          style={{ minHeight: "calc(100vh - 290px)" }}
        >
          <div className="flex-1 flex items-stretch h-full">
            <div className="w-full h-full flex flex-col justify-center bg-white">
              <img
                src="/images/blob/skyscraper-ad.png"
                alt="Advertisement"
                className="h-full w-full object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileColumn() {
  return (
    <div className="w-[300px] space-y-4">
      <div className="bg-white border border-[#B7B7B7]">
        <BoxTitle>Picture</BoxTitle>
        <div className="p-3 flex justify-center">
          <img
            src="/images/blob/profile-headshot.jpeg"
            alt="Profile"
            // theFacebook's photo box was portrait. The source is 4:5
            // and so is this, so nothing is cropped off at all.
            className="h-[190px] w-[152px] object-cover"
          />
        </div>
      </div>

      <div className="space-y-0 -ml-2">
        <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
          Send Joel a Message
        </button>
        <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
          Poke Him!
        </button>
      </div>

      <div className="bg-white border border-[#B7B7B7]">
        <BoxTitle>Connection</BoxTitle>
        <div className="p-3 text-sm text-center">You are viewing Joel&apos;s profile.</div>
      </div>

      <div className="bg-white border border-[#B7B7B7]">
        <BoxTitle>Mutual Friends</BoxTitle>
        <div className="p-3 text-sm">
          You have <span className="text-[#42b3f5]">16 friends</span> in common.
        </div>
      </div>

      <div className="bg-white border border-[#B7B7B7]">
        <BoxTitle>Friends at Baruch College</BoxTitle>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {FRIENDS.map((friend) => (
              <div key={friend.name} className="text-center">
                <img src={friend.src} alt="Friend" className="w-16 h-16 object-cover mx-auto mb-1" />
                <a href="#" className="text-black text-xs hover:underline">
                  {friend.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** One of the Information panel's label-and-value tables. */
function InfoTable({ title, rows }: { title?: string; rows: InfoRow[] }) {
  return (
    <div>
      {title && <h5 className="font-bold mb-0.5 text-sm">{title}</h5>}
      <table className="text-sm w-full">
        <tbody className="leading-tight">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="w-[124px] pr-4 align-top">{row.label}</td>
              <td className={row.blue ? "text-[#42b3f5] break-words" : undefined}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InformationPanel() {
  return (
    <div className="flex-1">
      <div className="bg-white border border-[#B7B7B7] w-full h-[719px] overflow-auto">
        <BoxTitle>Information</BoxTitle>
        <div className="p-4">
          <div className="space-y-2">
            <InfoTable title="Account Info:" rows={ACCOUNT_ROWS} />
            <InfoTable title="Basic Info:" rows={BASIC_ROWS} />
            <InfoTable title="Contact Info:" rows={CONTACT_ROWS} />
            <InfoTable title="Personal Info:" rows={PERSONAL_ROWS} />
            <InfoTable rows={MUSIC_ROWS} />
            <InfoTable rows={MOVIE_ROWS} />
            <InfoTable rows={ABOUT_ROWS} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AboutMe() {
  return (
    <div className="bg-[#D8DFEA] text-black h-full overflow-auto">
      <FacebookHeader />

      <div className="flex p-4 gap-4 h-[calc(100%-75px)] min-h-[calc(100vh-75px)]">
        <SearchSidebar />

        <div className="flex-1">
          <div className="border border-[#B7B7B7] bg-white">
            <div className="flex w-full">
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1">
                Joel Vasquez&apos;s Profile
              </div>
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1 text-right">
                Baruch College
              </div>
            </div>

            {/* The profile is a two-column 2005 layout and does not become a
                one-column one gracefully. Below its natural width it keeps its
                shape and the window scrolls, which is what a browser of the
                period did, rather than squeezing the right column to nothing
                and clipping it. */}
            <div className="p-4 flex gap-4 min-w-[820px]">
              <ProfileColumn />
              <InformationPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
