"use client";

import GenerateAnalysisButton from "@/components/ui/genereteAnalysisButton";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
}: PaginationControlsProps) {
  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = [];
    const showPages = 3; // Show 3 page numbers at a time

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    // Adjust if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const showLastPage =
    !pageNumbers.includes(totalPages) && currentPage < totalPages - 1;

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {/* First page */}
      <GenerateAnalysisButton
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        &laquo;&laquo;
      </GenerateAnalysisButton>

      {/* Previous page */}
      <GenerateAnalysisButton
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        &laquo;
      </GenerateAnalysisButton>

      {/* Page numbers */}
      {pageNumbers.map((pageNum) => (
        <GenerateAnalysisButton
          key={pageNum}
          size="sm"
          onClick={() => handlePageChange(pageNum)}
          buttonType={pageNum === currentPage ? "chat" : "default"}
          style={{
            ...(pageNum === currentPage
              ? { backgroundColor: "#28a745", color: "white" }
              : { backgroundColor: "#6f42c1", color: "white" }),
          }}
        >
          {pageNum}
        </GenerateAnalysisButton>
      ))}

      {/* Last page number if not in range */}
      {showLastPage && (
        <GenerateAnalysisButton
          size="sm"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </GenerateAnalysisButton>
      )}

      {/* Next page */}
      <GenerateAnalysisButton
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        &raquo;
      </GenerateAnalysisButton>

      {/* Last page */}
      <GenerateAnalysisButton
        size="sm"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        &raquo;&raquo;
      </GenerateAnalysisButton>
    </div>
  );
}
