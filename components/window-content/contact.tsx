"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { sendEmail } from "@/actions/send-email"

export default function Contact() {
  const [activeView, setActiveView] = useState<"compose" | "inbox" | "contacts">("compose")
  const [subject, setSubject] = useState("")
  const [from, setFrom] = useState("")
  const [message, setMessage] = useState("")
  const [showSentConfirmation, setShowSentConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const [tipIndex, setTipIndex] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null)

  // Sample inbox messages
  const inboxMessages = [
    {
      id: 1,
      from: "recruiter@techcompany.com",
      subject: "Interview Opportunity at TechCorp",
      date: "5/09/2025",
      read: true,
      content: `Dear Portfolio Visitor,

Thank you for sharing your impressive portfolio with us. Your projects demonstrate strong technical skills and creativity that align well with what we're looking for at TechCorp.

We would like to invite you for an initial interview to discuss your experience and how you might fit with our development team. Are you available next week for a video call?

Please let me know your availability, and I'll arrange a meeting with our technical team.

Best regards,
Sarah Johnson
Technical Recruiter
TechCorp
(555) 123-4567`,
    },
    {
      id: 2,
      from: "conference@webdev.org",
      subject: "Speaker Invitation: WebDev Summit 2025",
      date: "5/01/2025",
      read: false,
      content: `Hello,

Based on your portfolio work and contributions to the web development community, we would like to invite you to speak at the upcoming WebDev Summit 2025.

The conference will be held in San Francisco from August 15-17, 2025. We're particularly interested in having you present on your experience with modern web frameworks and your creative approach to UI/UX design.

Speakers will receive:
- Full conference pass
- Travel and accommodation stipend
- Networking dinner with industry leaders

Please let us know if you're interested in this opportunity by May 30th.

Regards,
Michael Chen
WebDev Summit Organizer
conference@webdev.org`,
    },
    {
      id: 3,
      from: "newsletter@coding.com",
      subject: "Weekly Developer News: May Edition",
      date: "4/29/2025",
      read: true,
      content: `## CODING WEEKLY NEWSLETTER

**Top Stories This Week:**

1. **TypeScript 6.0 Released** - Major performance improvements and new features
2. **React 20 Announced** - What to expect in the next major version
3. **The Rise of AI-Assisted Coding** - How developers are leveraging new tools

**Job Market Trends:**
- Remote work opportunities continue to grow
- Increased demand for full-stack developers
- Rising salaries for those with AI/ML experience

**Upcoming Events:**
- CodeCon 2025 - June 12-14, Chicago
- JavaScript Summit - July 8-10, Online
- Hackathon for Good - May 20-22, Virtual

Happy coding!
The Coding.com Team`,
    },
    {
      id: 4,
      from: "david@startupfounders.net",
      subject: "Potential collaboration on new project",
      date: "4/25/2025",
      read: false,
      content: `Hi there,

I recently came across your portfolio and was impressed by your work, especially the Windows 95-style interface you created. Very creative!

I'm the founder of a new startup focused on nostalgic digital experiences, and I think your aesthetic sense would be perfect for a project we're developing.

Would you be interested in discussing a potential collaboration? We're looking for someone who can help us create an immersive retro digital experience for a new product launch.

Let me know if you'd like to chat further.

Best,
David Park
Founder, RetroDigital
david@startupfounders.net
(555) 987-6543`,
    },
    {
      id: 5,
      from: "alumni@university.edu",
      subject: "Alumni Networking Event - Tech Industry",
      date: "4/20/2025",
      read: true,
      content: `Dear Alumni,

The University Alumni Association is hosting a special networking event for graduates working in the technology sector.

**Event Details:**
- Date: May 15, 2025
- Time: 6:00 PM - 9:00 PM
- Location: University Innovation Center
- Theme: "Technology Trends of Tomorrow"

The event will feature keynote speakers from leading tech companies, panel discussions, and plenty of networking opportunities.

As a graduate with an impressive portfolio in web development, we would be delighted if you could attend and perhaps share your professional journey with current students.

Please RSVP by May 5th using the link below.

[RSVP LINK]

Warm regards,
University Alumni Relations`,
    },
    {
      id: 6,
      from: "support@portfoliohosting.com",
      subject: "Your subscription renewal",
      date: "4/18/2025",
      read: true,
      content: `Hello,

This is a reminder that your Premium Portfolio Hosting subscription will renew automatically on May 18, 2025.

**Subscription Details:**
- Plan: Premium Developer
- Annual Fee: $120.00
- Renewal Date: 5/18/2025
- Payment Method: Visa ending in 4567

Your premium benefits include:
- Custom domain name
- Unlimited projects
- Advanced analytics
- Priority support

If you wish to make any changes to your subscription, please log in to your account before the renewal date.

Thank you for choosing Portfolio Hosting for showcasing your impressive work!

The Portfolio Hosting Team
support@portfoliohosting.com`,
    },
    {
      id: 7,
      from: "mentor@techmentor.org",
      subject: "Feedback on your recent project",
      date: "4/15/2025",
      read: false,
      content: `Hi there,

I've had a chance to review the project you shared with me last week, and I'm really impressed with what you've accomplished.

Your Windows 95 portfolio is not only technically sound but shows a great sense of creativity and attention to detail. The nostalgic UI combined with modern web technologies demonstrates your versatility as a developer.

A few suggestions:
1. Consider adding keyboard shortcuts for power users
2. The contact form could benefit from more detailed form validation
3. Have you thought about adding some Easter eggs? That would fit perfectly with the retro theme

Let me know if you'd like to schedule a call to discuss these ideas further.

Keep up the excellent work!

Best regards,
Alex Rivera
Senior Developer Mentor
TechMentor.org`,
    },
  ]

  const contacts = [
    { id: 1, name: "John Doe", email: "john.doe@example.com", phone: "555-1234" },
    { id: 2, name: "Jane Smith", email: "jane.smith@example.com", phone: "555-5678" },
    { id: 3, name: "Alice Johnson", email: "alice.johnson@example.com", phone: "555-9012" },
  ]

  const tips = [
    "Include your name and contact information so I can get back to you.",
    "Be specific about your inquiry to help me provide a better response.",
    "If you're inquiring about a job opportunity, feel free to mention it.",
    "Check your email after sending - I'll try to respond within 48 hours.",
    "You can also reach me through my social media profiles linked in my resume.",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [tips.length])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!from || !subject || !message) {
      showConfirmation(false, "Please fill out all fields.")
      return
    }

    try {
      setIsSubmitting(true)

      // Get form data
      const formData = new FormData(e.currentTarget)

      // Send the email using the server action
      const result = await sendEmail(formData)

      // Show confirmation based on result
      showConfirmation(result.success, result.message)

      // Reset form if successful
      if (result.success) {
        formRef.current?.reset()
        setSubject("")
        setFrom("")
        setMessage("")

        // Add a direct message to ensure the user knows how to contact you
        if (!result.message.includes("jfvasq1@gmail.com")) {
          setConfirmationMessage(
            result.message + " If you don't hear back, please email me directly at jfvasq1@gmail.com",
          )
        }
      }
    } catch (error) {
      console.error("Error sending email:", error)
      showConfirmation(false, "An error occurred. Please contact me directly at jfvasq1@gmail.com")
    } finally {
      setIsSubmitting(false)
    }
  }

  const showConfirmation = (success: boolean, message: string) => {
    setIsSuccess(success)
    setConfirmationMessage(message)
    setShowSentConfirmation(true)
    setTimeout(() => {
      setShowSentConfirmation(false)
    }, 5000)
  }

  const handleContactClick = (contact: (typeof contacts)[0]) => {
    setActiveView("compose")
    setFrom(contact.email)
  }

  const handleInboxMessageClick = (messageId: number) => {
    setSelectedEmail(messageId)
    // Mark the message as read
    const updatedMessages = inboxMessages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    // In a real app, we would update the messages state here
  }

  const unreadCount = inboxMessages.filter((msg) => !msg.read).length

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] text-black overflow-hidden">
      {/* Menu Bar */}
      <div className="bg-[#c0c0c0] flex border-b border-[#808080] shadow-[inset_0_-1px_0_#ffffff]">
        <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">File</div>
        <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Edit</div>
        <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">View</div>
        <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Tools</div>
        <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer">Help</div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#c0c0c0] flex items-center p-1 border-b border-[#808080] shadow-[inset_0_-1px_0_#ffffff]">
        <button
          className={`flex items-center px-2 py-1 mr-1 border ${
            activeView === "compose"
              ? "border-[#808080] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]"
              : "border-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
          }`}
          onClick={() => setActiveView("compose")}
        >
          <img src="/outlook-express-logo.png" alt="New Message" className="w-4 h-4 mr-1" />
          <span className="text-xs">New Message</span>
        </button>

        <button
          className={`flex items-center px-2 py-1 mr-1 border ${
            activeView === "inbox"
              ? "border-[#808080] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]"
              : "border-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
          }`}
          onClick={() => setActiveView("inbox")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-1"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span className="text-xs">Inbox</span>
        </button>

        <button
          className={`flex items-center px-2 py-1 mr-1 border ${
            activeView === "contacts"
              ? "border-[#808080] shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]"
              : "border-[#c0c0c0] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]"
          }`}
          onClick={() => setActiveView("contacts")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-1"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span className="text-xs">Address Book</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder Tree */}
        <div className="w-40 bg-white border-r border-[#808080] p-1 overflow-auto">
          <div className="mb-2">
            <div className="flex items-center font-bold mb-1 text-xs">
              <img src="/outlook-express-logo.png" alt="Outlook Express" className="w-4 h-4 mr-1" />
              Outlook Express
            </div>
            <ul className="pl-2 text-xs">
              <li
                className={`cursor-pointer p-0.5 flex items-center ${activeView === "compose" ? "bg-[#000080] text-white" : "hover:bg-[#d0d0d0]"}`}
                onClick={() => setActiveView("compose")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3 mr-1"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                New Message
              </li>
              <li
                className={`cursor-pointer p-0.5 flex items-center ${activeView === "inbox" ? "bg-[#000080] text-white" : "hover:bg-[#d0d0d0]"}`}
                onClick={() => setActiveView("inbox")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3 mr-1"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Inbox {unreadCount > 0 && `(${unreadCount})`}
              </li>
              <li
                className={`cursor-pointer p-0.5 flex items-center ${activeView === "contacts" ? "bg-[#000080] text-white" : "hover:bg-[#d0d0d0]"}`}
                onClick={() => setActiveView("contacts")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3 mr-1"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Address Book
              </li>
              <li className="cursor-pointer p-0.5 flex items-center hover:bg-[#d0d0d0]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3 mr-1"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Sent Items
              </li>
              <li className="cursor-pointer p-0.5 flex items-center hover:bg-[#d0d0d0]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3 mr-1"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Deleted Items
              </li>
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white overflow-auto">
          {/* Compose Message */}
          {activeView === "compose" && (
            <div className="flex flex-col h-full">
              <div className="bg-[#c0c0c0] p-1 font-bold text-xs border-b border-[#808080] shadow-[inset_0_-1px_0_#ffffff]">
                New Message
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1">
                <div className="flex items-center p-1 border-b border-[#808080]">
                  <label htmlFor="to" className="w-16 font-bold text-xs">
                    To:
                  </label>
                  <input
                    type="text"
                    id="to"
                    name="to"
                    value="Joel"
                    readOnly
                    className="flex-1 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] p-1 text-xs bg-[#c0c0c0]"
                  />
                </div>

                <div className="flex items-center p-1 border-b border-[#808080]">
                  <label htmlFor="subject" className="w-16 font-bold text-xs">
                    Subject:
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="Enter subject here"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] p-1 text-xs"
                    required
                  />
                </div>

                <div className="flex items-center p-1 border-b border-[#808080]">
                  <label htmlFor="from" className="w-16 font-bold text-xs">
                    From:
                  </label>
                  <input
                    type="email"
                    id="from"
                    name="from"
                    placeholder="Your email address"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="flex-1 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] p-1 text-xs"
                    required
                  />
                </div>

                <textarea
                  className="flex-1 m-1 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] text-xs p-1 resize-none"
                  id="message"
                  name="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />

                <div className="p-1 flex justify-between items-center bg-[#c0c0c0] border-t border-[#ffffff] shadow-[inset_0_1px_0_#808080]">
                  {/* Tip section */}
                  {showTip && (
                    <div className="flex items-start max-w-[70%]">
                      <div className="mr-1 flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-blue-600"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      <div className="text-xs">{tips[tipIndex]}</div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1 text-xs border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000] disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>

              {showSentConfirmation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#c0c0c0] border-2 border-[#808080] shadow-[2px_2px_5px_rgba(0,0,0,0.5),inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] p-4 z-10 max-w-[80%]">
                  <div className="flex items-start">
                    <div className="mr-2">
                      {isSuccess ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-green-600"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-red-600"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      )}
                    </div>
                    <p>{confirmationMessage}</p>
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowSentConfirmation(false)}
                      className="px-4 py-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] active:shadow-[inset_-1px_-1px_#ffffff,inset_1px_1px_#000000]"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inbox */}
          {activeView === "inbox" && (
            <div className="flex flex-col h-full">
              <div className="bg-[#c0c0c0] p-1 font-bold text-xs border-b border-[#808080] shadow-[inset_0_-1px_0_#ffffff]">
                Inbox
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="w-full">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#c0c0c0]">
                        <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                          From
                        </th>
                        <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                          Subject
                        </th>
                        <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inboxMessages.map((message) => (
                        <tr
                          key={message.id}
                          className={`cursor-pointer ${
                            selectedEmail === message.id
                              ? "bg-[#000080] text-white"
                              : "hover:bg-[#000080] hover:text-white"
                          } ${message.read ? "" : "font-bold"}`}
                          onClick={() => handleInboxMessageClick(message.id)}
                        >
                          <td className="p-1 border-b border-[#808080]">{message.from}</td>
                          <td className="p-1 border-b border-[#808080]">{message.subject}</td>
                          <td className="p-1 border-b border-[#808080]">{message.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-2 p-2 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] m-1 bg-[#c0c0c0] flex-1 h-64 overflow-auto">
                    {selectedEmail ? (
                      <div className="text-xs whitespace-pre-wrap">
                        <div className="mb-2">
                          <strong>From:</strong> {inboxMessages.find((m) => m.id === selectedEmail)?.from}
                          <br />
                          <strong>Subject:</strong> {inboxMessages.find((m) => m.id === selectedEmail)?.subject}
                          <br />
                          <strong>Date:</strong> {inboxMessages.find((m) => m.id === selectedEmail)?.date}
                        </div>
                        <hr className="border-t border-[#808080] mb-2" />
                        {inboxMessages.find((m) => m.id === selectedEmail)?.content}
                      </div>
                    ) : (
                      <p className="text-xs">Select a message to read its contents.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contacts */}
          {activeView === "contacts" && (
            <div className="flex flex-col h-full">
              <div className="bg-[#c0c0c0] p-1 font-bold text-xs border-b border-[#808080] shadow-[inset_0_-1px_0_#ffffff]">
                Address Book
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#c0c0c0]">
                    <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                      Name
                    </th>
                    <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                      Email
                    </th>
                    <th className="p-1 border border-[#808080] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#000000] text-left font-normal">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="cursor-pointer hover:bg-[#000080] hover:text-white"
                      onDoubleClick={() => handleContactClick(contact)}
                    >
                      <td className="p-1 border-b border-[#808080]">{contact.name}</td>
                      <td className="p-1 border-b border-[#808080]">{contact.email}</td>
                      <td className="p-1 border-b border-[#808080]">{contact.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 p-2 border border-[#808080] shadow-[inset_1px_1px_#000000,inset_-1px_-1px_#ffffff] m-1 bg-[#c0c0c0] flex-1">
                <p className="text-xs">Double-click a contact to send a message.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-5 bg-[#c0c0c0] border-t border-[#808080] shadow-[inset_0_1px_0_#ffffff] flex items-center text-xs px-2">
        <span>{isSubmitting ? "Sending message..." : "Ready"}</span>
      </div>
    </div>
  )
}
