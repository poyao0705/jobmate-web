import styled, { createGlobalStyle } from "styled-components";
import { Modal, Badge } from "react-bootstrap";

// Global style to prevent body scroll when modal is open
export const GlobalModalStyle = createGlobalStyle`
  body.modal-open {
    overflow: hidden;
    padding-right: 0 !important;
  }
`;

export const StyledModal = styled(Modal)`
  /* Force backdrop to show */
  &.modal.show {
    display: block !important;
  }

  .modal-dialog {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    max-width: 500px;
    width: 100%;
    margin: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1055;
  }

  &.show .modal-dialog {
    transform: translateX(0);
  }

  .modal-content {
    height: 100vh;
    border-radius: 0;
    border: none;
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    background-color: white; /* Fix 1: White background */
  }

  .modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 24px 24px 16px 24px;
    flex-shrink: 0;
    background-color: white; /* Ensure header is white */
    position: relative;

    .modal-title {
      font-weight: 600;
      font-size: 1.25rem;
      color: #374151;
    }

    .btn-close {
      font-size: 1rem;
      padding: 8px;
      background: none;
      border: none;
      position: absolute;
      top: 16px;
      right: 16px;
      opacity: 0.6;

      &:hover {
        opacity: 1;
      }
    }
  }

  .modal-body {
    padding: 20px 24px;
    flex: 1;
    overflow-y: auto;
    background-color: white; /* Ensure body is white */
  }

  .modal-footer {
    border-top: 1px solid #f0f0f0;
    padding: 16px 24px 24px 24px;
    gap: 12px;
    flex-shrink: 0;
    background-color: white; /* Ensure footer is white */
  }

  /* Fix 3: Force backdrop to show */
  .modal-backdrop {
    background-color: rgba(0, 0, 0, 0.5) !important; /* Force darker overlay */
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 1050 !important;
    opacity: 1 !important; /* Force visibility */
    display: block !important;
  }

  &.show .modal-backdrop {
    opacity: 1 !important; /* Ensure it shows when modal is open */
  }

  /* Ensure modal stays in place */
  &.modal {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1055;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`;

export const CompanyHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  padding: 20px 0;
`;

export const CompanyLogo = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  background: #f8fafc;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 12px;
  }
`;

export const CompanyBrand = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  padding: 20px 0;
  border-radius: 12px;
  margin-bottom: 16px;
`;

export const BrandText = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  text-align: center;
  margin: 8px 0 0 0;
  letter-spacing: 0.5px;
`;

export const JobTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  text-align: center;
`;

export const CompanyName = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 4px;
  text-align: center;
`;

export const JobLocation = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0;
  text-align: center;
`;

export const JobDetails = styled.div`
  margin-bottom: 24px;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
`;

export const DetailIcon = styled.span`
  font-size: 1.1rem;
  color: #6b7280;
  width: 24px;
  display: flex;
  justify-content: center;
`;

export const DetailText = styled.span`
  font-size: 0.875rem;
  color: #374151;
  flex: 1;
`;

export const SalaryText = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  flex: 1;
`;

export const SkillsSection = styled.div`
  margin-bottom: 24px;
`;

export const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
`;

export const SkillBadge = styled(Badge)`
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 500;
  font-size: 0.75rem;
  padding: 8px 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
`;

export const AnalysisSection = styled.div`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
`;

export const BetaBadge = styled(Badge)`
  background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
`;

export const ManualBackdrop = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  visibility: ${(props) => (props.$show ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  cursor: pointer;
`;
