import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";

// Card wrapper
export const JobCard = styled(Card)`
  border-radius: 20px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    border-color: #d0d7de !important;
  }
`;

export const JobCardBody = styled(Card.Body)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  line-height: 1.5;
`;

// ✅ Updated header with responsive flex layout
export const JobCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 12px;

  .jh-text {
    flex: 0 0 75%;
    min-width: 0;
    padding-right: 1rem;
  }

  .jh-logo {
    flex: 0 0 25%;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding-right: 0.5rem;
    margin-right: -0.25rem;

    img {
      width: clamp(60px, 8vw, 100px); /* Responsive logo size */
      height: auto;
      object-fit: contain;
    }
  }

  /* Responsive stacking for mobile */
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 1rem;

    .jh-text,
    .jh-logo {
      flex: 0 0 auto;
      padding-right: 0;
      margin-right: 0;
    }

    .jh-logo {
      justify-content: center;
      margin-top: 0;
      align-self: center;

      img {
        width: clamp(50px, 15vw, 80px); /* Smaller on mobile */
        height: auto;
      }
    }
  }
`;

export const JobCardFooter = styled.div`
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* Mobile responsiveness */
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;

    > div:first-child {
      text-align: center;
    }

    > div:last-child {
      justify-content: center;
    }
  }
`;

export const JobTitle = styled(Card.Title)`
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.25rem;
  color: #374151;

  @media (max-width: 576px) {
    font-size: 1.1rem;
    text-align: center;
  }
`;

export const JobSubtitle = styled(Card.Subtitle)`
  margin-bottom: 4px;
  color: #374151;
`;

export const CompanyName = styled(JobSubtitle)`
  font-size: 0.95rem;

  @media (max-width: 576px) {
    text-align: center;
  }
`;

export const JobAddress = styled(JobSubtitle)`
  font-size: 0.9rem;

  @media (max-width: 576px) {
    text-align: center;
  }
`;

export const JobSalary = styled(JobSubtitle)`
  font-weight: bold;
  font-size: 1rem;

  @media (max-width: 576px) {
    text-align: center;
  }
`;

export const SkillRequirements = styled(JobSubtitle)`
  font-size: 0.85rem;

  .skill-item {
    margin-bottom: 2px;
    padding: 2px 0;
    line-height: 1.3;
  }

  .skill-item:last-child {
    margin-bottom: 0;
  }

  /* Horizontal skills on mobile */
  @media (max-width: 576px) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .skill-item {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 4px 8px;
      margin-bottom: 0;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .skill-more {
      background-color: #e5e7eb;
      color: #6b7280;
      font-style: italic;
    }
  }
`;

export const CompanyBrand = styled.span`
  font-weight: bold;
  font-size: 1.1rem;
  color: #374151;
`;

export const WorkTypeBadge = styled(Badge)`
  color: #374151;
`;

export const FooterText = styled.small`
  color: #374151;
`;

export const ActionButton = styled(Button)`
  border: none;
  color: #374151;

  &:hover {
    color: #1f2937;
  }
`;
