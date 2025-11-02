import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTextIcon, AlertTriangleIcon } from "lucide-react";
import { SecondaryButton } from "../ui/buttons";
import React from "react";
import { useGetResumesQuery } from "@/store";

export const ManageResumeCardWrapper = ({ children }: { children: React.ReactNode }) => (
  <Card className="h-full w-full max-w-xl p-4 sm:p-6 my-2 sm:my-6 min-h-[40vh] flex flex-col">{children}</Card>
);

export const ManageResumeCardHeaderWrapper = ({ children }: { children: React.ReactNode }) => (
  <CardHeader className="flex-shrink-0">{children}</CardHeader>
);

export const ManageResumeCardContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <CardContent className="space-y-1 flex flex-col gap-6 flex-1 justify-between">{children}</CardContent>
);

interface Resume {
  id: number;
  original_filename: string;
  is_default: boolean;
  created_at: string;
}

interface ManageResumeCardProps {
  onManageResume?: () => void;
}

export default function ManageResumeCard({ onManageResume }: ManageResumeCardProps) {
  const { data: resumesData, isLoading, error } = useGetResumesQuery();
  
  const allResumes = resumesData?.resumes || [];
  const defaultResume = allResumes.find((resume: Resume) => resume.is_default) || null;
  const loading = isLoading;
  return (
    <ManageResumeCardWrapper>
      <ManageResumeCardHeaderWrapper>
        {loading ? (
          <Skeleton className="h-8 w-64 mx-auto" />
        ) : (
          <CardTitle className="text-2xl sm:text-3xl text-brand-primary font-bold font-sans text-center">Resume Management</CardTitle>
        )}
      </ManageResumeCardHeaderWrapper>
      <ManageResumeCardContentWrapper>
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          {loading ? (
            <div className="w-full space-y-4">
              <Skeleton className="h-16 w-16 mx-auto rounded-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <FileTextIcon className="w-16 h-16 text-brand-secondary mx-auto" />
              <p className="text-md text-red-600 font-sans">
                Failed to load resume information
              </p>
            </div>
          ) : allResumes.length === 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <FileTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-brand-secondary mx-auto" />
              <div className="border-2 border-dashed border-orange-400 bg-yellow-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-yellow-800 font-medium mb-2">
                  <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
                  No file found
                </div>
                <p className="text-yellow-700 text-sm sm:text-base">
                  Upload your first resume to get started with personalized job recommendations and skill analysis.
                </p>
              </div>
            </div>
          ) : defaultResume ? (
            <div className="space-y-3 sm:space-y-4">
              <FileTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-brand-secondary mx-auto" />
              <p className="text-sm sm:text-md text-brand-primary font-sans text-center px-2">
                Upload and manage your resumes to get personalized job recommendations and skill analysis.
              </p>
              <Alert className="border-accent bg-accent/20 flex flex-col items-center text-center">
                <AlertDescription className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-primary">
                        Current Default Resume:
                      </p>
                    </div>
                    <p className="text-sm text-primary font-mono mt-1">
                      {defaultResume.original_filename}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <FileTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-brand-secondary mx-auto" />
              <p className="text-sm sm:text-md text-brand-primary font-sans text-center px-2">
                Upload and manage your resumes to get personalized job recommendations and skill analysis.
              </p>
              <Alert className="border-yellow-200 bg-yellow-50 flex flex-col items-center text-center">
                <FileTextIcon className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="flex flex-col items-center text-center">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-medium text-yellow-800">
                      {allResumes.length} Resume{allResumes.length !== 1 ? 's' : ''} Found
                    </p>
                    <div className="mt-2 space-y-1 flex flex-col items-center">
                      {allResumes.map((resume, index) => (
                        <p key={resume.id} className="text-sm text-yellow-700 font-mono">
                          {index + 1}. {resume.original_filename}
                        </p>
                      ))}
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      No default resume set. You can set one as default in the resume manager to get personalized job recommendations.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : onManageResume ? (
          <SecondaryButton 
            className="w-full"
            onClick={onManageResume}
          >
            Manage Resume
          </SecondaryButton>
        ) : null}
      </ManageResumeCardContentWrapper>
    </ManageResumeCardWrapper>
  )
}
