/**
 * RTK Query API slice for user profile management
 * Handles contact information operations with automatic caching
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import type { UserContactInfo } from '@/types/api';
import { UserContactInfoSchema } from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: createBackendBaseQuery({
    prepareHeaders: (headers) => {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    // Get user contact information
    getContactInfo: builder.query<UserContactInfo, void>({
      query: () => 'contact-info',
      transformResponse: (response: unknown) => {
        try {
          return UserContactInfoSchema.parse(response);
        } catch (error) {
          console.error('Contact info response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: [{ type: 'Profile', id: 'CONTACT_INFO' }],
    }),

    // Update user contact information
    updateContactInfo: builder.mutation<UserContactInfo, UserContactInfo>({
      query: (contactInfo) => ({
        url: 'contact-info',
        method: 'PUT',
        body: contactInfo,
      }),
      transformResponse: (response: unknown) => {
        try {
          return UserContactInfoSchema.parse(response);
        } catch (error) {
          console.error('Update contact info response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: [{ type: 'Profile', id: 'CONTACT_INFO' }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetContactInfoQuery,
  useUpdateContactInfoMutation,
} = profileApi;

// Export the reducer and middleware for store configuration
export const { reducer: profileApiReducer, middleware: profileApiMiddleware } = profileApi;
