/**
 * RTK Query API slice for job listings
 * Handles all job-related server data with automatic caching and synchronization
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { 
  Job, 
  JobsResponse, 
  JobFilters, 
  JobSearchResponse 
} from '@/types/api';
import { 
  JobsResponseSchema, 
  JobSchema as JobSchemaZod, 
  JobSearchResponseSchema 
} from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';

export const jobsApi = createApi({
  reducerPath: 'jobsApi',
  baseQuery: createBackendBaseQuery({
    prepareHeaders: (headers) => {
      console.log('🔧 RTK Query: Preparing headers for request');
      console.log('📋 RTK Query: Headers prepared:', Object.fromEntries(headers.entries()));
      return headers;
    },
    fetchFn: async (input, init) => {
      console.log('🚀 RTK Query: Making fetch request');
      console.log('📍 URL:', input);
      console.log('⚙️ Options:', init);
      
      try {
        const response = await fetch(input, init);
        console.log('📨 RTK Query: Response received');
        console.log('📊 Status:', response.status, response.statusText);
        console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        // Clone response to read body for logging without consuming the stream
        const clonedResponse = response.clone();
        const responseText = await clonedResponse.text();
        console.log('📄 Response Body (first 500 chars):', responseText.substring(0, 500));
        
        return response;
      } catch (error) {
        console.error('❌ RTK Query: Fetch error:', error);
        throw error;
      }
    },
  }),
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    // Get paginated job listings with filters
    getJobs: builder.query<JobsResponse, JobFilters | void>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        
        if (filters && 'page' in filters && filters.page) params.append('page', filters.page.toString());
        if (filters && 'limit' in filters && filters.limit) params.append('limit', filters.limit.toString());
        if (filters && 'job_type' in filters && filters.job_type) params.append('job_type', filters.job_type);
        if (filters && 'location' in filters && filters.location) params.append('location', filters.location);
        if (filters && 'company' in filters && filters.company) params.append('company', filters.company);

        const queryString = params.toString();
        return `jobs${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: unknown) => {
        try {
          return JobsResponseSchema.parse(response);
        } catch (error) {
          console.error('Jobs response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.jobs.map(({ id }) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),

    // Get specific job by ID
    getJob: builder.query<Job, string | number>({
      query: (id) => `jobs/${id}`,
      transformResponse: (response: unknown) => {
        try {
          return JobSchemaZod.parse(response);
        } catch (error) {
          console.error('Job response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),

    // Search jobs by keywords
    searchJobs: builder.query<JobSearchResponse, { query: string; page?: number; limit?: number }>({
      query: ({ query, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
          limit: limit.toString(),
        });
        return `jobs/search?${params}`;
      },
      transformResponse: (response: unknown) => {
        try {
          return JobSearchResponseSchema.parse(response);
        } catch (error) {
          console.error('Job search response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: [{ type: 'Job', id: 'SEARCH' }],
    }),

    // Create new job listing
    createJob: builder.mutation<Job, Partial<Job>>({
      query: (jobData) => ({
        url: 'jobs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jobData,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    // Update existing job
    updateJob: builder.mutation<Job, { id: string | number; job: Partial<Job> }>({
      query: ({ id, job }) => ({
        url: `jobs/${id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: job,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
      ],
    }),

    // Delete job (soft delete)
    deleteJob: builder.mutation<{ message: string }, string | number>({
      query: (id) => ({
        url: `jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetJobsQuery,
  useGetJobQuery,
  useSearchJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = jobsApi;

// Export the reducer and middleware for store configuration
export const { reducer: jobsApiReducer, middleware: jobsApiMiddleware } = jobsApi;