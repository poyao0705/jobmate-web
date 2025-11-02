import React from "react";
import styled from "styled-components";

interface ContextInfo {
  has_context: boolean;
  job?: { id: number; title: string; company: string };
  gap?: { content: string };
  snippets_count?: number;
  snippets?: Array<{ doc_type: string; content: string }>;
  message?: string;
}

interface ContextLoadedNotificationProps {
  context: ContextInfo;
  onDismiss?: () => void;
}

const NotificationContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  max-width: 420px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.4s ease-out;
  z-index: 9999;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const Content = styled.div`
  font-size: 14px;
  line-height: 1.5;
`;

const JobInfo = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  font-size: 13px;
`;

const SnippetList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
  font-size: 13px;
`;

const SnippetItem = styled.li`
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "✓";
    display: inline-block;
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    text-align: center;
    line-height: 18px;
    font-size: 12px;
  }
`;

const Badge = styled.span`
  display: inline-block;
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`;

const MissingSkillsPreview = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  font-size: 13px;
`;

const ContextLoadedNotification: React.FC<ContextLoadedNotificationProps> = ({
  context,
  onDismiss,
}) => {
  if (!context.has_context) {
    return null;
  }

  // Extract missing skills count from gap content
  const missingSkillsMatch = context.gap?.content?.match(
    /MISSING SKILLS \((\d+) total\)/
  );
  const missingSkillsCount = missingSkillsMatch
    ? parseInt(missingSkillsMatch[1])
    : 0;

  // Extract first few missing skill names
  const skillsMatch = context.gap?.content?.match(/\d+\.\s+([^\n(]+)/g);
  const topSkills =
    skillsMatch?.slice(0, 3).map((s) => s.replace(/^\d+\.\s+/, "").trim()) ||
    [];

  return (
    <NotificationContainer>
      <Header>
        <Title>
          <span>✨</span>
          Context Loaded
        </Title>
        {onDismiss && (
          <CloseButton onClick={onDismiss} aria-label="Close">
            ✕
          </CloseButton>
        )}
      </Header>

      <Content>
        <div>
          AI has been provided with your full context for personalized guidance.
        </div>

        {context.job && (
          <JobInfo>
            <strong>📋 Job:</strong> {context.job.title} at{" "}
            {context.job.company}
          </JobInfo>
        )}

        <SnippetList>
          {context.snippets?.map((snippet, idx) => (
            <SnippetItem key={idx}>
              <span>
                {snippet.doc_type === "job" && "💼 Job Description"}
                {snippet.doc_type === "resume" && "📄 Your Resume"}
                {snippet.doc_type === "profile" && "👤 Your Profile"}
                {snippet.doc_type === "gap" && "📊 Skill Gap Analysis"}
              </span>
            </SnippetItem>
          ))}
        </SnippetList>

        {missingSkillsCount > 0 && (
          <MissingSkillsPreview>
            <strong>🔴 Missing Skills:</strong>
            <Badge>{missingSkillsCount} total</Badge>
            <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.9 }}>
              {topSkills.join(", ")}
              {topSkills.length < missingSkillsCount &&
                `, +${missingSkillsCount - topSkills.length} more`}
            </div>
          </MissingSkillsPreview>
        )}
      </Content>
    </NotificationContainer>
  );
};

export default ContextLoadedNotification;
