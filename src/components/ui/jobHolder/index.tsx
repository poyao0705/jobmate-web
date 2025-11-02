"use client";

import React, { useState } from "react";
import {
  JobCard,
  JobCardBody,
  JobCardFooter,
  JobCardHeader,
  JobTitle,
  CompanyName,
  JobAddress,
  JobSalary,
  SkillRequirements,
  CompanyBrand,
  WorkTypeBadge,
  FooterText,
  ActionButton,
} from "./jobHolder.style";
import QuickApplyButton from "../genereteAnalysisButton";
import JobAnalysisModal from "../jobAnalysisModal";
import {
  useSaveJobMutation,
  useUnsaveJobMutation,
  useCheckJobSavedStatusQuery,
} from "@/store/jobCollectionsApi";
import type { Job } from "@/types/api";
import { toast } from "sonner";

const JobHolder = ({ job }: { job: Job }) => {
  const [showModal, setShowModal] = useState(false);

  // Job collection mutations and queries
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();
  const { data: jobStatus, refetch: refetchJobStatus } =
    useCheckJobSavedStatusQuery(job.id);

  const isJobSaved = jobStatus?.saved || false;
  const isProcessing = isSaving || isUnsaving;

  const handleAnalyzeClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveToggle = async () => {
    try {
      if (isJobSaved) {
        await unsaveJob(job.id).unwrap();
        toast.success("Job removed from saved.", {
          description: "Related skill gap reports were deleted.",
        });
      } else {
        await saveJob(job.id).unwrap();
        toast.success("Job successfully saved and generating skill gap report...", {
          description: "It may take 1-2 minutes to complete.",
        });
      }
      // Force refetch the status to ensure UI updates immediately
      refetchJobStatus();
    } catch (error) {
      console.error("Error toggling job save status:", error);
      toast.error("Failed to update saved jobs.");
      console.error("Error details:", {
        error,
        status:
          error && typeof error === "object" && "status" in error
            ? error.status
            : "unknown",
        data:
          error && typeof error === "object" && "data" in error
            ? error.data
            : "unknown",
      });
    }
  };

  return (
    <>
      <JobCard className="mb-3 border-0 shadow-sm h-100">
        <JobCardBody className="p-4">
          {/* Header with company logo (9:3 ratio) */}
          <JobCardHeader>
            <div className="jh-text">
              {job.title && <JobTitle className="mb-2">{job.title}</JobTitle>}
              {job.company && (
                <CompanyName className="mb-1">{job.company}</CompanyName>
              )}
              {job.location && (
                <JobAddress className="mb-1">{job.location}</JobAddress>
              )}
              {(job.salary_min || job.salary_max) && (
                <JobSalary className="mb-2">
                  {job.salary_min && job.salary_max
                    ? `${
                        job.salary_currency || "$"
                      }${job.salary_min.toLocaleString()} - ${
                        job.salary_currency || "$"
                      }${job.salary_max.toLocaleString()}`
                    : job.salary_min
                    ? `${
                        job.salary_currency || "$"
                      }${job.salary_min.toLocaleString()}+`
                    : job.salary_max
                    ? `Up to ${
                        job.salary_currency || "$"
                      }${job.salary_max.toLocaleString()}`
                    : ""}
                </JobSalary>
              )}
              {job.required_skills &&
                Array.isArray(job.required_skills) &&
                job.required_skills.length > 0 && (
                  <SkillRequirements>
                    {job.required_skills.slice(0, 3).map((skill, index) => (
                      <div key={index} className="skill-item">
                        {skill}
                      </div>
                    ))}
                    {job.required_skills.length > 3 && (
                      <div className="skill-item skill-more">
                        +{job.required_skills.length - 3} more
                      </div>
                    )}
                  </SkillRequirements>
                )}
            </div>

            <div className="jh-logo">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company || "Company logo"}
                  className="rounded"
                />
              ) : job.company ? (
                <CompanyBrand>
                  {job.company.split(" ")[0].toLowerCase()}.
                </CompanyBrand>
              ) : null}
            </div>
          </JobCardHeader>

          {/* Work type badge */}
          {job.job_type && (
            <div className="mb-3">
              <WorkTypeBadge bg="light" className="border">
                {job.job_type
                  .replace("FULL_TIME", "Full-time")
                  .replace("PART_TIME", "Part-time")
                  .replace("CONTRACT", "Contract")
                  .replace("TEMPORARY", "Temporary")
                  .replace("INTERNSHIP", "Internship")}
              </WorkTypeBadge>
            </div>
          )}

          {/* Footer with posted date and actions */}
          <JobCardFooter>
            <div className="d-flex align-items-center">
              {job.date_posted && (
                <FooterText className="me-3">
                  {new Date(job.date_posted).toLocaleDateString()}
                </FooterText>
              )}
              {job.viewed && <FooterText>• Viewed</FooterText>}
            </div>

            {/* Right: actions (buttons sit horizontally) */}
            <div className="d-flex gap-2">
              <QuickApplyButton
                size="sm"
                onClick={handleSaveToggle}
                disabled={isProcessing}
                className="d-inline-flex align-items-center"
                buttonType="save"
                style={{
                  background:
                    isProcessing || isJobSaved
                      ? "linear-gradient(135deg, #007bff 0%, #0056b3 100%)"
                      : "transparent",
                  color: isProcessing || isJobSaved ? "white" : "#007bff",
                  marginRight: "8px",
                }}
              >
                {isProcessing ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    {/* keep the icon */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={isJobSaved ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="me-1"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    {isJobSaved ? "Saved" : "Save"}
                  </>
                )}
              </QuickApplyButton>

              <QuickApplyButton
                size="sm"
                onClick={handleAnalyzeClick}
                className="d-inline-flex align-items-center"
              >
                {/* Pen icon for Analyze button */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="me-1"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Analyze
              </QuickApplyButton>
            </div>
          </JobCardFooter>
        </JobCardBody>
      </JobCard>

      {/* Job Analysis Modal */}
      <JobAnalysisModal show={showModal} onHide={handleCloseModal} job={job} />
    </>
  );
};

export default JobHolder;
