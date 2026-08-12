"use client"

import { useState } from "react"

/**
 * The About Me window, as theFacebook looked in 2004.
 *
 * The palette is the whole trick: #3B5998 for the header and every section
 * bar, #D8DFEA borders, #F7F7F7 panels, white content. Small Verdana, tight
 * line height, hard 1px borders, nothing rounded, nothing animated.
 *
 * The type scale is set through .page-2005 because globals.css applies
 * font-size with !important to p, span and div, which inline styles cannot
 * beat. See the note in that stylesheet.
 */

const BLUE = "#3B5998"
const BORDER = "#D8DFEA"

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: BLUE, color: "#fff", fontWeight: "bold", padding: "2px 6px" }}>{children}</div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td style={{ verticalAlign: "top", padding: "2px 8px 2px 0", color: "#000", whiteSpace: "nowrap" }}>{label}</td>
      <td style={{ verticalAlign: "top", padding: "2px 0", color: BLUE }}>{children}</td>
    </tr>
  )
}

const NAV = ["home", "search", "global", "social net", "invite", "faq", "logout"]

const SIDEBAR = [
  "My Profile [edit]",
  "My Friends",
  "My Groups",
  "My Parties",
  "My Messages",
  "My Account",
  "My Privacy",
]

const FRIENDS = [
  { name: "Bloomberg Tech Lab", img: "/images/gallery/bloomberg-visit.jpg" },
  { name: "ColorStack", img: "/images/gallery/codepath-group1.jpeg" },
  { name: "NSBE", img: "/images/gallery/nsbe-group1.jpeg" },
  { name: "Protiviti", img: "/images/gallery/protiviti-group.jpeg" },
  { name: "Women in Tech", img: "/images/gallery/women-tech-group.jpeg" },
  { name: "CodePath", img: "/images/gallery/codepath-group2.jpeg" },
]

export default function AboutMe() {
  const [poked, setPoked] = useState(false)

  return (
    <div
      className="page-2005 h-full w-full overflow-auto"
      style={{ fontFamily: "Verdana, Geneva, sans-serif", background: "#fff", color: "#000" }}
    >
      {/* Header */}
      <div style={{ background: BLUE, padding: "6px 10px" }}>
        <span className="t15" style={{ color: "#fff", fontWeight: "bold", letterSpacing: -0.5 }}>
          [ thefacebook
        </span>
      </div>
      <div style={{ background: "#F7F7F7", borderBottom: `1px solid ${BORDER}`, padding: "3px 10px" }}>
        {NAV.map((n) => (
          <a key={n} href="#" className="t11" style={{ color: BLUE, marginRight: 12, textDecoration: "none" }}>
            {n}
          </a>
        ))}
      </div>

      <div className="flex gap-3 p-3" style={{ alignItems: "flex-start" }}>
        {/* Left column */}
        <div style={{ width: 150, flexShrink: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <div style={{ background: "#F7F7F7", padding: 6 }}>
              <div className="t11" style={{ marginBottom: 3, fontWeight: "bold" }}>
                quick search
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  aria-label="Quick search"
                  className="t11"
                  style={{ width: "100%", border: "1px solid #BDC7D8", padding: "1px 2px" }}
                />
                <button
                  type="button"
                  className="t11"
                  style={{ background: BLUE, color: "#fff", padding: "1px 6px", border: "none" }}
                >
                  go
                </button>
              </div>
            </div>
          </div>

          <div style={{ border: `1px solid ${BORDER}` }}>
            {SIDEBAR.map((s) => (
              <a
                key={s}
                href="#"
                className="t11"
                style={{
                  display: "block",
                  color: BLUE,
                  textDecoration: "none",
                  padding: "3px 6px",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <SectionBar>Joel Vasquez&#39;s Profile</SectionBar>

            <div className="flex gap-3" style={{ padding: 8 }}>
              {/* Picture */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ border: `1px solid ${BORDER}` }}>
                  <div className="t11" style={{ background: "#F7F7F7", padding: "2px 4px", fontWeight: "bold" }}>
                    Picture
                  </div>
                  <img
                    src="/images/blob/profile-picture.jpeg"
                    alt="Joel Vasquez"
                    style={{ width: 130, height: 160, objectFit: "cover", display: "block", padding: 4 }}
                  />
                </div>

                <div style={{ border: `1px solid ${BORDER}`, marginTop: 8 }}>
                  <a
                    href="#"
                    className="t11"
                    style={{ display: "block", color: BLUE, padding: "3px 5px", borderBottom: `1px solid ${BORDER}` }}
                  >
                    Send Joel a Message
                  </a>
                  <button
                    type="button"
                    className="t11"
                    onClick={() => setPoked(true)}
                    style={{ display: "block", width: "100%", textAlign: "left", color: BLUE, padding: "3px 5px" }}
                  >
                    {poked ? "You poked Joel!" : "Poke Him!"}
                  </button>
                </div>
              </div>

              {/* Information */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ border: `1px solid ${BORDER}` }}>
                  <div className="t11" style={{ background: "#F7F7F7", padding: "2px 4px", fontWeight: "bold" }}>
                    Information
                  </div>
                  <table className="t11" style={{ width: "100%", padding: 6, borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td colSpan={2} style={{ fontWeight: "bold", paddingTop: 4 }}>
                          Account Info:
                        </td>
                      </tr>
                      <Field label="Name:">Joel Vasquez</Field>
                      <Field label="Member Since:">August 24, 1995</Field>
                      <Field label="Last Update:">August 12, 2026</Field>

                      <tr>
                        <td colSpan={2} style={{ fontWeight: "bold", paddingTop: 8 }}>
                          Basic Info:
                        </td>
                      </tr>
                      <Field label="School:">Baruch College &#39;27</Field>
                      <Field label="Status:">Undergrad</Field>
                      <Field label="Concentration:">Computer Science, Mathematics minor</Field>
                      <Field label="Residence:">New York, NY</Field>

                      <tr>
                        <td colSpan={2} style={{ fontWeight: "bold", paddingTop: 8 }}>
                          Contact Info:
                        </td>
                      </tr>
                      <Field label="Email:">
                        <a href="mailto:jfvasq1@gmail.com" style={{ color: BLUE }}>
                          jfvasq1@gmail.com
                        </a>
                      </Field>
                      <Field label="Website:">
                        <a href="https://github.com/jguapp" target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
                          github.com/jguapp
                        </a>
                      </Field>
                      <Field label="LinkedIn:">
                        <a
                          href="https://linkedin.com/in/jvasquezcs"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: BLUE }}
                        >
                          linkedin.com/in/jvasquezcs
                        </a>
                      </Field>

                      <tr>
                        <td colSpan={2} style={{ fontWeight: "bold", paddingTop: 8 }}>
                          Personal Info:
                        </td>
                      </tr>
                      <Field label="Looking For:">
                        Software engineering internships and new-grad roles, backend or infrastructure
                      </Field>
                      <Field label="Interests:">
                        Distributed systems, Kubernetes, developer tooling, retro computing
                      </Field>
                      <Field label="Favorite Tools:">Go, TypeScript, PostgreSQL, Redis, Docker</Field>
                      <Field label="About Me:">
                        Computer Science student focused on backend and infrastructure engineering. Currently a
                        Software Engineer Intern at Liberty Mutual, building Kubernetes right-sizing tooling. Before
                        that, AI agents at the Robert Wood Johnson Foundation and data pipelines at CUNY.
                      </Field>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Friends */}
          <div style={{ border: `1px solid ${BORDER}` }}>
            <SectionBar>Friends at Baruch College</SectionBar>
            <div className="flex flex-wrap gap-3" style={{ padding: 8 }}>
              {FRIENDS.map((f) => (
                <div key={f.name} style={{ width: 74, textAlign: "center" }}>
                  <img
                    src={f.img}
                    alt={f.name}
                    style={{ width: 68, height: 68, objectFit: "cover", border: `1px solid ${BORDER}` }}
                  />
                  <a href="#" className="t10" style={{ color: BLUE, display: "block", marginTop: 2 }}>
                    {f.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="t10" style={{ borderTop: `1px solid ${BORDER}`, padding: "6px 10px", color: "#666" }}>
        a Mark Zuckerberg production &nbsp;|&nbsp; Thefacebook &#169; 2004
      </div>
    </div>
  )
}
