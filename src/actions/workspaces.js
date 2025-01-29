import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.workspaces;

export function useGetWorkspaces(authenticated) {
  const url = authenticated ? URL : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  const memoizedValue = useMemo(
    () => ({
      workspaces: data || [],
      workspacesLoading: isLoading,
      workspacesError: error,
      workspacesValidating: isValidating,
      workspacesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}
