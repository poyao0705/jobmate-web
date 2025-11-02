/**
 * Redux store configuration with RTK Query
 * Configures the main store with job listings API slice and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { jobsApi } from './jobsApi';
import { resumesApi } from './resumesApi';
import { profileApi } from './profileApi';
import { chatApi } from './chatApi';
import { jobCollectionsApi } from './jobCollectionsApi';
import { gapApi } from './gapApi';
import { tasksApi } from './tasksApi';

export const store = configureStore({
  reducer: {
    // Add the generated reducers as specific top-level slices
    [jobsApi.reducerPath]: jobsApi.reducer,
    [resumesApi.reducerPath]: resumesApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [jobCollectionsApi.reducerPath]: jobCollectionsApi.reducer,
    [gapApi.reducerPath]: gapApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    }).concat(
      jobsApi.middleware,
      resumesApi.middleware,
      profileApi.middleware,
      chatApi.middleware,
      jobCollectionsApi.middleware,
      gapApi.middleware,
      tasksApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
