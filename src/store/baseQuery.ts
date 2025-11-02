import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryArgs } from '@reduxjs/toolkit/query';

type BackendBaseQueryOptions = FetchBaseQueryArgs & {
  /**
   * Skip the automatic 401 handling. Useful for endpoints that intentionally return 401.
   */
  skipUnauthorizedHandling?: boolean;
};

let redirectInProgress = false;

const defaultBaseUrl = '/api/backend/';

function buildLoginRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '/api/auth/login';
  }

  const { pathname, search } = window.location;
  const returnTo = pathname.startsWith('/api/auth/')
    ? '/'
    : `${pathname}${search}` || '/';

  const loginUrl = new URL('/api/auth/login', window.location.origin);
  loginUrl.searchParams.set('returnTo', returnTo);
  return loginUrl.toString();
}

function triggerReauthentication() {
  if (typeof window === 'undefined' || redirectInProgress) {
    return;
  }

  redirectInProgress = true;
  window.location.replace(buildLoginRedirectUrl());
}

export function createBackendBaseQuery(
  options: BackendBaseQueryOptions = {}
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const {
    skipUnauthorizedHandling = false,
    baseUrl = defaultBaseUrl,
    prepareHeaders,
    ...rest
  } = options;

  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, api) => {
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }

      const prepared = prepareHeaders?.(headers, api);
      return prepared ?? headers;
    },
    ...rest,
  });

  const baseQueryWithUnauthorizedHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
  > = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (!skipUnauthorizedHandling && result.error?.status === 401) {
      triggerReauthentication();
    }

    return result;
  };

  return baseQueryWithUnauthorizedHandling;
}

