import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.workspaces;

export function useGetWorkspaces() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      workspaces: data || [],
      workspacesLoading: isLoading,
      workspacesError: error,
      workspacesValidating: isValidating,
      workspacesEmpty: !isLoading && !data.length,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}
