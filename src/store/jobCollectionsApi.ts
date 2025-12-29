import { createApi } from '@reduxjs/toolkit/query/react';
import type { JobCollectionsResponse, Job, SaveJobResponse, JobSavedStatus } from '@/types/api';
import { JobCollectionsResponseSchema, SaveJobResponseSchema, JobSavedStatusSchema } from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';
import { jobsApi } from './jobsApi';

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
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        console.log('🔄 [getSavedJobs] Starting fetch with include_details=true...');
        
        try {
          // Fetch saved jobs WITH full details from backend
          const result = await fetchWithBQ('job-collections?include_details=true');
          
          if (result.error) {
            console.error('❌ [getSavedJobs] Backend error:', result.error);
            return { error: result.error };
          }
          
          const response = result.data;
          console.log('📥 [getSavedJobs] Raw backend response:', response);
          
          // Backend returns {collections: [{id, job_id, job_listing_id, added_at, job: {...full job}}]}
          if (response && typeof response === 'object' && response.collections && Array.isArray(response.collections)) {
            console.log('✅ [getSavedJobs] Backend returned collections with details');
            console.log('📋 [getSavedJobs] Total collections:', response.collections.length);
            
            // Extract full job objects from collections
            const jobs: Job[] = [];
            response.collections.forEach((collection: any) => {
              if (collection.job) {
                console.log(`✅ [getSavedJobs] Found full job: ${collection.job.id} - ${collection.job.title}`);
                jobs.push(collection.job);
              } else {
                console.warn(`⚠️ [getSavedJobs] Collection ${collection.id} missing job details`);
              }
            });
            
            console.log(`✅ [getSavedJobs] Extracted ${jobs.length}/${response.collections.length} jobs`);
            
            return {
              data: {
                jobs: jobs,
                total_count: response.collections.length
              }
            };
          }
          
          // Fallback: try to parse as standard format
          console.log('⚠️ [getSavedJobs] Unexpected response format, trying standard parse');
          const parsed = JobCollectionsResponseSchema.parse(response);
          console.log('✅ [getSavedJobs] Parsed successfully:', parsed);
          return { data: parsed };
          
        } catch (error) {
          console.error('❌ [getSavedJobs] Error occurred:', error);
          if (error instanceof ZodError) {
            console.error('❌ [getSavedJobs] Zod validation errors:', error.errors);
            return { 
              error: { 
                status: 'CUSTOM_ERROR', 
                error: getZodErrorMessage(error) 
              } 
            };
          }
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: String(error) 
            } 
          };
        }
      },
      providesTags: ['SavedJobs', { type: 'SavedJobs', id: 'LIST' }],
    }),
    
    // Save a job to collection
    saveJob: builder.mutation<SaveJobResponse, number>({
      query: (jobId) => {
        console.log(`💾 [saveJob] Saving job ID: ${jobId}`);
        return {
          url: `job-collections/${jobId}`,
          method: 'POST',
        };
      },
      async transformResponse(response: any): Promise<SaveJobResponse> {
        try {
          console.log('✅ [saveJob] Backend response:', response);
          
          // Backend returns {success, message, job_id, saved_at}
          // Transform to match our schema {message, saved, saved_at}
          const transformed = {
            message: response.message || 'Job saved',
            saved: response.success === true || response.saved === true,
            saved_at: response.saved_at
          };
          
          console.log('🔄 [saveJob] Transformed:', transformed);
          const parsed = SaveJobResponseSchema.parse(transformed);
          console.log('✅ [saveJob] Parsed successfully:', parsed);
          return parsed;
        } catch (error) {
          console.error('❌ [saveJob] Response validation failed:', error);
          console.error('❌ [saveJob] Response was:', response);
          if (error instanceof ZodError) {
            console.error('❌ [saveJob] Zod errors:', error.errors);
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result, error, jobId) => [
        'SavedJobs',
        { type: 'SavedJobs', id: 'LIST' },
        { type: 'SavedJobs', id: jobId },
      ],
    }),
    
    // Remove job from collection
    unsaveJob: builder.mutation<SaveJobResponse, number>({
      query: (jobId) => {
        console.log(`🗑️ [unsaveJob] Unsaving job ID: ${jobId}`);
        return {
          url: `job-collections/${jobId}`,
          method: 'DELETE',
        };
      },
      async transformResponse(response: any): Promise<SaveJobResponse> {
        try {
          console.log('✅ [unsaveJob] Backend response:', response);
          
          // Backend returns {success, message, job_id, saved_at}
          // Transform to match our schema {message, saved, saved_at}
          const transformed = {
            message: response.message || 'Job removed',
            saved: response.success === false || response.saved === false,
            saved_at: response.saved_at || null
          };
          
          console.log('🔄 [unsaveJob] Transformed:', transformed);
          const parsed = SaveJobResponseSchema.parse(transformed);
          console.log('✅ [unsaveJob] Parsed successfully:', parsed);
          return parsed;
        } catch (error) {
          console.error('❌ [unsaveJob] Response validation failed:', error);
          console.error('❌ [unsaveJob] Response was:', response);
          if (error instanceof ZodError) {
            console.error('❌ [unsaveJob] Zod errors:', error.errors);
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result, error, jobId) => [
        'SavedJobs',
        { type: 'SavedJobs', id: 'LIST' },
        { type: 'SavedJobs', id: jobId },
      ],
    }),
    
    // Check if job is saved
    checkJobSavedStatus: builder.query<JobSavedStatus, number>({
      query: (jobId) => `job-collections/${jobId}/status`,
      async transformResponse(response: any, meta, jobId): Promise<JobSavedStatus> {
        try {
          // If backend returns 404 or empty response, assume not saved
          if (!response || Object.keys(response).length === 0) {
            return { job_id: jobId, saved: false, saved_at: null };
          }
          return JobSavedStatusSchema.parse(response);
        } catch (error) {
          console.error('Job status response validation failed:', error);
          console.error('Response was:', response);
          // Return default "not saved" state instead of throwing
          return { job_id: jobId, saved: false, saved_at: null };
        }
      },
      // Handle 404 errors gracefully - treat as "not saved"
      transformErrorResponse: (response, meta, arg) => {
        if (response.status === 404) {
          return { job_id: arg, saved: false, saved_at: null };
        }
        return response;
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