"use client";

import React from "react";
import { Modal, Button } from "react-bootstrap";
import {
  StyledModal,
  GlobalModalStyle,
  ManualBackdrop,
  CompanyHeader,
  CompanyLogo,
  CompanyBrand,
  BrandText,
  JobTitle,
  CompanyName,
  JobLocation,
  JobDetails,
  DetailRow,
  DetailIcon,
  DetailText,
  SalaryText,
  SkillsSection,
  SectionTitle,
  SkillBadge,
  AnalysisSection,
  BetaBadge,
} from "./jobAnalysisModal.style";
import GenerateAnalysisButton from "../genereteAnalysisButton";

interface Job {
  id: string;
  title?: string;
  company?: string;
  company_url?: string;
  location?: string;
  salary_raw?: string;
  skillRequirements?: string[];
  required_skills?: string[];
  external_url?: string;
  company_logo_url?: string;
  employment_type?: string[];
  date_posted?: string;
  viewed?: boolean;
  bookmarked?: boolean;
}

interface JobAnalysisModalProps {
  show: boolean;
  onHide: () => void;
  job: Job;
}

const JobAnalysisModal: React.FC<JobAnalysisModalProps> = ({
  show,
  onHide,
  job,
}) => {
  const handleQuickApply = () => {
    // Handle quick apply logic here
    if (job.external_url) {
      window.open(job.external_url, "_blank");
    } else {
      console.log("No external URL available for this job");
    }
  };

  const handleChatOpen = () => {
    // Trigger preload then create chat and open it. Provide simple notifications.
    (async () => {
      try {
        const useDevLG = process.env.NEXT_PUBLIC_ENABLE_DEV_LANGGRAPH === "1";

        if (useDevLG) {
          // Try to grab a local access token from common localStorage keys (best-effort)
          const tryTokenKeys = [
            "access_token",
            "auth_token",
            "id_token",
            "token",
          ];
          let authToken: string | null = null;
          try {
            for (const k of tryTokenKeys) {
              const v = localStorage.getItem(k);
              if (v) {
                authToken = v;
                break;
              }
            }
          } catch (e) {
            // localStorage may be unavailable in some contexts; ignore
          }

          // Call the dev LangGraph trigger on the backend via the Next proxy
          const devRes = await fetch(`/api/backend/_dev/langgraph/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: Number(job.id),
              user_id: job.id,
              auth_token: authToken,
            }),
          });

          if (devRes.ok) {
            const js = await devRes.json();
            // If LangGraph created a chat and returned an id, open it. Otherwise, fallback.
            const lgResp = js.langgraph_response || {};
            // flow implementations vary; try to find a chat id in possible locations
            const chatId =
              lgResp?.result?.chat_id ||
              lgResp?.output?.chat_id ||
              lgResp?.chat_id;
            if (chatId) {
              window.location.href = `/chat/${chatId}`;
              return;
            }
            // Not a direct chat create response - show a simple confirmation and open chat help
            alert(
              "LangGraph run triggered. If a chat was created it will appear shortly."
            );
            window.open("/chat_help");
            return;
          } else {
            console.warn("Dev LangGraph trigger failed", await devRes.text());
            alert("Failed to trigger LangGraph run; opening fallback chat.");
            window.open("/chat_help");
            return;
          }
        } else {
          // Start preload (background) via frontend proxy to backend
          await fetch(`/api/backend/preload-context`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_id: Number(job.id) }),
          });

          // Poll preload status for up to 8 seconds
          const start = Date.now();
          let ready = false;
          while (Date.now() - start < 8000) {
            const res = await fetch(
              `/api/backend/preload-status?job_id=${job.id}`
            );
            if (res.ok) {
              const js = await res.json();
              if (js.exists) {
                ready = true;
                break;
              }
            }
            await new Promise((r) => setTimeout(r, 800));
          }

          if (!ready) {
            // Notify user that preload is still in progress; continue to create chat anyway
            // Use alert as minimal notification; you can replace with toast later
            alert(
              "Context preloading is taking longer than expected. Chat will open and updates may arrive shortly."
            );
          }

          // Create chat with job_id so server seeds any preloaded context into system messages
          const createRes = await fetch(`/api/backend/chat/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              job_id: Number(job.id),
            }),
          });
          if (createRes.status === 201) {
            const js = await createRes.json();
            const chatId = js.chat?.id;
            const contextInfo = js.context;

            if (chatId) {
              // Show context notification if context was loaded
              if (contextInfo?.has_context) {
                // Store context info in sessionStorage for the chat page to display
                sessionStorage.setItem(
                  `chat_context_${chatId}`,
                  JSON.stringify(contextInfo)
                );

                // Show brief confirmation with context summary
                const missingSkillsMatch = contextInfo.gap?.content?.match(
                  /MISSING SKILLS \((\d+) total\)/
                );
                const missingCount = missingSkillsMatch
                  ? parseInt(missingSkillsMatch[1])
                  : 0;
                const summary =
                  `✨ Context Loaded!\n\n` +
                  `📊 ${
                    contextInfo.snippets_count || 0
                  } context snippets prepared\n` +
                  (missingCount > 0
                    ? `🔴 ${missingCount} missing skills identified\n`
                    : "") +
                  `\nOpening personalized chat...`;

                alert(summary);
              }

              // Open chat page and pass chat ID as query parameter
              window.location.href = `/chat_help?chatId=${chatId}`;
              return;
            }
          }
          // Fallback: open generic chat help
          window.open("/chat_help");
          return;
        }
      } catch (err) {
        console.error(err);
        window.open("/chat_help");
      }
    })();
  };

  const handleSave = () => {
    // Handle save job logic here
    console.log("Job saved:", job.id);
  };

  const handleAnalyze = () => {
    // Handle analyze fit logic here
    console.log("Analyzing fit for job:", job.id);
  };

  return (
    <>
      <GlobalModalStyle />
      {/* Manual backdrop for guaranteed coverage */}
      <ManualBackdrop $show={show} onClick={onHide} />

      <StyledModal
        show={show}
        onHide={onHide}
        backdrop={false}
        keyboard={true}
        animation={true}
        scrollable={false}
        enforceFocus={true}
        restoreFocus={true}
        className="side-panel-modal"
      >
        <Modal.Header>
          <Modal.Title>Job Details</Modal.Title>
          <button
            type="button"
            className="btn-close"
            onClick={onHide}
            aria-label="Close"
          >
            ✕
          </button>
        </Modal.Header>

        <Modal.Body>
          {/* Company Header */}
          <CompanyHeader>
            {job.company_logo_url ? (
              <CompanyLogo>
                <img src={job.company_logo_url} alt={`${job.company} logo`} />
              </CompanyLogo>
            ) : (
              <>
                <CompanyBrand>
                  {job.company
                    ?.split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "CL"}
                </CompanyBrand>
                <BrandText>&lt; smarter faster hire &gt;</BrandText>
              </>
            )}

            <JobTitle>{job.title}</JobTitle>
            <CompanyName>{job.company}</CompanyName>
            {job.location && <JobLocation>{job.location}</JobLocation>}
          </CompanyHeader>

          {/* Job Details */}
          <JobDetails>
            {job.employment_type && job.employment_type.length > 0 && (
              <DetailRow>
                <DetailIcon>⏰</DetailIcon>
                <DetailText>
                  {job.employment_type
                    .join(", ")
                    .replace("FULL_TIME", "Full time")
                    .replace("PART_TIME", "Part time")
                    .replace("CONTRACT", "Contract")}
                </DetailText>
              </DetailRow>
            )}

            {job.salary_raw && (
              <DetailRow>
                <DetailIcon>💰</DetailIcon>
                <SalaryText>{job.salary_raw}</SalaryText>
              </DetailRow>
            )}

            {job.date_posted && (
              <DetailRow>
                <DetailIcon>📅</DetailIcon>
                <DetailText>
                  Posted {new Date(job.date_posted).toLocaleDateString()}
                </DetailText>
              </DetailRow>
            )}
          </JobDetails>

          {/* Skills Section (use required_skills from API, fall back to legacy skillRequirements) */}
          {(() => {
            // Helper function to ensure we have a valid array
            const getSkillsArray = (skillsData: any): string[] => {
              if (!skillsData) return [];
              if (Array.isArray(skillsData)) return skillsData;
              if (typeof skillsData === "string") {
                try {
                  const parsed = JSON.parse(skillsData);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              }
              return [];
            };

            const skills = getSkillsArray(
              job.required_skills || job.skillRequirements
            );
            return skills.length > 0 ? (
              <SkillsSection>
                <SectionTitle>Required Skills</SectionTitle>
                <div>
                  {skills.map((skill, index) => (
                    <SkillBadge key={index}>{skill}</SkillBadge>
                  ))}
                </div>
              </SkillsSection>
            ) : null;
          })()}

          {/* Analysis Section */}
          <AnalysisSection>
            <SectionTitle>
              🔍 Analyse your fit
              <BetaBadge>Beta</BetaBadge>
            </SectionTitle>
            <DetailText>
              Get AI-powered insights about how well this role matches your
              profile, including skill gap analysis and personalized
              recommendations.
            </DetailText>
          </AnalysisSection>
        </Modal.Body>

        <Modal.Footer>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              gap: "16px",
            }}
          >
            <GenerateAnalysisButton
              buttonType="chat"
              onClick={handleChatOpen}
              style={{ flex: "0 0 45%" }}
            >
              {/* Chat icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="me-1"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Open Chat
            </GenerateAnalysisButton>

            <GenerateAnalysisButton
              onClick={handleQuickApply}
              style={{ flex: "0 0 45%" }}
            >
              {/* Arrow icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="me-1"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              Apply
            </GenerateAnalysisButton>
          </div>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default JobAnalysisModal;
