import React from "react";
import { GenerateAnalysisButton as StyledGenerateAnalysisButton } from "./generateAnalysisButton.style";

interface GenerateAnalysisButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "lg";
  className?: string;
  buttonType?: "default" | "chat" | "save";
  style?: React.CSSProperties;
}

const GenerateAnalysisButton: React.FC<GenerateAnalysisButtonProps> = ({
  children,
  onClick,
  disabled = false,
  size = "sm",
  className,
  buttonType = "default",
  style,
  ...props
}) => {
  return (
    <StyledGenerateAnalysisButton
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={className}
      $buttonType={buttonType}
      $styleOverrides={style}
      style={style}
      {...props}
    >
      {children}
    </StyledGenerateAnalysisButton>
  );
};

export default GenerateAnalysisButton;
