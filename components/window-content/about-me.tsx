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
  { label: "Last Update:", value: "August 17, 2026" },
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
  { label: "Looking For:", value: "New Grad Opportunities", blue: true },
  { label: "Interested In:", value: "Backend, Infrastructure, Machine Learning", blue: true },
  {
    label: "Interests:",
    value:
      "Reading, Writing, Chess, Basketball, Lego, Movies, Guitar, Gaming, Comics, Coding, Working Out, Sleeping",
    blue: true,
  },
]

const MUSIC_ROWS: InfoRow[] = [
  {
    label: "Favorite Music:",
    value:
      "The Strokes, Jeff Buckley, Radiohead, Mac Miller, Steve Lacy, Marvin Gaye, Faye Webster, Stevie Wonder, Mazzy Star, Michael Jackson, Fleetwood Mac, Tame Impala",
    blue: true,
  },
]

const MOVIE_ROWS: InfoRow[] = [
  {
    label: "Favorite Movies:",
    value:
      "Jojo Rabbit, Fantastic Mr. Fox, The Truman Show, The Grand Budapest Hotel, Knives Out, Spiderman 2, Good Will Hunting, Star Wars",
    blue: true,
  },
]

const ABOUT_ROWS: InfoRow[] = [
  {
    label: "About Me:",
    value:
      "Hi there! I'm Joel, a Computer Science student at Baruch College, graduating in 2027. I build backend and infrastructure: the things that have to keep working when nobody is watching them. I'm currently interning as a Software Engineer at Liberty Mutual, where I'm building a Kubernetes right-sizing engine and an automated disaster recovery tool for virtual machines. Before that I spent a year deploying AI agents at the Robert Wood Johnson Foundation and two years doing data work at the CUNY Institute for Demographic Research. Outside work I help run the ColorStack chapter here at Baruch, and I build things like the desktop you are reading this on.",
  },
]

/** The blue bar every profile box wears as its title. */
function BoxTitle({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">{children}</div>
}

function FacebookHeader() {
  return (
    <div className="w-full bg-[#3B5998]">
      {/*
        One band, the height of the artwork, with the nav sitting inside it.
        The bitmap already carries its own clear blue below the wordmark, so
        the space the nav needs is in the art rather than added under it.
      */}
      {/*
        108px, not 130. The artwork is 10:1, so the band's height is what
        sets the wordmark's size: shorter band, smaller logo, and the whole
        header stops shouting. Every offset below is derived from the same
        height, so they move together.
      */}
      <div className="relative h-[108px]">
        <div className="absolute inset-0">
          <img
            src="/images/blob/thefacebook-header.png"
            alt="TheFacebook Header"
            // Cropping from the right pins the wordmark to the right edge
            // at any window width, so the nav below can anchor to the same
            // edge and never drift from it.
            className="w-full h-full object-cover"
            /*
              Anchored low in the crop, because that is what keeps the nav
              off the wordmark. The source is 2400x240 with the wordmark on
              rows 77 to 185, leaving 54 rows of clear blue beneath it. Only
              a window wider than 10:1 crops vertically at all, and at 35%
              that crop cut the visible area off at row 185, exactly where
              the wordmark ends, which is why the links ended up against it.
              At 80% the whole bottom margin survives and the row has blue
              to sit in at every width.
            */
            style={{ imageRendering: "auto", objectPosition: "right 80%" }}
          />
        </div>
        {/*
          The wordmark spans fractions 0.512 to 0.908 of the source bitmap,
          and the bitmap's displayed width is max(container, 1080px) because
          the art is 10:1 cropped from the right at 108px tall. Sizing the
          nav box from the same arithmetic keeps the links under the logo,
          windowed and maximised alike. The padding inside that box pulls the
          row in from both ends, so the links sit closer together and stay
          strictly within the wordmark instead of reaching its outer edges.
        */}
        {/*
          justify-between pins the first and last link to the box's edges,
          so the row cannot drift with centring slack when the box scales.
        */}
        <div
          className="absolute bottom-[4px] flex items-center justify-between text-white text-xs"
          style={{
            // The bitmap renders ten times the band's height, or the
            // container's width when that is wider.
            width: "calc(max(100%, 1080px) * 0.396)",
            right: "calc(max(100%, 1080px) * 0.092)",
            /*
              The inset comes off the same measurement as everything else.
              A fixed padding would be a smaller share of a wider logo, so
              the row's offset drifted as the window grew; derived from the
              bitmap it holds at every size.
            */
            paddingInline: "calc(max(100%, 1080px) * 0.02)",
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

/** The sidebar's adverts, top to bottom. */
const ADVERTS = [
  { src: "/images/blob/magazine-ad.jpg", alt: "Diet Pepsi: New Freshness Dating" },
  { src: "/images/blob/gameboy-ad.jpg", alt: "Nintendo Game Boy" },
]

/**
 * One advert in the sidebar.
 *
 * A missing file falls back to the skyscraper that used to fill this slot,
 * so a scan that has not been dropped in yet shows the old advert rather
 * than a broken image.
 */
function Advert({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="bg-white border border-[#B7B7B7] overflow-hidden">
      <img
        src={src}
        alt={alt}
        data-advert
        className="block w-full h-auto"
        onError={(e) => {
          const img = e.currentTarget
          if (!img.dataset.fellBack) {
            img.dataset.fellBack = "1"
            img.src = "/images/blob/skyscraper-ad.png"
          }
        }}
      />
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

        {/*
          The adverts, stacked as a magazine stacked them down a column.

          Each keeps its own proportions and its box wraps it, rather than
          being stretched to a fixed slot: the skyscraper these replaced was
          320x1000 and filled a tall column by cover-cropping, which works
          only for art already that shape. A magazine page is nearer 3:4, so
          cover would have thrown away most of its width.
        */}
        {ADVERTS.map((advert) => (
          <Advert key={advert.src} {...advert} />
        ))}
      </div>
    </div>
  )
}

function ProfileColumn() {
  return (
    /*
      A flex column rather than spaced blocks, so the friends box below can
      take flex-1 and carry the column to the same bottom edge as the
      Information panel beside it. gap-4 keeps the spacing space-y-4 gave.
    */
    <div className="w-[300px] flex flex-col gap-4">
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

      {/*
        The last box grows to the column's full height, so its bottom edge
        meets the Information panel's: the two columns end together however
        much longer the information runs.
      */}
      <div className="bg-white border border-[#B7B7B7] flex-1">
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
    /*
      A flex child stretches to the row's height, and the row is as tall as
      its tallest column, so the panel bottom-aligns with the friends grid
      when the profile column is taller and simply grows when its own text
      is. The old fixed 719px did neither: it scrolled the About text inside
      itself and stopped short of the friends box.
    */
    <div className="flex-1 flex">
      <div className="bg-white border border-[#B7B7B7] w-full">
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
