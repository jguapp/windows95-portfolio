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

function clientIp(): string {
  const h = headers()
  // Vercel sets x-forwarded-for; the first entry is the client.
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}

export async function sendEmail(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    // Honeypot: hidden from real users, so a filled value means a bot. Report
    // success so the bot doesn't retry with a different strategy.
    if ((formData.get("company_website") as string)?.trim()) {
      return { success: true, message: "Message sent successfully! I'll get back to you soon." }
    }

    const limit = rateLimit(`contact:${clientIp()}`, MAX_SUBMISSIONS, WINDOW_MS)
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

    const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY
    if (!web3FormsKey) {
      console.error("WEB3FORMS_ACCESS_KEY is not set; cannot deliver contact form submission.")
      return {
        success: false,
        message: `The contact form is temporarily unavailable. Please email me directly at ${CONTACT_EMAIL}`,
      }
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: web3FormsKey,
        subject: `[Portfolio Contact] ${validatedData.subject}`,
        from_name: "Windows 95 Portfolio Contact Form",
        reply_to: validatedData.from,
        message: validatedData.message,
        email: validatedData.from,
      }),
    })

    const responseData = await response.json()

    if (!responseData.success) {
      console.error("Web3Forms rejected the submission:", responseData.message ?? response.status)
      return {
        success: false,
        message: `Your message couldn't be delivered. Please email me directly at ${CONTACT_EMAIL}`,
      }
    }

    return { success: true, message: "Message sent successfully! I'll get back to you soon." }
  } catch (error) {
    console.error("Error sending email:", error)

    return {
      success: false,
      message: `An error occurred while sending your message. Please contact me directly at ${CONTACT_EMAIL}`,
    }
  }
}
