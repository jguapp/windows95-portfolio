"use server"

import { z } from "zod"

// Email validation schema
const EmailSchema = z.object({
  to: z.string().email().optional(),
  from: z.string().email({
    message: "Please enter a valid email address",
  }),
  subject: z.string().min(1, {
    message: "Subject is required",
  }),
  message: z.string().min(1, {
    message: "Message is required",
  }),
})

type EmailFormData = z.infer<typeof EmailSchema>

export async function sendEmailFallback(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    // Extract form data
    const rawData = {
      to: "jfvasq1@gmail.com", // Default recipient (your email)
      from: formData.get("from") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    // Validate the data
    const result = EmailSchema.safeParse(rawData)

    if (!result.success) {
      return {
        success: false,
        message: `Invalid form data`,
      }
    }

    // This is a simple logging fallback that will at least record the submission
    // in your server logs, even if email delivery fails
    console.log("CONTACT FORM SUBMISSION:")
    console.log("FROM:", rawData.from)
    console.log("SUBJECT:", rawData.subject)
    console.log("MESSAGE:", rawData.message)

    // In a real production environment, you would implement a more robust
    // fallback here, such as writing to a database or sending to a webhook

    return {
      success: true,
      message: `Your message has been recorded. For immediate assistance, please email me directly at jfvasq1@gmail.com`,
    }
  } catch (error) {
    console.error("Error in email fallback:", error)
    return {
      success: false,
      message: "Please contact me directly at jfvasq1@gmail.com",
    }
  }
}
