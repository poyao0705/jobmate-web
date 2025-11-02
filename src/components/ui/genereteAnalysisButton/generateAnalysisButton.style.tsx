import styled, { css } from "styled-components";
import Button from "react-bootstrap/Button";

export const GenerateAnalysisButton = styled(Button)<{
  $buttonType?: "default" | "chat" | "save";
  $styleOverrides?: React.CSSProperties;
}>`
  /* --- Normalize ALL variants --- */
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  white-space: nowrap;

  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1; /* prevents extra button height from text baseline */
  padding: 10px 20px;
  min-height: 36px; /* ✅ guarantee same height */
  border: 1px solid transparent; /* ✅ same border thickness for all */
  transition: all 0.2s ease-in-out;
  text-transform: none;

  /* ✅ SVG/Icon alignment fix */
  svg,
  img {
    display: block;
    vertical-align: middle;
    flex-shrink: 0;
  }

  ${(props) => {
    const overrides = props.$styleOverrides || {};
    switch (props.$buttonType) {
      case "chat":
        return css`
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          &:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
            color: white;
          }
          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          }
          &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
            color: white;
          }
        `;
      case "save":
        return css`
          background: ${overrides.background ||
          "linear-gradient(135deg, #007bff 0%, #0056b3 100%)"};
          color: ${overrides.color || "white"};
          border-color: #007bff;
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); /* ✅ match theme shadow */
        `;
      default:
        return css`
          background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(233, 30, 99, 0.2); /* ✅ match theme shadow */
          &:hover {
            background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(233, 30, 99, 0.3);
            color: white;
          }
          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(233, 30, 99, 0.2);
          }
          &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.3);
            color: white;
          }
        `;
    }
  }}
`;
