import { createApi } from '@reduxjs/toolkit/query/react';
import type { GapAnalysis, GapGetByJobResponse } from '@/schemas/api';
import { GapGetByJobResponseSchema } from '@/schemas/api';
import { createBackendBaseQuery } from './baseQuery';

interface GapRunResponse {
	gap_report_id: number | null;
	analysis?: GapAnalysis | null;
}


export const gapApi = createApi({
	reducerPath: 'gapApi',
	tagTypes: ['GapByJob'],
	baseQuery: createBackendBaseQuery({
		baseUrl: '/api/',
		prepareHeaders: (headers) => {
			if (!headers.has('Content-Type')) {
				headers.set('Content-Type', 'application/json');
			}
			return headers;
		},
	}),
	endpoints: (builder) => ({
		runGap: builder.mutation<GapRunResponse, { job_id: number }>({
			query: (body) => ({ url: 'backend/gap/run', method: 'POST', body }),
			invalidatesTags: (result, error, arg) => [
				{ type: 'GapByJob', id: arg.job_id },
			],
		}),
		getGapByJob: builder.query<GapGetByJobResponse, number>({
			query: (jobId) => `gap/by-job/${jobId}`,
			transformResponse: (response: unknown): GapGetByJobResponse => {
				return GapGetByJobResponseSchema.parse(response);
			},
		providesTags: (result, error, jobId) => [
			{ type: 'GapByJob', id: jobId },
		],
		keepUnusedDataFor: 3600, // 1 hour - cache gap data for ready jobs
	}),
		deleteGapByJob: builder.mutation<{ deleted: number }, number>({
			query: (jobId) => ({ url: `backend/gap/by-job/${jobId}`, method: 'DELETE' }),
			invalidatesTags: (result, error, jobId) => [
				{ type: 'GapByJob', id: jobId },
			],
		}),
	}),
});

export const {
	useRunGapMutation,
	useGetGapByJobQuery,
	useLazyGetGapByJobQuery,
	useDeleteGapByJobMutation,
} = gapApi;
