"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetContactInfoQuery, useGetSavedJobsQuery } from "@/store";
import ProfileCard, {
  ProfileCardWrapper,
  ProfileCardHeaderWrapper,
  ProfileCardContentWrapper,
} from "@/components/profile/ProfileCard";
import ProfileEditDrawer from "@/components/profile/ProfileEditDrawer";
import ManageResumeCard from "@/components/profile/ManageResumeCard";
import ResumeManageDrawer from "@/components/profile/ResumeManageDrawer";
import JobHolder from "@/components/ui/jobHolder";
import SkillGapTab from "@/components/profile/SkillGapTab";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CancelButton } from "@/components/ui/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import type { Job } from "@/types/api";
import { BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function ProfileCardError({ error }: { error: string }) {
  return (
    <ProfileCardWrapper>
      <ProfileCardHeaderWrapper>
        <CardTitle className="text-red-600 text-3xl">
          Error Loading Profile
        </CardTitle>
      </ProfileCardHeaderWrapper>
      <ProfileCardContentWrapper>
        <p className="text-red-600 text-md">{error}</p>
        <CancelButton onClick={() => window.location.reload()}>
          Refresh
        </CancelButton>
      </ProfileCardContentWrapper>
    </ProfileCardWrapper>
  );
}

// Shared layout wrapper for consistent styling
function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

export default function ProfileClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const {
    data: contactInfo,
    isLoading: loading,
    error,
  } = useGetContactInfoQuery();
  const {
    data: savedJobsResponse,
    error: savedJobsError,
    isLoading: savedJobsLoading,
    isSuccess: savedJobsSuccess,
    isError: savedJobsIsError,
  } = useGetSavedJobsQuery();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isResumeDrawerOpen, setIsResumeDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam === "collection") {
      setActiveTab("collection");
    } else if (tabParam === "gap") {
      setActiveTab("gap");
    } else {
      setActiveTab("profile");
    }
  }, [tabParam]);

  const handleEditProfile = () => {
    setIsDrawerOpen(true);
  };

  const handleSaveProfile = () => {
    // RTK cache will handle the update automatically
  };

  const handleManageResume = () => {
    setIsResumeDrawerOpen(true);
  };

  const handleResumeUploaded = () => {
    // RTK cache invalidation will handle the refresh automatically
  };

  // Render saved jobs collection content
  const renderCollectionContent = () => {
    if (savedJobsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-gray-600">Loading your saved jobs...</p>
        </div>
      );
    }

    if (savedJobsIsError) {
      const errorPayload =
        savedJobsError &&
        "data" in savedJobsError &&
        savedJobsError.data &&
        typeof savedJobsError.data === "object"
          ? (savedJobsError.data as { error?: string })
          : null;
      return (
        <Alert className="mt-4">
          <AlertDescription>
            {errorPayload?.error ?? "Failed to load your saved jobs. Please try again later."}
          </AlertDescription>
        </Alert>
      );
    }

    const savedJobs = savedJobsResponse?.jobs || [];

    if (savedJobsSuccess && savedJobs.length === 0) {
      return (
        <Empty className="border-0 bg-transparent py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-neutral-100">
              <BookmarkIcon className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No collections yet</EmptyTitle>
            <EmptyDescription>
              Your saved job collections will appear here once you start saving roles.
              <br />
              Tap the save&nbsp;
              <span className="inline-flex items-center text-muted-foreground">
                (<BookmarkIcon className="h-4 w-4" />)
              </span>
              &nbsp;button on a job listing to keep track of it here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Browse Jobs</Link>
            </Button>
          </EmptyContent>
        </Empty>
      );
    }

    return (
      <div className="space-y-4">
        {/* Jobs count info */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {savedJobs.length} saved job
            {savedJobs.length !== 1 ? "s" : ""}
          </p>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {savedJobs.length} {savedJobs.length === 1 ? "job" : "jobs"}
          </span>
        </div>

        {/* Jobs grid */}
        <Row xs={1} md={2} lg={2} className="g-4">
          {savedJobs.map((job: Job) => (
            <Col key={job.id}>
              <JobHolder job={job} />
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // Render profile content based on state
  let profileContent;

  if (error) {
    const errorMessage =
      "status" in error
        ? `Error ${error.status}: ${error.data || "Failed to load profile"}`
        : "Failed to load profile";
    profileContent = <ProfileCardError error={errorMessage} />;
  } else if (!contactInfo && !loading) {
    profileContent = (
      <div className="p-6 text-center text-gray-600">No profile data found</div>
    );
  } else {
    profileContent = (
      <ProfileCard
        contactInfo={
          contactInfo || { name: "", email: "", phone_number: "", location: "" }
        }
        onEditProfile={handleEditProfile}
        loading={loading}
      />
    );
  }

  return (
    <>
      <ProfileLayout>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-6xl"
        >
          <TabsList className="bg-white">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="gap">Skill Gap</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-2">
            <Card>
              <CardHeader>
                {/* <CardTitle className="text-2xl sm:text-3xl text-brand-primary font-bold font-sans text-left">Profile & Resume Management</CardTitle> */}
                <CardTitle>Profile & Resume Management</CardTitle>
                <CardDescription>
                  Manage your personal information and resume files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 items-stretch pb-4">
                  <div className="flex flex-col min-h-[40vh]">
                    <div className="flex-1">{profileContent}</div>
                  </div>
                  <div className="flex flex-col min-h-[40vh]">
                    <div className="flex-1">
                      <ManageResumeCard onManageResume={handleManageResume} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Collection</CardTitle>
                <CardDescription>
                  Your saved job collections and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>{renderCollectionContent()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gap" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Reports</CardTitle>
                <CardDescription>
                  Auto-generated reports for your saved jobs using your default resume.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillGapTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ProfileLayout>

      {contactInfo && (
        <ProfileEditDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          contactInfo={contactInfo}
          onSave={handleSaveProfile}
        />
      )}

      <ResumeManageDrawer
        isOpen={isResumeDrawerOpen}
        onOpenChange={setIsResumeDrawerOpen}
        onResumeUploaded={handleResumeUploaded}
      />
    </>
  );
}
