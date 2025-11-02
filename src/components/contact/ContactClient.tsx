"use client"

import { useState } from "react"
import emailjs from "@emailjs/browser"
import { toast } from "sonner"
import { contactFormSchema, ContactFormData } from "@/schemas/contact"

// EmailJS integration hook for contact form
export function useContactSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sendEmail = async (formData: ContactFormData) => {
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS configuration is missing. Please check your environment variables.")
      }

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_name: "Jobmate Team",
        'g-recaptcha-response': formData.recaptcha,
      }

      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      )

      if (response.status === 200) {
        toast.success("Message sent successfully! We'll get back to you soon.")
        return true
      } else {
        throw new Error(`EmailJS returned status: ${response.status}`)
      }
    } catch (error) {
      console.error("EmailJS Error:", error)
      
      if (error instanceof Error) {
        if (error.message.includes("configuration is missing")) {
          toast.error("Email service is not configured. Please try again later.")
        } else {
          toast.error("Failed to send message. Please try again.")
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
      
      return false
    }
  }

  const handleFormSubmit = async (formData: ContactFormData) => {
    const result = contactFormSchema.safeParse(formData)
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {}
      result.error.issues.forEach((error) => {
        const path = error.path[0] as keyof ContactFormData
        fieldErrors[path] = error.message
      })
      
      const firstError = result.error.issues[0]
      toast.error(firstError.message)
      return { success: false, errors: fieldErrors }
    }

    setIsSubmitting(true)

    try {
      const emailSent = await sendEmail(formData)
      return { success: emailSent, errors: {} }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An error occurred while processing your request.")
      return { success: false, errors: {} }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    handleFormSubmit,
  }
}
