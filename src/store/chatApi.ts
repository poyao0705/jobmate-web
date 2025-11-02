/**
 * RTK Query API slice for chat management
 * Handles chat operations with automatic caching (excluding streaming)
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { 
  ChatsResponseSchema, 
  ChatMessagesResponseSchema, 
  CreateChatResponseSchema 
} from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';
import { createBackendBaseQuery } from './baseQuery';

interface ChatItem {
  id: number;
  title: string;
  timestamp?: string;
  model: string;
}

interface ChatMessage {
  role: string;
  content?: string;
}

interface ChatsResponse {
  chats: ChatItem[];
}

interface ChatMessagesResponse {
  messages: ChatMessage[];
}

interface CreateChatRequest {
  model: string;
}

interface CreateChatResponse {
  chat: ChatItem;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: createBackendBaseQuery({
    prepareHeaders: (headers) => {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: ['Chat', 'Message'],
  endpoints: (builder) => ({
    // Get all chats for the user
    getChats: builder.query<ChatsResponse, void>({
      query: () => 'chats',
      transformResponse: (response: unknown) => {
        try {
          return ChatsResponseSchema.parse(response);
        } catch (error) {
          console.error('Chats response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.chats.map(({ id }) => ({ type: 'Chat' as const, id })),
              { type: 'Chat', id: 'LIST' },
            ]
          : [{ type: 'Chat', id: 'LIST' }],
    }),

    // Get messages for a specific chat
    getChatMessages: builder.query<ChatMessagesResponse, number>({
      query: (chatId) => `chat/${chatId}/messages`,
      transformResponse: (response: unknown) => {
        try {
          return ChatMessagesResponseSchema.parse(response);
        } catch (error) {
          console.error('Chat messages response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result, error, chatId) => [
        { type: 'Message', id: chatId },
        { type: 'Chat', id: chatId },
      ],
    }),

    // Create a new chat
    createChat: builder.mutation<CreateChatResponse, CreateChatRequest>({
      query: (chatData) => ({
        url: 'chat/create',
        method: 'POST',
        body: chatData,
      }),
      transformResponse: (response: unknown) => {
        try {
          return CreateChatResponseSchema.parse(response);
        } catch (error) {
          console.error('Create chat response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),

    // Delete a chat
    deleteChat: builder.mutation<{ message: string }, number>({
      query: (chatId) => ({
        url: `chat/${chatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, chatId) => [
        { type: 'Chat', id: chatId },
        { type: 'Message', id: chatId },
        { type: 'Chat', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetChatsQuery,
  useGetChatMessagesQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
} = chatApi;

// Export the reducer and middleware for store configuration
export const { reducer: chatApiReducer, middleware: chatApiMiddleware } = chatApi;
