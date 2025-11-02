"use client";

import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Pagination from "react-bootstrap/Pagination";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import JobHolder from "./jobHolder";
import { cn } from "@/lib/utils";
import { useGetJobsQuery } from "@/store";
import type { Job } from "@/types/api";
import GenerateAnalysisButton from "./genereteAnalysisButton";

// Job List Component with RTK Query integration

const JobList = () => {
  const [page, setPage] = useState(1);
  const limit = 6; // Display 6 jobs per page

  // Fetch ALL jobs from the API (without pagination parameters)
  const {
    data: jobsResponse,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useGetJobsQuery({ page: 1, limit: 100 }); // Get all jobs at once

  // Handle pagination locally
  const allJobs = jobsResponse?.jobs || [];
  const totalJobs = allJobs.length;
  const totalPages = Math.ceil(totalJobs / limit);

  // Calculate jobs for current page
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const jobs = allJobs.slice(startIndex, endIndex);

  // Create local pagination object
  const pagination =
    totalPages > 1
      ? {
          current_page: page,
          total_pages: totalPages,
          total_count: totalJobs,
          has_next: page < totalPages,
          has_prev: page > 1,
        }
      : null;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("p-4 text-center")}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading jobs...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading job listings...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn("p-4")}>
        <Alert variant="danger">
          <Alert.Heading>Unable to load jobs</Alert.Heading>
          <p>
            {error && "status" in error
              ? `Error ${error.status}: ${
                  error.data || "Failed to fetch job listings"
                }`
              : "An unexpected error occurred while loading job listings. Please try again later."}
          </p>
        </Alert>
      </div>
    );
  }

  // Success state with data - check if there are any jobs in total
  if (allJobs.length === 0) {
    return (
      <div className={cn("p-4")}>
        <Alert variant="info">
          <Alert.Heading>No jobs found</Alert.Heading>
          <p>
            There are no job listings available at the moment. Please check back
            later.
          </p>
        </Alert>
      </div>
    );
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;
    const { current_page, total_pages } = pagination;

    return (
      <div className="d-flex justify-content-center align-items-center mt-4 flex-wrap">
        <GenerateAnalysisButton
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={current_page === 1}
          style={{ marginRight: "16px" }}
        >
          &laquo;&laquo;
        </GenerateAnalysisButton>

        <GenerateAnalysisButton
          size="sm"
          onClick={() => handlePageChange(current_page - 1)}
          disabled={current_page <= 1}
          style={{ marginRight: "16px" }}
        >
          &laquo;
        </GenerateAnalysisButton>

        {/* Current page and neighbors */}
        {Array.from({ length: Math.min(3, total_pages) }, (_, i) => {
          const pageNum = Math.max(1, current_page - 1) + i;
          if (pageNum > total_pages) return null;
          return (
            <GenerateAnalysisButton
              key={pageNum}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
              buttonType={pageNum === current_page ? "chat" : "default"}
              style={{
                marginRight: "16px",
                ...(pageNum === current_page
                  ? { backgroundColor: "#28a745", color: "white" }
                  : { backgroundColor: "#6f42c1", color: "white" }),
              }}
            >
              {pageNum}
            </GenerateAnalysisButton>
          );
        })}

        {current_page < total_pages - 1 && (
          <GenerateAnalysisButton
            size="sm"
            onClick={() => handlePageChange(total_pages)}
            style={{ marginRight: "4px" }}
          >
            {total_pages}
          </GenerateAnalysisButton>
        )}

        <GenerateAnalysisButton
          size="sm"
          onClick={() => handlePageChange(current_page + 1)}
          disabled={current_page >= total_pages}
          style={{ marginRight: "16px" }}
        >
          &raquo;
        </GenerateAnalysisButton>

        <GenerateAnalysisButton
          size="sm"
          onClick={() => handlePageChange(total_pages)}
          disabled={current_page === total_pages}
        >
          &raquo;&raquo;
        </GenerateAnalysisButton>
      </div>
    );
  };

  return (
    <div className={cn("p-4")}>
      <Container>
        {/* Jobs count info */}
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap">
          <p className=" mb-0">
            Showing {jobs.length} of {pagination?.total_count || jobs.length}{" "}
            job{jobs.length !== 1 ? "s" : ""}
            {pagination &&
              ` (Page ${pagination.current_page} of ${pagination.total_pages})`}
          </p>
        </div>

        {/* Top Pagination (full pagination) */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mb-4">{renderPagination()}</div>
        )}

        {/* Jobs grid */}
        <Row xs={1} md={2} lg={3} className="g-4">
          {jobs.map((job: Job) => (
            <Col key={job.id}>
              <JobHolder job={job} />
            </Col>
          ))}
        </Row>

        {/* Bottom Pagination (full pagination) */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4">{renderPagination()}</div>
        )}

        {/* No pagination message when all jobs fit on one page */}
        {(!pagination || pagination.total_pages <= 1) && jobs.length > 0 && (
          <div className="text-center mt-4">
            <p className="text-muted">All jobs are displayed on this page</p>
          </div>
        )}
      </Container>
    </div>
  );
};
export default JobList;
