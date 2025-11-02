"use client"

import { ContactForm } from "@/components/contact/ContactForm"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { PrimaryButton } from "@/components/ui/buttons"
import { MessageCircle } from "lucide-react"

interface ContactDialogProps {
  trigger?: React.ReactNode
  triggerText?: string
  triggerIcon?: React.ReactNode
  userName?: string
  userEmail?: string
}

export function ContactDialog({ 
  trigger, 
  triggerText = "Contact Us",
  triggerIcon = <MessageCircle className="h-5 w-5" />,
  userName,
  userEmail
}: ContactDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <PrimaryButton className="inline-flex items-center gap-2 font-semibold">
            {triggerIcon}
            {triggerText}
          </PrimaryButton>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary">
            Contact Us
          </DialogTitle>
          <DialogDescription className="text-base">
            Fill out the form below and we&apos;ll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ContactForm 
            initialName={userName}
            initialEmail={userEmail}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
