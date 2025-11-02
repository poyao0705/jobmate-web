"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components/ui/buttons"
import { useContactSubmission } from "./ContactClient"
import ReCAPTCHA from "react-google-recaptcha"
import { ContactFormData } from "@/schemas/contact"

interface ContactFormProps {
  initialName?: string
  initialEmail?: string
}

export function ContactForm({ initialName = "", initialEmail = "" }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: initialName,
    email: initialEmail,
    message: "",
    recaptcha: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})
  const [captchaValue, setCaptchaValue] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const { isSubmitting, handleFormSubmit } = useContactSubmission()

  // Update form data when initial values change (e.g., when dialog opens with new props)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: initialName,
      email: initialEmail,
    }))
  }, [initialName, initialEmail])

  const handleChange = (
    field: keyof ContactFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const handleCaptcha = (value: string | null) => {
    setCaptchaValue(value)
    setFormData((prev) => ({
      ...prev,
      recaptcha: value || "",
    }))
    // Clear reCAPTCHA error when user completes it
    if (errors.recaptcha) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: undefined,
      }))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if reCAPTCHA is completed
    if (!captchaValue) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: "Please complete the reCAPTCHA verification",
      }))
      return
    }

    const result = await handleFormSubmit(formData)
    
    if (result.success) {
      // Reset form on successful submission, but preserve initial name and email
      setFormData({ name: initialName, email: initialEmail, message: "", recaptcha: "" })
      setErrors({})
      setCaptchaValue(null)
      recaptchaRef.current?.reset()
    } else if (result.errors) {
      setErrors(result.errors)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 font-sans">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-sans">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange("name")}
          className="font-sans"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-sans">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleChange("email")}
          className="font-sans"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="font-sans">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="message"
          placeholder="Your message..."
          value={formData.message}
          onChange={handleChange("message")}
          rows={3}
          className="font-sans resize-none"
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
          onChange={handleCaptcha}
          ref={recaptchaRef}
          theme="light"
        />
        {errors.recaptcha && (
          <p className="text-sm text-destructive">{errors.recaptcha}</p>
        )}
      </div>

      <PrimaryButton
        type="submit"
        disabled={isSubmitting}
        className="w-full font-semibold"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </PrimaryButton>
    </form>
  )
}
