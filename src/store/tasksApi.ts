/**
 * RTK Query API slice for task scheduling
 * 负责任务的查询、创建、更新和删除，并带有 Zod 运行时校验
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  TasksResponse,
  TaskResponse,
  TaskDeleteResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilters,
} from '@/types/api';
import {
  TasksResponseSchema,
  TaskResponseSchema,
  TaskDeleteResponseSchema,
  TaskFiltersSchema,
} from '@/schemas/api';
import { getZodErrorMessage } from '@/lib/zodErrors';
import { ZodError } from 'zod';

interface UpdateTaskPayload {
  taskId: number;
  data: TaskUpdateRequest;
}

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/backend/',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Task', 'Goal'],
  endpoints: (builder) => ({
    getTasks: builder.query<TasksResponse, TaskFilters | void>({
      query: (params) => {
        const filters = params ? TaskFiltersSchema.parse(params) : undefined;
        const search = new URLSearchParams();
        if (filters?.goalId !== undefined) {
          search.set('goal_id', String(filters.goalId));
        }
        if (filters?.date) {
          search.set('date', filters.date);
        }
        const queryString = search.toString();
        return queryString ? `tasks?${queryString}` : 'tasks';
      },
      transformResponse: (response: unknown) => {
        try {
          return TasksResponseSchema.parse(response);
        } catch (error) {
          console.error('Tasks response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      providesTags: (result) => {
        const baseTags = [
          { type: 'Task' as const, id: 'LIST' },
          { type: 'Goal' as const, id: 'LIST' },
        ];
        if (!result) {
          return baseTags;
        }
        const taskTags = result.tasks.map(({ id }) => ({
          type: 'Task' as const,
          id,
        }));
        const goalTags = result.goals.map(({ id }) => ({
          type: 'Goal' as const,
          id,
        }));
        return [...taskTags, ...goalTags, ...baseTags];
      },
    }),

    createTask: builder.mutation<TaskResponse, TaskCreateRequest>({
      query: (taskData) => ({
        url: 'tasks',
        method: 'POST',
        body: taskData,
      }),
      transformResponse: (response: unknown) => {
        try {
          return TaskResponseSchema.parse(response);
        } catch (error) {
          console.error('Create task response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result) => [
        { type: 'Task', id: result?.task.id ?? 'LIST' },
        { type: 'Goal', id: 'LIST' },
      ],
    }),

    updateTask: builder.mutation<TaskResponse, UpdateTaskPayload>({
      query: ({ taskId, data }) => ({
        url: `tasks/${taskId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: unknown) => {
        try {
          return TaskResponseSchema.parse(response);
        } catch (error) {
          console.error('Update task response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result) => [
        { type: 'Task', id: result?.task.id ?? 'LIST' },
        { type: 'Task', id: 'LIST' },
        { type: 'Goal', id: 'LIST' },
      ],
    }),

    updateTaskStatus: builder.mutation<
      TaskResponse,
      { taskId: number; done: boolean }
    >({
      query: ({ taskId, done }) => ({
        url: `tasks/${taskId}`,
        method: 'PATCH',
        body: { done },
      }),
      transformResponse: (response: unknown) => {
        try {
          return TaskResponseSchema.parse(response);
        } catch (error) {
          console.error('Update task status response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result) => [
        { type: 'Task', id: result?.task.id ?? 'LIST' },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    deleteTask: builder.mutation<TaskDeleteResponse, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: unknown) => {
        try {
          return TaskDeleteResponseSchema.parse(response);
        } catch (error) {
          console.error('Delete task response validation failed:', error);
          if (error instanceof ZodError) {
            throw new Error(getZodErrorMessage(error));
          }
          throw error;
        }
      },
      invalidatesTags: (result, error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useLazyGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = tasksApi;

export const { reducer: tasksApiReducer, middleware: tasksApiMiddleware } = tasksApi;
