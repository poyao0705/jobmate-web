"use client";

import React from "react";
import JobHolder from "@/components/ui/jobHolder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaginationControls from "./pagination-controls";
import type { Job } from "@/types/api";
import { AlertCircle, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetJobsQuery } from "@/store";

export default function JobList() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const limit = 6;

  // Fetch jobs using RTK Query (handles auth automatically via API route)
  const {
    data: jobsResponse,
    error,
    isLoading,
    isError,
  } = useGetJobsQuery({ page: currentPage, limit });

  const jobs = jobsResponse?.jobs || [];
  const pagination = jobsResponse?.pagination;

  // Loading state
  if (isLoading) {
    return <JobListSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load jobs</AlertTitle>
          <AlertDescription>
            {error && "status" in error
              ? `Error ${error.status}: ${error.data || "Failed to fetch job listings"}`
              : "An unexpected error occurred while loading job listings. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Alert>
          <Briefcase className="h-4 w-4" />
          <AlertTitle>No jobs found</AlertTitle>
          <AlertDescription>
            There are no job listings available at the moment. Please check back
            later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Jobs count info */}
        <div className="mb-3 flex justify-between items-center flex-wrap">
          <p className="text-muted-foreground mb-0">
            Showing {jobs.length} of {pagination?.total_count || jobs.length}{" "}
            job{jobs.length !== 1 ? "s" : ""}
            {pagination &&
              ` (Page ${pagination.current_page} of ${pagination.total_pages})`}
          </p>
        </div>

        {/* Top Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mb-4">
            <PaginationControls
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              hasNext={pagination.has_next}
              hasPrev={pagination.has_prev}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Jobs grid */}
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job: Job) => (
            <div key={job.id}>
              <JobHolder job={job} />
            </div>
          ))}
        </div>

        {/* Bottom Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4">
            <PaginationControls
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              hasNext={pagination.has_next}
              hasPrev={pagination.has_prev}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* No pagination message when all jobs fit on one page */}
        {(!pagination || pagination.total_pages <= 1) && jobs.length > 0 && (
          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              All jobs are displayed on this page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading component
export function JobListSkeleton() {
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-4">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
