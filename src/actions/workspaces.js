import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.workspaces;
const ALL_URL = `${URL}/all`;

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

export function useGetAllWorkspaces(authenticated) {
  const url = authenticated ? ALL_URL : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  const memoizedValue = useMemo(
    () => ({
      allWorkspaces: data || [],
      allWorkspacesLoading: isLoading,
      allWorkspacesError: error,
    }),
    [data, error, isLoading]
  );
  return memoizedValue;
}

export async function updateMyWorkspace(workspaceId) {
  const res = await axiosInstance.put('/memberships/my-workspace', null, {
    params: { workspace_id: workspaceId },
  });
  return res.data;
}
