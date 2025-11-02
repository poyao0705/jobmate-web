"use client";

/**
 * Redux Provider component for client-side store access
 * Wraps the app with Redux store context
 */

import { Provider } from "react-redux";
import { store } from "./store";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
