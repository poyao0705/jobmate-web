/**
 * RTK Query API slice for resume management
 * Handles resume upload, management, and operations with automatic caching
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { ResumeUploadBackendResponse, ResumesResponse } from '@/types/api';
import { ResumesResponseSchema, ResumeUploadBackendResponseSchema, ResumeDownloadUrlResponseSchema, ResumeDownloadUrlResponse } from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';

export const resumesApi = createApi({
  reducerPath: 'resumesApi',
  baseQuery: createBackendBaseQuery(),
  tagTypes: ['Resume'],
  endpoints: (builder) => ({
    // Get all resumes for the user
    getResumes: builder.query<ResumesResponse, void>({
      query: () => 'resumes',
      transformResponse: (response: unknown) => {
        try {
          return ResumesResponseSchema.parse(response);
        } catch (error) {
          console.error('Resumes response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.resumes.map(({ id }) => ({ type: 'Resume' as const, id })),
              { type: 'Resume', id: 'LIST' },
            ]
          : [{ type: 'Resume', id: 'LIST' }],
    }),

    // Upload a new resume
    uploadResume: builder.mutation<ResumeUploadBackendResponse, FormData>({
      query: (formData) => ({
        url: 'resume/upload',
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary for FormData
      }),
      transformResponse: (response: unknown) => {
        try {
          return ResumeUploadBackendResponseSchema.parse(response);
        } catch (error) {
          console.error('Resume upload response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: [{ type: 'Resume', id: 'LIST' }],
    }),

    // Set a resume as default
    setDefaultResume: builder.mutation<{ message: string }, number>({
      query: (resumeId) => ({
        url: `resumes/${resumeId}/set-default`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Resume', id: 'LIST' }],
    }),

    // Delete a resume
    deleteResume: builder.mutation<{ message: string }, number>({
      query: (resumeId) => ({
        url: `resumes/${resumeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, resumeId) => [
        { type: 'Resume', id: resumeId },
        { type: 'Resume', id: 'LIST' },
      ],
    }),

    // Get presigned download URL for a resume
    getResumeDownloadUrl: builder.query<ResumeDownloadUrlResponse, number>({
      query: (resumeId) => `resume/${resumeId}/download-url`,
      transformResponse: (response: unknown) => {
        try {
          return ResumeDownloadUrlResponseSchema.parse(response);
        } catch (error) {
          console.error('Resume download-url response validation failed:', error);
          throw error;
        }
      },
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetResumesQuery,
  useUploadResumeMutation,
  useSetDefaultResumeMutation,
  useDeleteResumeMutation,
  useGetResumeDownloadUrlQuery,
} = resumesApi;

// Export the reducer and middleware for store configuration
export const { reducer: resumesApiReducer, middleware: resumesApiMiddleware } = resumesApi;
