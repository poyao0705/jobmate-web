import { PrimaryButton, CancelButton } from "@/components/ui/buttons";
import { auth0 } from "@/lib/auth0";
import "./globals.css";
import JobList from "@/components/ui/jobList";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { MailIcon, SendIcon } from "lucide-react";
import { ContactDialog } from "@/components/contact/ContactDialog";

export default async function Home() {
  const session = await auth0.getSession();
  if (!session) {
    // Migrate Old Chatbot frontend here

    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-2">
          <div className="text-center max-w-6xl">
              <h1 className="text-6xl md:text-8xl font-bold text-brand-primary mb-4 font-sans mt-20">
                Your <PointerHighlight
                  rectangleClassName="bg-blue-500/10 border-blue-500/50 rounded-lg"
                  pointerClassName="text-blue-500 h-3 w-3"
                  containerClassName="inline-block mx-1"
                >
                  <span className="relative z-10">Final Solution</span>
                </PointerHighlight> to Job Hunting
              </h1>
              <p className="text-md md:text-lg text-gray-600 mb-8 max-w-4xl mt-12 mx-auto text-center">
                Find your perfect job match with our AI-powered platform that analyzes your skills, preferences, and career goals to connect you with the right opportunities.
              </p>
            <div className="mt-4 flex gap-8 justify-center">
              <a href="/auth/login">
                <PrimaryButton className="py-3 font-semibold hover:shadow-lg hover:shadow-brand-accent/25">
                  <SendIcon className="w-4 h-4" />
                  Explore Now
                </PrimaryButton>
              </a>
              <ContactDialog 
                trigger={
                  <CancelButton className="py-3 font-semibold">
                    <MailIcon className="w-4 h-4" />
                    Contact Us
                  </CancelButton>
                }
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-auto pt-2 pb-6">
          <div className="max-w-4xl mx-auto px-6">
            <div className="border-t border-gray-200 pt-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-brand-primary">Jobmate.agent</h3>
                <p className="text-sm text-gray-600 mt-1">AI-Powered Job Matching Platform</p>
                <p className="text-xs text-gray-400">
                  © 2025 Jobmate.agent. All rights reserved. | Powered by AI Technology
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  } else {
    // Display job listings for authenticated users
    return (
      <div className="min-h-full">
        <div className="container mx-auto py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-brand-primary mb-4 font-mono">
              Welcome to Jobmate.agent
            </h1>
            <p className="text-gray-600 mb-4">Find your perfect job match</p>
          </div>
          <JobList />
        </div>
      </div>
    );
  }
}
