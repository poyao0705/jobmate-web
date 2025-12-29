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
          console.log('📥 [getContactInfo] Raw response:', response);
          
          // Backend returns contact_name, contact_email, etc. - need to transform
          const data = response as any;
          const transformed = {
            name: data.contact_name || data.name || '',
            email: data.contact_email || data.email || '',
            phone_number: data.contact_phone_number || data.phone_number || '',
            location: data.contact_location || data.location || ''
          };
          
          console.log('🔄 [getContactInfo] Transformed:', transformed);
          const validated = UserContactInfoSchema.parse(transformed);
          console.log('✅ [getContactInfo] Validated successfully');
          return validated;
        } catch (error) {
          console.error('❌ [getContactInfo] Validation failed:', error);
          console.error('❌ [getContactInfo] Response was:', response);
          if (error instanceof ZodError) {
            console.error('❌ [getContactInfo] Zod errors:', error.errors);
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: [{ type: 'Profile', id: 'CONTACT_INFO' }],
    }),

    // Update user contact information
    updateContactInfo: builder.mutation<UserContactInfo, UserContactInfo>({
      query: (contactInfo) => {
        console.log('📤 [updateContactInfo] Sending:', contactInfo);
        // Transform to backend format
        const backendFormat = {
          contact_name: contactInfo.name,
          contact_email: contactInfo.email,
          contact_phone_number: contactInfo.phone_number,
          contact_location: contactInfo.location
        };
        console.log('🔄 [updateContactInfo] Transformed for backend:', backendFormat);
        return {
          url: 'contact-info',
          method: 'PUT',
          body: backendFormat,
        };
      },
      transformResponse: (response: unknown) => {
        try {
          console.log('📥 [updateContactInfo] Raw response:', response);
          
          // Backend returns contact_name, contact_email, etc. - need to transform back
          const data = response as any;
          const transformed = {
            name: data.contact_name || data.name || '',
            email: data.contact_email || data.email || '',
            phone_number: data.contact_phone_number || data.phone_number || '',
            location: data.contact_location || data.location || ''
          };
          
          console.log('🔄 [updateContactInfo] Transformed:', transformed);
          const validated = UserContactInfoSchema.parse(transformed);
          console.log('✅ [updateContactInfo] Updated successfully');
          return validated;
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
