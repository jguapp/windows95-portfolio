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

export async function sendEmail(formData: FormData): Promise<{ success: boolean; message: string }> {
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
      // Return validation errors
      const errorMessage = result.error.errors.map((err) => `${err.path}: ${err.message}`).join(", ")
      return {
        success: false,
        message: `Invalid form data: ${errorMessage}`,
      }
    }

    const validatedData = result.data

    // Use Web3Forms - a simple, reliable service for serverless environments
    // Get your access key by signing up at https://web3forms.com/ (it's free)
    const web3FormsKey = "77273621-e5f5-460e-aefd-25093c5c6503" // Replace with your key from web3forms.com

    const web3FormsData = {
      access_key: web3FormsKey,
      subject: `[Portfolio Contact] ${validatedData.subject}`,
      from_name: "Windows 95 Portfolio Contact Form",
      reply_to: validatedData.from,
      message: validatedData.message,
      email: validatedData.from, // Sender's email
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(web3FormsData),
    })

    const responseData = await response.json()

    if (responseData.success) {
      return {
        success: true,
        message: `Message sent successfully! I'll get back to you soon.`,
      }
    } else {
      // If Web3Forms fails, try the direct email approach
      const success = await sendDirectEmail(validatedData)

      if (success) {
        return {
          success: true,
          message: `Message sent successfully via alternate method!`,
        }
      } else {
        throw new Error("All email methods failed")
      }
    }
  } catch (error) {
    console.error("Error sending email:", error)

    // For development/debugging - log more details about the error
    if (process.env.NODE_ENV !== "production") {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return {
      success: false,
      message: "An error occurred while sending your message. Please contact me directly at jfvasq1@gmail.com",
    }
  }
}

// Direct email approach using a different service
async function sendDirectEmail(data: EmailFormData): Promise<boolean> {
  try {
    // Using FormSpree as a backup option
    // FormSpree is very reliable and requires minimal setup
    const formSpreeEndpoint = "https://formspree.io/f/YOUR_FORMSPREE_ID" // Replace with your FormSpree endpoint

    const formData = new FormData()
    formData.append("email", data.from)
    formData.append("_subject", `[Portfolio Contact] ${data.subject}`)
    formData.append("message", data.message)
    formData.append("_replyto", data.from)

    const response = await fetch(formSpreeEndpoint, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })

    return response.ok
  } catch (error) {
    console.error("Direct email sending failed:", error)
    return false
  }
}
