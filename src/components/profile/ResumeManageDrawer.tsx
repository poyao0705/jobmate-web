'use client'

import React from 'react';
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { CancelButton } from '@/components/ui/buttons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ResumeUploadArea from '@/components/upload/ResumeUploadArea';
import { toast } from 'sonner';
import { MoreVertical, FileText, Star, Trash2, Download } from 'lucide-react';
import axios from 'axios';
import { 
  useGetResumesQuery,
  useSetDefaultResumeMutation,
  useDeleteResumeMutation 
} from '@/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface ResumeManageDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResumeUploaded?: () => void;
}

export default function ResumeManageDrawer({ 
  isOpen, 
  onOpenChange,
  onResumeUploaded
}: ResumeManageDrawerProps) {
  const { data: resumesData, isLoading, error } = useGetResumesQuery(undefined, {
    skip: !isOpen, // Only fetch when drawer is open
  });
  const [setDefaultResume, { isLoading: isSettingDefault }] = useSetDefaultResumeMutation();
  const [deleteResume, { isLoading: isDeleting }] = useDeleteResumeMutation();

  const resumes = React.useMemo(() => resumesData?.resumes ?? [], [resumesData]);

  const handleDownload = async (resumeId: number) => {
    try {
      // Fetch presigned URL on demand
      const { data } = await axios.get(`/api/backend/resume/${resumeId}/download-url`, {
        headers: { Accept: 'application/json' },
      });
      const url: string | undefined = data?.download_url;
      if (!url) throw new Error('No download URL returned');
      // Open in new tab (or could trigger programmatic download)
      window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
      toast.error('Failed to generate download URL');
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Resume uploaded successfully!');
    onResumeUploaded?.(); // Notify parent component to refresh data
  };

  const handleUploadError = (error: string) => {
    toast.error(`Upload failed: ${error}`);
  };

  const handleSetDefault = async (resumeId: number) => {
    try {
      await setDefaultResume(resumeId).unwrap();
      toast.success('Resume set as default');
      onResumeUploaded?.(); // Notify parent component
    } catch (error) {
      console.error('Failed to set default resume:', error);
      toast.error('Failed to set default resume');
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(null);

  const pendingDeleteResume = React.useMemo(() => {
    if (pendingDeleteId == null) {
      return undefined;
    }
    return resumes.find((resume) => resume.id === pendingDeleteId);
  }, [pendingDeleteId, resumes]);

  const handleDeleteResume = (resumeId: number) => {
    const resume = resumes.find((r) => r.id === resumeId);
    if (resume?.is_default) {
      toast.error('Cannot delete default resume. Set another resume as default first.');
      return;
    }
    setPendingDeleteId(resumeId);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId == null) {
      return;
    }
    try {
      await deleteResume(pendingDeleteId).unwrap();
      toast.success('Resume deleted successfully');
      onResumeUploaded?.();
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error('Failed to delete resume');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      setPendingDeleteId(null);
    }
  };

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && pendingDeleteId != null) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, pendingDeleteId]
  );

  const handleClose = () => {
    setPendingDeleteId(null);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange} direction="right">
        <DrawerContent className="h-screen flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="font-sans">Manage Resume</DrawerTitle>
          <DrawerDescription className="font-sans">
            Upload and manage your resumes to get personalized job recommendations.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Fixed Upload Section */}
          <div className="p-4 border-b bg-white flex-shrink-0">
            <h3 className="text-lg font-semibold mb-3">Upload New Resume</h3>
            <ResumeUploadArea 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Scrollable Resume List Section */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3">Your Resumes</h3>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading resumes...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-red-500">Failed to load resumes</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No resumes uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <Card key={resume.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {resume.original_filename}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {resume.is_default && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(resume.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 3-dots menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:!bg-cancel-button-hover-bg"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDownload(resume.id)}
                                className="cursor-pointer focus:!bg-cancel-button-hover-bg focus:!text-cancel-button-hover-text"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {!resume.is_default && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefault(resume.id)}
                                  className="cursor-pointer focus:!bg-cancel-button-hover-bg focus:!text-cancel-button-hover-text"
                                  disabled={isSettingDefault}
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  {isSettingDefault ? 'Setting...' : 'Set as Default'}
                                </DropdownMenuItem>
                              )}
                              {!resume.is_default && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteResume(resume.id)}
                                  className="cursor-pointer text-red-600 focus:!bg-cancel-button-hover-bg focus:!text-red-600"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isDeleting && pendingDeleteId === resume.id ? 'Removing...' : 'Remove File'}
                                </DropdownMenuItem>
                              )}
                              {resume.is_default && (
                                <DropdownMenuItem
                                  disabled
                                  className="cursor-not-allowed text-gray-400 focus:!bg-cancel-button-hover-bg focus:!text-gray-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cannot delete default resume
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-shrink-0 border-t">
          <DrawerClose asChild>
            <CancelButton onClick={handleClose}>
              Close
            </CancelButton>
          </DrawerClose>
        </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <AlertDialog open={pendingDeleteId != null} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteResume?.original_filename
                ? `This will permanently remove “${pendingDeleteResume.original_filename}”.`
                : 'This will permanently remove the selected resume.'}
              {' '} The assoicated skill gap report will be deleted as well. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-black">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              {isDeleting ? 'Removing…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
