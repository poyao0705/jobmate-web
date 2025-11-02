'use client';

import React, { useRef, useState } from 'react';
import type { ResumeUploadResponse } from '@/types/api';
import { useUploadResumeMutation } from '@/store';
import { CancelButton } from '@/components/ui/buttons';

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  data?: ResumeUploadResponse;
  error?: string;
}

interface ResumeUploadAreaProps {
  onUploadSuccess?: (data: ResumeUploadResponse) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export default function ResumeUploadArea({ 
  onUploadSuccess, 
  onUploadError, 
  className = "" 
}: ResumeUploadAreaProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [uploadResume, { isLoading: isUploading }] = useUploadResumeMutation();

  const handleFileUpload = async (file: File) => {
    setUploadState({ status: 'uploading' });

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume_file', file);

      // Removed verbose frontend logging and debug file reads

      // Upload using RTK mutation
      const uploadResponse = await uploadResume(formData).unwrap();

      // Check if upload was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Request was aborted');
      }

      // Create success response with real resume ID
      const uploadResult: ResumeUploadResponse = {
        resume_id: uploadResponse.resume_id,
        summary: {
          bullet_points: [
            `Successfully uploaded ${file.name}`,
            `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
          ],
          detected_skills: [] // Will be populated after processing
        }
      };

      setUploadState({
        status: 'success',
        data: uploadResult,
      });

      onUploadSuccess?.(uploadResult);
    } catch (error) {
      let errorMessage = 'Upload failed';

      if (error && typeof error === 'object' && 'message' in error) {
        if ((error as Error).message === 'Request was aborted') {
          errorMessage = 'Upload was cancelled';
        } else {
          errorMessage = (error as Error).message as string;
        }
      }

      setUploadState({
        status: 'error',
        error: errorMessage,
      });

      onUploadError?.(errorMessage);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploadState.status === 'uploading' || isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadState.status === 'idle' && (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop your resume here or click to browse
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  DOCX files up to 10MB
                </span>
              </label>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}

        {(uploadState.status === 'uploading' || isUploading) && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">Uploading...</p>
              <p className="text-xs text-gray-500 mt-1">Analyzing your resume</p>
              <button
                onClick={handleCancel}
                className="mt-3 text-sm text-red-600 hover:text-red-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {uploadState.status === 'success' && uploadState.data && (
          <div>
            <div className="rounded-full h-12 w-12 bg-green-100 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-brand-primary">Upload Successful!</p>

              <div className="mt-4 text-left bg-surface p-3 rounded-md">
                <h4 className="text-sm font-medium text-brand-primary mb-2">Summary</h4>
                <ul className="text-xs text-brand-secondary space-y-1">
                  {uploadState.data.summary.bullet_points.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {uploadState.data.summary.detected_skills && uploadState.data.summary.detected_skills.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-brand-primary mb-1">Detected Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {uploadState.data.summary.detected_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-accent text-brand-primary rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetUpload}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Upload Another Resume
              </button>
            </div>
          </div>
        )}

        {uploadState.status === 'error' && (
          <div>
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-red-900">Upload Failed</p>
              <p className="text-xs text-red-700 mt-1">{uploadState.error}</p>
              <CancelButton
                onClick={resetUpload}
                className="mt-3 text-sm"
              >
                Try Again
              </CancelButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
