"use client"

import type React from "react"
import { useRef, useState } from "react"
import { sendEmail } from "@/actions/send-email"
import { CloseIcon } from "@/components/win95-controls"
import {
  AddressBookIcon,
  AttachIcon,
  ComposeIcon,
  CopyIcon,
  CutIcon,
  DeleteIcon,
  ForwardIcon,
  MailReadIcon,
  MailUnreadIcon,
  PasteIcon,
  ReplyAllIcon,
  ReplyIcon,
  SendIcon,
  SendReceiveIcon,
} from "./outlook-icons"

/**
 * The Contact window, as Outlook Express.
 *
 * The three-pane silhouette is the point: folder tree, message list, preview
 * pane. Compose opens as a separate window with its own toolbar, as it did.
 *
 * The send path is untouched. Rate limiting, the honeypot and the length caps
 * all live in the server action, not here, so this is a visual rebuild that
 * cannot weaken them. The hidden company_website field must stay.
 */

interface Message {
  id: number
  from: string
  fromName: string
  subject: string
  date: string
  read: boolean
  body: string
}

const INBOX: Message[] = [
  {
    id: 1,
    fromName: "Priya Raghavan",
    from: "p.raghavan@stripe.com",
    subject: "Stripe - Infrastructure New Grad, next steps",
    date: "8/11/2026 10:24 AM",
    read: false,
    body: `Hi Joel,

Thanks for the time on Thursday. The team liked how you talked through the Kubernetes right-sizing work, particularly the part about not trusting the p50.

We would like to move you to the final loop: two systems rounds and a values conversation. Are you free the week of the 24th?

Priya`,
  },
  {
    id: 2,
    fromName: "Marcus Webb",
    from: "mwebb@datadoghq.com",
    subject: "Following up on your application",
    date: "8/09/2026 4:12 PM",
    read: false,
    body: `Joel,

Your portfolio came up in our pipeline review and the recruiting team passed it along. The Windows 95 thing is a good hook but the Prisma schema behind Booklet is what got my attention.

Do you have 30 minutes next week? No prep needed.

Marcus, Engineering Manager, Datadog`,
  },
  {
    id: 3,
    fromName: "ColorStack Baruch",
    from: "eboard@colorstackbaruch.org",
    subject: "RE: Handing over the chapter",
    date: "8/04/2026 7:45 PM",
    read: false,
    body: `Joel,

Transition doc is drafted. I put you down for the alumni panel in October since you actually know what the first year looked like.

Membership is at 340. Four founding members to that in three years is going to be the whole slide.

See you at the banquet.`,
  },
  {
    id: 4,
    fromName: "Dr. Elena Vasquez",
    from: "e.vasquez@baruch.cuny.edu",
    subject: "Recommendation letter - sent",
    date: "7/28/2026 11:03 AM",
    read: true,
    body: `Joel,

Letter is in for all four programs. I wrote about the distributed systems final and the fact that you were the only one who benchmarked before optimising.

Let me know how it goes. And come back and talk to my 3120 section in the spring.

Prof. Vasquez`,
  },
  {
    id: 5,
    fromName: "Liberty Mutual Recruiting",
    from: "university@libertymutual.com",
    subject: "Return offer - Software Engineer",
    date: "7/22/2026 9:15 AM",
    read: true,
    body: `Hi Joel,

Formally extending a return offer for Software Engineer on the Cloud Platform team, starting July 2027 after you graduate.

Details are attached. The offer stands until October 15th, so take your time.

Congratulations, and thank you for the disaster recovery work. 877 VMs is not a small thing.`,
  },
  {
    id: 6,
    fromName: "Devon Ellis",
    from: "devon@calligraphyqueue.dev",
    subject: "Calligraphy - the dead letter queue filled up",
    date: "7/14/2026 1:30 AM",
    read: true,
    body: `joel

the DLQ hit its cap overnight. turns out a malformed job was being retried, dead-lettered, and then a cleanup task was re-enqueueing it. infinite loop with extra steps

i stopped the bleeding but the dedup check you suggested in feb would have caught this. writing it properly this weekend`,
  },
  {
    id: 7,
    fromName: "HackNYU Organisers",
    from: "team@hacknyu.org",
    subject: "You have been selected as a judge",
    date: "7/02/2026 3:20 PM",
    read: true,
    body: `Hi Joel,

Thanks for volunteering. You are assigned to the Systems and Infrastructure track, judging Saturday afternoon.

Rubric and team list will go out the week before. Lunch is provided, and yes it is pizza.`,
  },
  {
    id: 8,
    fromName: "Robert Wood Johnson Foundation",
    from: "no-reply@rwjf.org",
    subject: "Your agent pipeline is in production",
    date: "6/25/2026 5:40 PM",
    read: true,
    body: `Joel,

Wanted to let you know the document classification agents you built went fully live last month. Grants team is processing about 40% faster on intake.

They still ask about you. Door is open if you ever want to come back.`,
  },
  {
    id: 9,
    fromName: "!!! FINANCIAL FREEDOM !!!",
    from: "wealth@offshore-prosperity-group.biz",
    subject: "You are ONE DECISION away from $12,000 A MONTH",
    date: "6/18/2026 3:44 AM",
    read: false,
    body: `FRIEND,

While you sleep, our AUTOMATED WEALTH SYSTEM works. While you commute, it works. While you sit in a CUBICLE for a BOSS who does not appreciate you, IT WORKS.

Our members average $12,000 PER MONTH. Some make MORE. One made $47,000 in a single WEEKEND (results not typical).

Reply with the word MONEY and your bank routing number to begin.

Do not tell your friends. There are only 40 spots.`,
  },
  {
    id: 10,
    fromName: "Bloomberg Campus Team",
    from: "campus@bloomberg.net",
    subject: "Engineering coffee chat - confirmed",
    date: "6/11/2026 10:00 AM",
    read: true,
    body: `Hi Joel,

You are confirmed for the coffee chat on the 19th at 731 Lexington. Bring ID.

Two engineers from the Ticker Plant team will be there. Come with questions about the data layer, they love that.`,
  },
  {
    id: 11,
    fromName: "CodePath",
    from: "hello@codepath.org",
    subject: "You have been invited to TA",
    date: "6/03/2026 2:15 PM",
    read: true,
    body: `Joel,

Based on your work in the Advanced Android course and the ColorStack partnership, we would like to invite you to TA the Systems track this fall.

Paid, roughly 6 hours a week. Let us know by the 20th.`,
  },
  {
    id: 12,
    fromName: "URGENT: Mailbox Quota",
    from: "postmaster@webmail-services-alert.net",
    subject: "ACTION REQUIRED: Your mailbox is 99.8% FULL",
    date: "5/29/2026 4:02 AM",
    read: false,
    body: `ATTENTION ACCOUNT HOLDER,

Your mailbox has reached 99.8% of its allocated capacity. Incoming messages WILL BE REJECTED within 24 HOURS.

Click the link below and re-enter your username and password to receive an additional 2 GIGABYTES at NO COST.

This is an automated message. Do not reply.`,
  },
  {
    id: 13,
    fromName: "Aisha Bello",
    from: "aisha.bello@baruchmail.cuny.edu",
    subject: "notes from 3120?",
    date: "5/21/2026 8:55 PM",
    read: true,
    body: `hey! did you keep your notes from operating systems? i'm retaking it in the fall and the professor changed but the syllabus looks identical

also congrats on liberty mutual, saw the linkedin post`,
  },
  {
    id: 14,
    fromName: "NSBE Region 1",
    from: "region1@nsbe.org",
    subject: "Convention recap and 2027 dates",
    date: "5/15/2026 12:30 PM",
    read: true,
    body: `Members,

Thank you to everyone who came out to convention. Career fair placement numbers were the strongest in six years.

2027 convention is in Atlanta, March 17-21. Early registration opens in September.`,
  },
  {
    id: 15,
    fromName: "Baruch Registrar",
    from: "registrar@baruch.cuny.edu",
    subject: "Fall 2026 registration window",
    date: "5/08/2026 6:00 AM",
    read: true,
    body: `Your registration window opens April 14 at 7:00 AM.

You have 92 credits completed. Please review your degree audit before registering. Two mathematics electives remain outstanding for the minor.`,
  },
  {
    id: 16,
    fromName: "Dr. Tomas Lindqvist",
    from: "t.lindqvist@baruch.cuny.edu",
    subject: "Your final project - distributed cache",
    date: "4/30/2026 4:45 PM",
    read: true,
    body: `Joel,

Best project in the section. The write-up on why you chose write-through over write-back, and the numbers you ran to justify it, is what I wish more students did.

Minor note: your eviction benchmark ran on a warm cache. Cold numbers would have been more honest. Grade unaffected.`,
  },
  {
    id: 17,
    fromName: "Y2K Preparedness Council",
    from: "info@y2k-readiness-alliance.org",
    subject: "Is YOUR computer ready for the year 2000?",
    date: "4/22/2026 9:58 PM",
    read: false,
    body: `Concerned citizen,

On January 1st, 2000, computers worldwide may FAIL TO RECOGNISE the date. Banking systems. Traffic lights. Your microwave.

Our 400-page manual, SURVIVING THE MILLENNIUM BUG, tells you everything the government will not. Includes a chapter on canned goods.

Only $89.95 plus shipping. Supplies are limited because demand is UNPRECEDENTED.

Do not wait until December.`,
  },
  {
    id: 18,
    fromName: "Jordan Pierce",
    from: "jpierce@sportsflix.io",
    subject: "Sportsflix - the latency thing",
    date: "4/16/2026 11:20 PM",
    read: true,
    body: `Joel,

You were right about the CDN edge selection. Moved the manifest lookup closer and the join time dropped from 4.1s to 1.6s on the east coast.

Owe you a coffee. Or several.`,
  },
  {
    id: 19,
    fromName: "Nigel Ashworth-Pemberton III",
    from: "n.ashworth.pemberton@private-banking-intl.com",
    subject: "CONFIDENTIAL BUSINESS PROPOSAL",
    date: "4/09/2026 2:14 AM",
    read: false,
    body: `DEAR SIR/MADAM,

I am writing to you in the STRICTEST CONFIDENCE regarding a matter of some delicacy. I am the executor of an estate valued at US$14,500,000.00 (FOURTEEN MILLION FIVE HUNDRED THOUSAND UNITED STATES DOLLARS) belonging to a client who shares your surname and who sadly passed without heirs.

I require only a trustworthy partner to receive these funds. For your assistance you shall retain 30% of the total sum.

Please respond with your full banking details at your EARLIEST CONVENIENCE. Time is of the essence as the bank intends to confiscate the funds.

Yours in anticipation,
N. Ashworth-Pemberton III, Esq.`,
  },
  {
    id: 20,
    fromName: "Cameron Yates",
    from: "cyates@ramp.com",
    subject: "Ramp - backend internship referral",
    date: "4/01/2026 3:30 PM",
    read: true,
    body: `Joel,

Met you at the ColorStack mixer. Putting your name in for the backend team here. Referral is submitted, you should get an email from our ATS in a day or two.

Fair warning, the take-home is a real one.`,
  },
  {
    id: 21,
    fromName: "GitHub",
    from: "noreply@github.com",
    subject: "Your repository reached 100 stars",
    date: "3/26/2026 8:00 AM",
    read: true,
    body: `jguapp/windows95-portfolio just passed 100 stars.

Most traffic this week came from Hacker News and a link in a newsletter about creative portfolios.`,
  },
  {
    id: 22,
    fromName: "Vercel",
    from: "billing@vercel.com",
    subject: "Your bandwidth usage this month",
    date: "3/19/2026 7:12 AM",
    read: true,
    body: `Hi Joel,

Your project builtbyjoel.dev used 74% of the included bandwidth this billing period, largely from the image assets in /images/gallery.

No action needed. This is informational.`,
  },
  {
    id: 23,
    fromName: "MAKE MONEY FAST",
    from: "opportunity@wealth-systems-online.net",
    subject: "!!! CONGRATULATIONS YOU HAVE BEEN SELECTED !!!",
    date: "3/14/2026 3:02 AM",
    read: false,
    body: `Dear Friend,

You have been SELECTED to receive our EXCLUSIVE work-from-home opportunity!!! Our associates are earning $4,000 - $7,000 PER WEEK from the comfort of their own home using nothing but a COMPUTER and the INTERNET.

No experience necessary!!! No selling!!! We provide EVERYTHING!!!

Simply send $39.95 for your STARTER KIT to the address below and begin earning IMMEDIATELY.

ACT NOW - this offer expires SOON!!!

P.S. Do not delete this message. Sharon from Ohio deleted it and she regrets it EVERY DAY.`,
  },
  {
    id: 24,
    fromName: "Baruch Career Services",
    from: "careers@baruch.cuny.edu",
    subject: "Spring Tech Fair - employer list",
    date: "3/05/2026 10:45 AM",
    read: true,
    body: `The Spring Technology Career Fair is March 26 in the Newman Vertical Campus.

Confirmed: Bloomberg, Google, JPMorgan, Datadog, MongoDB, Peloton, Squarespace, Two Sigma, Verizon.

Bring 15 copies of your resume. Yes, on paper.`,
  },
  {
    id: 25,
    fromName: "Reddit r/webdev",
    from: "noreply@reddit.com",
    subject: "Your post is trending",
    date: "2/26/2026 9:30 PM",
    read: true,
    body: `Your post "I rebuilt Windows 95 in the browser, including a working Minesweeper" has 2.4k upvotes and 310 comments.

Top comment: "the fact that the recycle bin actually works is unhinged, respect".`,
  },
  {
    id: 26,
    fromName: "System Administrator",
    from: "admin@your-1sp-billing.com",
    subject: "URGENT: Your account will be terminated",
    date: "2/17/2026 4:41 AM",
    read: false,
    body: `ATTENTION USER,

Our records indicate that your internet account has EXCEEDED its allocation of megabytes for this month. Failure to respond within 24 HOURS will result in PERMANENT TERMINATION of your service.

To verify your account, simply reply to this message with your username, password, and credit card number for our records.

This is an automated message. Do not reply to this message.

Thank you for your cooperation,
The Administrator`,
  },
  {
    id: 27,
    fromName: "Kwame Adjei",
    from: "kwame@orbitapp.co",
    subject: "ORBIT - shipping the ADHD timer",
    date: "2/09/2026 6:15 PM",
    read: true,
    body: `Joel,

Shipped the interval timer you sketched out. Early testers say the thing that helps is that it never guilt-trips you when you miss a block.

Want your name in the credits. Say the word.`,
  },
  {
    id: 28,
    fromName: "Sarah Johnson",
    from: "recruiter@techcompany.com",
    subject: "Interview Opportunity at TechCorp",
    date: "1/28/2026 9:14 AM",
    read: true,
    body: `Dear Portfolio Visitor,

Thank you for sharing your portfolio with us. Your projects demonstrate strong technical skills that align well with what we're looking for at TechCorp.

We would like to invite you for an initial interview to discuss your experience. Are you available next week for a video call?

Best regards,
Sarah Johnson
Technical Recruiter, TechCorp`,
  },
  {
    id: 29,
    fromName: "Baruch IT Help Desk",
    from: "helpdesk@baruch.cuny.edu",
    subject: "Password expiring in 7 days",
    date: "1/19/2026 8:00 AM",
    read: true,
    body: `Your CUNYfirst password will expire on January 26.

Passwords must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number and a symbol. You may not reuse any of your last 12 passwords.`,
  },
  {
    id: 30,
    fromName: "WebRing Administrator",
    from: "noreply@geocities-webring.com",
    subject: "Your site has been approved for the Retro Computing WebRing",
    date: "1/07/2026 1:30 PM",
    read: true,
    body: `Congratulations!

Your site has been APPROVED for membership in the Retro Computing WebRing.

Please add the ring navigation banner to the bottom of your homepage within 14 days or your membership will be revoked. The HTML is attached below. Do not modify the code.

Remember: sites with animated banners get 40% more traffic!

Happy surfing,
The WebRing Team`,
  },
  {
    id: 31,
    fromName: "Liberty Mutual Recruiting",
    from: "university@libertymutual.com",
    subject: "Your internship start date",
    date: "12/18/2025 11:15 AM",
    read: true,
    body: `Hi Joel,

Confirming your start date of June 2nd in Portsmouth. Your laptop will be waiting at the desk on your first morning, and your manager will reach out the week before with your onboarding schedule.

Welcome to the team.`,
  },
  {
    id: 32,
    fromName: "Michael Chen",
    from: "organizer@webdevsummit.com",
    subject: "Speaker Invitation: WebDev Summit 2026",
    date: "12/04/2025 2:38 PM",
    read: true,
    body: `Hello,

We came across your portfolio and were impressed by your creative approach to web development.

We would like to invite you to speak at WebDev Summit 2026 about building memorable web experiences. The session is 30 minutes plus questions.

Let me know if you are interested and I will send the details.

Michael Chen`,
  },
  {
    id: 33,
    fromName: "Amara Nwosu",
    from: "amara.nwosu@cuny.edu",
    subject: "CIDR - the pipeline is still running",
    date: "11/21/2025 4:50 PM",
    read: true,
    body: `Joel,

Two years on and the census ingestion job you wrote has not fallen over once. The new analyst asked who wrote it and I told her to read the comments, they explain more than the docs do.

Hope Baruch is treating you well.`,
  },
  {
    id: 34,
    fromName: "David Park",
    from: "david.park@startup.io",
    subject: "Potential collaboration on new project",
    date: "11/09/2025 11:02 AM",
    read: true,
    body: `Hi there,

I run a small startup building developer tools and I think your skills would be a great fit for a project we are starting.

It is a six week contract, remote, and we can be flexible around your class schedule. Interested in a call?

David Park`,
  },
  {
    id: 35,
    fromName: "Protiviti",
    from: "campus@protiviti.com",
    subject: "Thank you for attending our workshop",
    date: "10/27/2025 5:30 PM",
    read: true,
    body: `Thank you for joining our technology consulting workshop at Baruch.

Slides and the case study are attached. Applications for the summer analyst programme open November 1.`,
  },
  {
    id: 36,
    fromName: "PENNY STOCK ALERT",
    from: "tips@insider-market-movers.net",
    subject: "*** URGENT *** BUY BEFORE MONDAY ***",
    date: "10/15/2025 4:17 AM",
    read: false,
    body: `PRIVATE ALERT - DO NOT FORWARD

Our analysts have identified a MICROCAP stock poised for a 400% MOVE. The catalyst drops MONDAY MORNING. Institutional money is ALREADY POSITIONING.

Symbol: available to subscribers only.

Send $199 for one year of alerts and receive the symbol INSTANTLY.

Past performance is not indicative of future results. This is not investment advice. We may hold positions in securities mentioned.`,
  },
  {
    id: 37,
    fromName: "Alex Rivera",
    from: "mentor@techmentor.org",
    subject: "Feedback on your recent project",
    date: "10/02/2025 4:47 PM",
    read: true,
    body: `Hi,

I reviewed the project you shared last week and I'm impressed. The Windows 95 portfolio is technically sound and shows real attention to detail.

A few suggestions: consider keyboard shortcuts for power users, and think about Easter eggs, which would suit the retro theme.

Keep up the excellent work.

Alex Rivera
Senior Developer Mentor`,
  },
  {
    id: 38,
    fromName: "ColorStack National",
    from: "chapters@colorstack.org",
    subject: "Chapter of the Semester - Baruch",
    date: "9/19/2025 1:00 PM",
    read: true,
    body: `Congratulations to Baruch College.

Your chapter is recognised as Chapter of the Semester for growth, programming quality and employer partnerships. Membership growth of 280% year over year is the highest in the network.

A plaque is on the way.`,
  },
  {
    id: 39,
    fromName: "Dr. Elena Vasquez",
    from: "e.vasquez@baruch.cuny.edu",
    subject: "Office hours moved",
    date: "9/08/2025 7:20 AM",
    read: true,
    body: `All,

Office hours move to Wednesdays 2-4 in VC 6-215 starting this week. Thursday slot is gone, the room was double booked.

Bring your project proposals.`,
  },
  {
    id: 40,
    fromName: "LOSE 30 POUNDS",
    from: "health@miracle-slim-solutions.biz",
    subject: "Doctors HATE this one simple trick",
    date: "8/26/2025 3:55 AM",
    read: false,
    body: `Are you TIRED of diets that do not work?

A local mother of three discovered a SIMPLE HOUSEHOLD INGREDIENT that melts fat while you SLEEP. The diet industry does not want you to know about it because they would LOSE BILLIONS.

Featured on television. Results in as little as SEVEN DAYS.

Click here before this page is TAKEN DOWN.`,
  },
  {
    id: 41,
    fromName: "Baruch Bursar",
    from: "bursar@baruch.cuny.edu",
    subject: "Fall 2025 tuition statement",
    date: "8/14/2025 6:00 AM",
    read: true,
    body: `Your Fall 2025 statement is available on CUNYfirst.

Balance due: $0.00 after financial aid and the Vanguard scholarship. No payment is required.`,
  },
  {
    id: 42,
    fromName: "Women in Tech NYC",
    from: "events@womenintechnyc.org",
    subject: "Thank you for volunteering",
    date: "7/30/2025 8:15 PM",
    read: true,
    body: `Joel,

Thank you for helping run the workshop track at Saturday's panel event. 140 attendees and the feedback on the hands-on sessions was excellent.

Photos are up on the site.`,
  },
  {
    id: 43,
    fromName: "Anna Petrova",
    from: "anna@sortvis.dev",
    subject: "Sorting visualiser - the race view",
    date: "7/12/2025 10:40 PM",
    read: true,
    body: `Joel,

The side by side race is the thing that made it click for me. Watching quicksort finish while bubble sort is still on the first quarter says more than the big-O table ever did.

Mind if I use it in a lesson? Credit obviously.`,
  },
  {
    id: 44,
    fromName: "FREE RINGTONES",
    from: "offers@mobile-fun-zone.net",
    subject: "Your phone is BORING",
    date: "6/28/2025 4:33 AM",
    read: false,
    body: `Get 10 FREE ringtones, wallpapers and games sent DIRECTLY to your handset!

Simply reply with your mobile number to claim.

Subscription service $9.99/week. Cancel any time by replying STOP. Standard message rates apply. By replying you agree to the terms available on request.`,
  },
  {
    id: 45,
    fromName: "Baruch ACM Chapter",
    from: "acm@baruch.cuny.edu",
    subject: "Programming contest team - you're in",
    date: "6/10/2025 3:25 PM",
    read: true,
    body: `Joel,

You made the travelling team for the regional contest. Practices are Sundays, 1-4, starting in September.

Bring a laptop and low expectations about your dynamic programming.`,
  },
  {
    id: 46,
    fromName: "Marcus Webb",
    from: "mwebb@datadoghq.com",
    subject: "Re: question about observability",
    date: "5/22/2025 9:50 AM",
    read: true,
    body: `Joel,

Good question. The short version is that you instrument the boundaries first: every network call in and out. Internal spans are cheap to add later, and you will not know which ones matter until something is on fire.

Happy to keep answering these.`,
  },
  {
    id: 47,
    fromName: "Robert Wood Johnson Foundation",
    from: "hr@rwjf.org",
    subject: "Your last day and offboarding",
    date: "5/06/2025 2:00 PM",
    read: true,
    body: `Joel,

Your last day is May 30. Please return the laptop and badge to the front desk, and hand over any repository access to your manager.

Thank you for a strong year. The agent work is genuinely in use.`,
  },
  {
    id: 48,
    fromName: "YOUR PACKAGE IS WAITING",
    from: "delivery@parcel-notification-centre.info",
    subject: "Delivery attempt FAILED - action required",
    date: "4/18/2025 4:09 AM",
    read: false,
    body: `DELIVERY NOTIFICATION

We attempted to deliver your package on Tuesday but nobody was available to sign.

Your parcel is being held at our facility. A storage fee of $2.99 applies. To reschedule delivery and settle the fee, confirm your address and card details at the link below.

Unclaimed parcels are returned to sender after 5 working days.`,
  },
  {
    id: 49,
    fromName: "CUNY Institute for Demographic Research",
    from: "cidr@gc.cuny.edu",
    subject: "Reference request - please confirm",
    date: "3/31/2025 11:30 AM",
    read: true,
    body: `Joel,

An employer contacted us for a reference. Please confirm you are happy for us to speak to them and let us know which projects to highlight.

We would lead with the census pipeline unless you say otherwise.`,
  },
  {
    id: 50,
    fromName: "Baruch Financial Aid",
    from: "finaid@baruch.cuny.edu",
    subject: "Vanguard Scholarship renewed",
    date: "3/12/2025 9:00 AM",
    read: true,
    body: `Your Vanguard scholarship has been renewed for the 2025-2026 academic year based on your cumulative GPA.

No further action is required.`,
  },
  {
    id: 51,
    fromName: "Devon Ellis",
    from: "devon@calligraphyqueue.dev",
    subject: "Calligraphy - worker retries",
    date: "2/24/2025 11:55 PM",
    read: true,
    body: `joel

exponential backoff is in but i capped it at 5 attempts. after that it goes to the dead letter queue and pages nobody, which feels wrong but also i don't want to be woken up

thoughts?`,
  },
  {
    id: 52,
    fromName: "CONGRATULATIONS WINNER",
    from: "claims@international-lottery-board.org",
    subject: "You have won 850,000 EUR",
    date: "2/06/2025 3:21 AM",
    read: false,
    body: `ATTENTION LUCKY WINNER,

Your email address was selected at random in our INTERNATIONAL EMAIL LOTTERY held in Madrid, Spain. You have won EIGHT HUNDRED AND FIFTY THOUSAND EUROS.

Reference: ES/9420/2005
Batch: 074/05/ZY369

To claim, contact our fiduciary agent with your full name, address, telephone number and a copy of your identification. A processing fee of 450 EUR applies.

Note: you may not have entered this lottery. Entries are drawn from a database of email addresses.`,
  },
  {
    id: 53,
    fromName: "NSBE Baruch",
    from: "nsbe@baruch.cuny.edu",
    subject: "Opening ceremony photos",
    date: "1/22/2025 7:45 PM",
    read: true,
    body: `Photos from the opening ceremony are up.

Whoever had the camera on the second row got a great one of the whole delegation. Grab them before the drive fills up.`,
  },
  {
    id: 54,
    fromName: "Stack Overflow",
    from: "noreply@stackoverflow.email",
    subject: "Your answer was accepted",
    date: "1/09/2025 5:15 PM",
    read: true,
    body: `Your answer to "Why does my requestAnimationFrame loop read stale state?" was accepted and has 41 upvotes.

You earned the Guru badge.`,
  },
  {
    id: 55,
    fromName: "Robert Wood Johnson Foundation",
    from: "hr@rwjf.org",
    subject: "Welcome to RWJF",
    date: "12/16/2024 10:00 AM",
    read: true,
    body: `Joel,

Welcome aboard. You are on the data and technology team starting January 6.

First week is orientation and access requests. Bring two forms of ID.`,
  },
  {
    id: 56,
    fromName: "ColorStack Baruch",
    from: "eboard@colorstackbaruch.org",
    subject: "We got the room",
    date: "11/28/2024 8:30 PM",
    read: true,
    body: `It happened. Student Life approved us as a chartered organisation, which means a budget and a room.

Four of us in a library corner in September and now this. Meeting Thursday to plan the spring.`,
  },
  {
    id: 57,
    fromName: "Baruch Admissions",
    from: "admissions@baruch.cuny.edu",
    subject: "Your transfer credits have posted",
    date: "10/14/2024 1:40 PM",
    read: true,
    body: `Your transfer credit evaluation is complete. 18 credits have been applied toward your degree requirements.

Two courses were not accepted as direct equivalents and have been applied as free electives. Contact your advisor if you wish to appeal.`,
  },
  {
    id: 58,
    fromName: "HOT SINGLES IN YOUR AREA",
    from: "connect@meet-tonight-network.biz",
    subject: "Someone viewed your profile 47 times",
    date: "9/03/2024 4:44 AM",
    read: false,
    body: `Hi!

I saw your profile and I could not stop looking. I am new in your area and looking to meet someone genuine.

Click here to see my pictures and chat with me now. I am online RIGHT NOW.

You do not have a profile? That is okay, we made one for you!`,
  },
  {
    id: 59,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "Note to self - portfolio ideas",
    date: "7/21/2024 11:58 PM",
    read: true,
    body: `things that would be cool

- desktop os as a portfolio, windows 95 probably
- minesweeper has to actually work, no fake board
- solitaire with the card cascade at the end, that is the whole point
- recycle bin you can drag things into
- resume as a window not a pdf link

start with the window manager. everything else needs it.`,
  },
]

/**
 * What Joel has sent.
 *
 * Each is a reply to something in the inbox, so a visitor who reads both
 * folders sees one conversation rather than two unrelated piles. Anything the
 * visitor sends with Compose is appended to this list.
 */
const SENT: Message[] = [
  {
    id: 101,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Stripe - Infrastructure New Grad, next steps",
    date: "8/11/2026 2:03 PM",
    read: true,
    body: `Hi Priya,

The week of the 24th works. Monday or Tuesday would be ideal, any time after 11.

Thanks for the quick turnaround, and glad the right-sizing discussion landed. Happy to go deeper on the p50 point in the systems rounds.

Joel`,
  },
  {
    id: 102,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Following up on your application",
    date: "8/10/2026 9:40 AM",
    read: true,
    body: `Hi Marcus,

Thirty minutes next week sounds great. Wednesday or Thursday afternoon are both open.

And thanks for reading past the desktop gimmick to the Prisma schema. The 20 tables are doing real work, I promise.

Joel`,
  },
  {
    id: 103,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Handing over the chapter",
    date: "8/05/2026 8:12 PM",
    read: true,
    body: `Put me down for the alumni panel.

One ask for the transition doc: keep the employer contact sheet current. Half the value of the chapter is that list, and it goes stale in a semester if nobody owns it.

Four people in a library corner. Look at it now.`,
  },
  {
    id: 104,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Calligraphy - the dead letter queue filled up",
    date: "7/14/2026 8:30 AM",
    read: true,
    body: `Morning. Classic poison-pill loop, glad it is contained.

Two things while you are in there: dedup on a content hash of the job payload, not the id, or the cleanup task will mint fresh ids forever. And alert on DLQ depth, not DLQ writes; depth is the number that means something is stuck.

Send me the PR when the dedup lands and I will look same day.`,
  },
  {
    id: 105,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Recommendation letter - sent",
    date: "7/28/2026 12:15 PM",
    read: true,
    body: `Thank you, Professor. For the letter and for the benchmarking habit, which it turns out interviewers ask about more than the coursework.

Spring guest slot: yes, gladly. I will bring the cold-cache numbers you wanted.

Joel`,
  },
]

/**
 * What has been thrown away.
 *
 * Deleted Items is where the least-believable mail goes, which is its own kind
 * of characterisation: the lottery win was read and binned.
 */
const DELETED: Message[] = [
  {
    id: 201,
    fromName: "CONGRATULATIONS WINNER",
    from: "claims@international-lottery-board.org",
    subject: "You have won 850,000 EUR",
    date: "2/06/2025 3:21 AM",
    read: true,
    body: `ATTENTION LUCKY WINNER,

Your email address was selected at random in our INTERNATIONAL EMAIL LOTTERY held in Madrid, Spain. You have won EIGHT HUNDRED AND FIFTY THOUSAND EUROS.

Reference: ES/9420/2005
Batch: 074/05/ZY369

To claim, contact our fiduciary agent with your full name, address, telephone number and a copy of your identification. A processing fee of 450 EUR applies.

Note: you may not have entered this lottery. Entries are drawn from a database of email addresses.`,
  },
  {
    id: 202,
    fromName: "HOT SINGLES IN YOUR AREA",
    from: "connect@meet-tonight-network.biz",
    subject: "Someone viewed your profile 47 times",
    date: "9/03/2024 4:44 AM",
    read: true,
    body: `Hi!

I saw your profile and I could not stop looking. I am new in your area and looking to meet someone genuine.

Click here to see my pictures and chat with me now. I am online RIGHT NOW.

You do not have a profile? That is okay, we made one for you!`,
  },
  {
    id: 203,
    fromName: "Baruch Dining Services",
    from: "dining@baruch.cuny.edu",
    subject: "Your feedback matters! (5 minute survey)",
    date: "5/02/2026 11:00 AM",
    read: true,
    body: `Dear student,

You recently visited a campus dining location. We would love to hear about your experience!

This survey takes approximately 5 minutes and covers 34 questions about food quality, ambience, and staff friendliness.

As a thank you, you will be entered into a drawing for a $5 dining credit.`,
  },
  {
    id: 204,
    fromName: "Weekly Career Newsletter",
    from: "digest@career-compass-weekly.com",
    subject: "10 resume mistakes that make recruiters cringe (number 7 will shock you)",
    date: "3/22/2026 6:00 AM",
    read: false,
    body: `This week in Career Compass:

- 10 resume mistakes that make recruiters cringe
- Why your cover letter needs a hook
- Networking: it is not what you know
- Dress for the job you want

You are receiving this because you attended a career fair in 2024. To unsubscribe, reply UNSUBSCRIBE (this does not work).`,
  },
  {
    id: 205,
    fromName: "IT Helpdesk",
    from: "helpdesk@baruch.cuny.edu",
    subject: "REMINDER: Password expiring in 6 days",
    date: "1/20/2026 8:00 AM",
    read: true,
    body: `Your CUNYfirst password will expire on January 26.

This is a reminder of the reminder sent yesterday. You will receive one reminder per day until the password is changed.`,
  },
]

/**
 * Half-written mail. Drafts are the folder where honesty lives: the messages
 * you meant to send, kept mid-sentence the way real drafts are.
 */
const DRAFTS: Message[] = [
  {
    id: 301,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "RE: Speaker Invitation: WebDev Summit 2026",
    date: "12/06/2025 11:40 PM",
    read: true,
    body: `Hi Michael,

Thank you for the invitation. I would be glad to speak. For a topic I was thinking either "Building a desktop in a browser" or possibly

[draft - not sent]`,
  },
  {
    id: 302,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "thank you note - Prof. Vasquez",
    date: "7/29/2026 12:04 AM",
    read: true,
    body: `Professor,

I wanted to say properly that the letter means a lot. You have written more of my career than either of us

this is too much. shorter. just say thank you and mean it

[draft - not sent]`,
  },
  {
    id: 303,
    fromName: "Joel Vasquez",
    from: "jfvasq1@gmail.com",
    subject: "(no subject)",
    date: "8/12/2026 2:17 AM",
    read: true,
    body: `ideas for the desktop, do not lose these

- winamp. obviously
- clippy but he leaves when you tell him
- the amber shutdown screen
- patch notes app that explains the whole thing
- a fake internet for IE with a webring

[draft - not sent]`,
  },
]

type FolderId = "inbox" | "outbox" | "sent" | "deleted" | "drafts"

const FOLDERS: { id: FolderId; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "/images/win95/folder-closed-16.png" },
  { id: "outbox", label: "Outbox", icon: "/images/win95/folder-closed-16.png" },
  { id: "sent", label: "Sent Items", icon: "/images/win95/folder-closed-16.png" },
  { id: "deleted", label: "Deleted Items", icon: "/images/win95/recycle-empty-16.png" },
  { id: "drafts", label: "Drafts", icon: "/images/win95/folder-closed-16.png" },
]

/**
 * Toolbar button: icon over a label, as Outlook Express had.
 *
 * The icon is a drawn component rather than an emoji, because an emoji is a
 * different picture on every platform and none of them look like anything
 * Microsoft shipped.
 */
function ToolButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="t9 flex w-[78px] flex-col items-center gap-[2px] border-2 border-transparent px-1 py-[2px] leading-none enabled:hover:border-t-white enabled:hover:border-l-white enabled:hover:border-r-[#404040] enabled:hover:border-b-[#404040] enabled:active:border-t-[#404040] enabled:active:border-l-[#404040] enabled:active:border-r-white enabled:active:border-b-white disabled:text-[#808080]"
    >
      <span className="flex h-[20px] items-center leading-none">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

export default function Contact() {
  const [folder, setFolder] = useState<FolderId>("inbox")
  const [messages, setMessages] = useState<Message[]>(INBOX)
  const [selected, setSelected] = useState<number | null>(INBOX[0].id)
  const [composing, setComposing] = useState(false)
  const [sent, setSent] = useState<Message[]>(SENT)

  const [to] = useState("Joel Vasquez")
  const [subject, setSubject] = useState("")
  const [from, setFrom] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const shown =
    folder === "inbox"
      ? messages
      : folder === "sent"
        ? sent
        : folder === "deleted"
          ? DELETED
          : folder === "drafts"
            ? DRAFTS
            : []
  const current = shown.find((m) => m.id === selected) ?? null
  const unread = messages.filter((m) => !m.read).length

  const open = (id: number) => {
    setSelected(id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!from || !subject || !body) {
      setNotice({ ok: false, text: "Please fill out all fields." })
      return
    }
    try {
      setSubmitting(true)
      const result = await sendEmail(new FormData(e.currentTarget))
      setNotice({ ok: result.success, text: result.message })
      if (result.success) {
        setSent((prev) => [
          ...prev,
          {
            id: Date.now(),
            from,
            fromName: from,
            subject,
            date: new Date().toLocaleString(),
            read: true,
            body,
          },
        ])
        formRef.current?.reset()
        setSubject("")
        setFrom("")
        setBody("")
        setComposing(false)
      }
    } catch {
      setNotice({ ok: false, text: "An error occurred. Please email jfvasq1@gmail.com directly." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="win95-type flex h-full w-full flex-col bg-[#c0c0c0]"
      style={{ fontFamily: '"MS Sans Serif", sans-serif' }}
    >
      {/* Menu bar */}
      <div className="flex gap-3 border-b border-[#808080] px-2 py-[2px] text-xs">
        {["File", "Edit", "View", "Go", "Tools", "Compose", "Help"].map((m) => (
          <span key={m}>
            <span className="underline">{m[0]}</span>
            {m.slice(1)}
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[#808080] px-1 py-1">
        <ToolButton label="Compose" icon={<ComposeIcon />} onClick={() => setComposing(true)} />
        <ToolButton label="Send/Recv" icon={<SendReceiveIcon />} onClick={() => setNotice({ ok: true, text: "No new messages." })} />
        <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
        <ToolButton label="Reply" icon={<ReplyIcon />} onClick={() => setComposing(true)} disabled={!current} />
        <ToolButton label="Reply All" icon={<ReplyAllIcon />} onClick={() => setComposing(true)} disabled={!current} />
        <ToolButton label="Forward" icon={<ForwardIcon />} disabled={!current} />
        <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
        <ToolButton
          label="Delete" icon={<DeleteIcon />}
          disabled={!current}
          onClick={() => {
            if (!current) return
            setMessages((prev) => prev.filter((m) => m.id !== current.id))
            setSelected(null)
          }}
        />
        <ToolButton label="Address Book" icon={<AddressBookIcon />} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree */}
        <div className="w-[170px] shrink-0 overflow-auto border-r border-[#808080] bg-white p-1">
          <div className="flex items-center gap-1 text-xs font-bold">
            <img src="/images/win95/computer-16.png" alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
            Outlook Express
          </div>
          <div className="ml-3 mt-1 flex items-center gap-1 text-xs">
            <img src="/images/win95/folder-open-16.png" alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
            Local Folders
          </div>
          <ul className="ml-6">
            {FOLDERS.map((f) => {
              // Outlook bolded a folder count only for unread mail. Deleted
              // Items carries one unread newsletter, which is accurate.
              const count =
                f.id === "inbox" ? unread : f.id === "deleted" ? DELETED.filter((m) => !m.read).length : 0
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFolder(f.id)
                      setSelected(null)
                    }}
                    className={`flex w-full items-center gap-1 px-1 text-left text-xs ${
                      folder === f.id ? "bg-[#000080] text-white" : "text-black"
                    }`}
                  >
                    <img src={f.icon} alt="" className="h-4 w-4" style={{ imageRendering: "pixelated" }} />
                    <span className={count ? "font-bold" : ""}>
                      {f.label}
                      {count ? ` (${count})` : ""}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Message list over preview pane */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div data-list className="h-[45%] overflow-auto border-b border-[#808080] bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["", "From", "Subject", "Received"].map((h) => (
                    <th
                      key={h || "icon"}
                      className="border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-1 py-[1px] text-left font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-2 text-xs text-[#808080]">
                      There are no items in this view.
                    </td>
                  </tr>
                ) : (
                  shown.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => open(m.id)}
                      className={`cursor-default ${selected === m.id ? "bg-[#000080] text-white" : "text-black"} ${
                        m.read ? "" : "font-bold"
                      }`}
                    >
                      <td className="w-[20px] px-1 align-middle">
                        {m.read ? <MailReadIcon /> : <MailUnreadIcon />}
                      </td>
                      <td className="px-1">{m.fromName}</td>
                      <td className="px-1">{m.subject}</td>
                      <td className="whitespace-nowrap px-1">{m.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div data-preview className="flex-1 overflow-auto bg-white">
            {current ? (
              <>
                <div className="border-b border-[#808080] bg-[#c0c0c0] px-2 py-1 text-xs">
                  <div>
                    <strong>From:</strong> {current.fromName} &lt;{current.from}&gt;
                  </div>
                  <div>
                    <strong>Date:</strong> {current.date}
                  </div>
                  <div>
                    <strong>To:</strong> Joel Vasquez
                  </div>
                  <div>
                    <strong>Subject:</strong> {current.subject}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap p-2 text-xs" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
                  {current.body}
                </pre>
              </>
            ) : (
              <p className="p-2 text-xs text-[#808080]">No message selected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 border-t border-white bg-[#c0c0c0] px-2 py-[2px] text-xs">
        <span data-status>
          {shown.length} message(s), {unread} unread
        </span>
        {notice && <span className={notice.ok ? "" : "text-[#800000]"}>{notice.text}</span>}
      </div>

      {/* Compose opens as its own window, as it did in Outlook Express */}
      {composing && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-6">
          <div className="w-[92%] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] shadow-[4px_4px_10px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between bg-[#000080] px-2 py-[3px]">
              <span className="text-xs font-bold text-white">New Message</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setComposing(false)}
                className="flex h-4 w-4 items-center justify-center border border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
              >
                <CloseIcon />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Honeypot: hidden from real users, so a filled value means a bot. */}
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
              />

              <div className="flex items-center gap-1 border-b border-[#808080] px-1 py-1">
                <ToolButton label="Send" icon={<SendIcon />} />
                <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
                <ToolButton label="Cut" icon={<CutIcon />} />
                <ToolButton label="Copy" icon={<CopyIcon />} />
                <ToolButton label="Paste" icon={<PasteIcon />} />
                <div className="mx-1 h-[34px] w-[2px] border-l border-l-[#808080] border-r border-r-white" />
                <ToolButton label="Attach" icon={<AttachIcon />} />
              </div>

              <div className="p-2">
                {[
                  ["To:", to, null],
                  ["From:", from, setFrom],
                  ["Subject:", subject, setSubject],
                ].map(([label, value, setter]) => (
                  <div key={label as string} className="mb-1 flex items-center">
                    <span className="w-14 text-xs">{label as string}</span>
                    <input
                      type="text"
                      name={label === "From:" ? "from" : label === "Subject:" ? "subject" : "to"}
                      aria-label={(label as string).replace(":", "")}
                      readOnly={!setter}
                      value={value as string}
                      onChange={setter ? (e) => (setter as (v: string) => void)(e.target.value) : undefined}
                      required={Boolean(setter)}
                      className={`flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-1 text-xs outline-none ${
                        setter ? "bg-white" : "bg-[#c0c0c0]"
                      }`}
                    />
                  </div>
                ))}

                <textarea
                  name="message"
                  aria-label="Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={10}
                  className="mt-1 w-full resize-none border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-1 text-xs outline-none"
                />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs">Include your name so I can get back to you.</span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-[23px] min-w-[75px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-xs disabled:text-[#808080] active:border-t-[#404040] active:border-l-[#404040]"
                  >
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
