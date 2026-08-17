"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { rateLimit } from "@/lib/rate-limit"

const CONTACT_EMAIL = "jfvasq1@gmail.com"

// Server Actions compile to public POST endpoints, so anything enforced only in
// the browser is not a control. Everything below runs on the server.
const MAX_SUBMISSIONS = 3
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

const EmailSchema = z.object({
  from: z.string().email({
    message: "Please enter a valid email address",
  }),
  subject: z.string().min(1, { message: "Subject is required" }).max(200, {
    message: "Subject is too long",
  }),
  message: z.string().min(1, { message: "Message is required" }).max(5000, {
    message: "Message is too long",
  }),
})

async function clientIp(): Promise<string> {
  // headers() is async as of Next 15.
  const h = await headers()
  // Vercel sets x-forwarded-for; the first entry is the client.
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}

export async function sendEmail(formData: FormData): Promise<{
  success: boolean
  message: string
  /** The screened fields the browser is to deliver, present on success. */
  cleared?: { subject: string; reply_to: string; message: string; email: string }
}> {
  try {
    // Honeypot: hidden from real users, so a filled value means a bot. Report
    // success so the bot doesn't retry with a different strategy.
    if ((formData.get("company_website") as string)?.trim()) {
      return { success: true, message: "Message sent successfully! I'll get back to you soon." }
    }

    const limit = rateLimit(`contact:${await clientIp()}`, MAX_SUBMISSIONS, WINDOW_MS)
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60)
      return {
        success: false,
        message: `Too many messages sent. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or email me directly at ${CONTACT_EMAIL}`,
      }
    }

    const result = EmailSchema.safeParse({
      from: formData.get("from"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    })

    if (!result.success) {
      const errorMessage = result.error.errors.map((err) => err.message).join(", ")
      return { success: false, message: `Invalid form data: ${errorMessage}` }
    }

    const validatedData = result.data

    /*
      The server does not deliver; it clears. Web3Forms' free tier serves
      a Cloudflare challenge page to any request whose TLS handshake is
      not a browser's, so a Node fetch is refused whatever headers it
      wears (verified: identical headers pass from curl and fail from
      Node). Their access keys are public by design, an alias for the
      destination inbox, so delivery belongs in the browser, whose
      handshake is genuine. What belongs here is everything a browser
      cannot be trusted to do: the schema, the honeypot, and the per-IP
      rate limit have all already run above. The client only delivers
      what this action has cleared, and a bot that posts to Web3Forms
      directly bypasses nothing that was ever a secret.
    */
    return {
      success: true,
      message: "Message sent successfully! I'll get back to you soon.",
      cleared: {
        subject: `[Portfolio Contact] ${validatedData.subject}`,
        reply_to: validatedData.from,
        message: validatedData.message,
        email: validatedData.from,
      },
    }
  } catch (error) {
    console.error("Error sending email:", error)

    return {
      success: false,
      message: `An error occurred while sending your message. Please contact me directly at ${CONTACT_EMAIL}`,
    }
  }
}
