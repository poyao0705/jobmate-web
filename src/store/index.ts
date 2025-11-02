/**
 * Redux store exports
 * Central export point for all store-related modules
 */

export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export { ReduxProvider } from './provider';
export {
  jobsApi,
  useGetJobsQuery,
  useGetJobQuery,
  useSearchJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} from './jobsApi';

export {
  resumesApi,
  useGetResumesQuery,
  useUploadResumeMutation,
  useSetDefaultResumeMutation,
  useDeleteResumeMutation,
} from './resumesApi';

export {
  profileApi,
  useGetContactInfoQuery,
  useUpdateContactInfoMutation,
} from './profileApi';

export {
  chatApi,
  useGetChatsQuery,
  useGetChatMessagesQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
} from './chatApi';

export {
  jobCollectionsApi,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useCheckJobSavedStatusQuery,
} from './jobCollectionsApi';

export {
  gapApi,
  useRunGapMutation,
  useGetGapByJobQuery,
  useLazyGetGapByJobQuery,
  useDeleteGapByJobMutation,
} from './gapApi';

export {
  tasksApi,
  useGetTasksQuery,
  useLazyGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from './tasksApi';
