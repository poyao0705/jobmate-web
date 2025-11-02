import { createApi } from '@reduxjs/toolkit/query/react';
import type { JobCollectionsResponse, Job, SaveJobResponse, JobSavedStatus } from '@/types/api';
import { JobCollectionsResponseSchema, SaveJobResponseSchema, JobSavedStatusSchema } from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';

export const jobCollectionsApi = createApi({
  reducerPath: 'jobCollectionsApi',
  tagTypes: ['SavedJobs', 'Job'],
  baseQuery: createBackendBaseQuery({
    prepareHeaders: (headers) => {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Get all saved jobs
    getSavedJobs: builder.query<JobCollectionsResponse, void>({
      query: () => 'job-collections',
      async transformResponse(response: any): Promise<JobCollectionsResponse> {
        try {
          return JobCollectionsResponseSchema.parse(response);
        } catch (error) {
          console.error('Saved jobs response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: ['SavedJobs'],
    }),
    
    // Save a job to collection
    saveJob: builder.mutation<SaveJobResponse, number>({
      query: (jobId) => ({
        url: `job-collections/${jobId}`,
        method: 'POST',
      }),
      async transformResponse(response: any): Promise<SaveJobResponse> {
        try {
          return SaveJobResponseSchema.parse(response);
        } catch (error) {
          console.error('Save job response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result, error, jobId) => [
        'SavedJobs',
        { type: 'Job', id: 'LIST' },
        { type: 'Job', id: jobId },
      ],
    }),
    
    // Remove job from collection
    unsaveJob: builder.mutation<SaveJobResponse, number>({
      query: (jobId) => ({
        url: `job-collections/${jobId}`,
        method: 'DELETE',
      }),
      async transformResponse(response: any): Promise<SaveJobResponse> {
        try {
          return SaveJobResponseSchema.parse(response);
        } catch (error) {
          console.error('Unsave job response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result, error, jobId) => [
        'SavedJobs',
        { type: 'Job', id: 'LIST' },
        { type: 'Job', id: jobId },
      ],
    }),
    
    // Check if job is saved
    checkJobSavedStatus: builder.query<JobSavedStatus, number>({
      query: (jobId) => `job-collections/${jobId}/status`,
      async transformResponse(response: any): Promise<JobSavedStatus> {
        try {
          return JobSavedStatusSchema.parse(response);
        } catch (error) {
          console.error('Job status response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result, error, jobId) => [
        { type: 'SavedJobs', id: jobId },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useCheckJobSavedStatusQuery,
} = jobCollectionsApi;

// Export the reducer and middleware for store configuration
export const { 
  reducer: jobCollectionsApiReducer, 
  middleware: jobCollectionsApiMiddleware 
} = jobCollectionsApi;