import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

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


// Creates a category in the active club account. The API returns the new workspace in the
// same shape as GET /workspaces (role: 'admin'); both list keys are revalidated so it shows
// up in the selector and the memberships dialog without a reload.
export async function createWorkspace({ name, logo }) {
  const res = await axiosInstance.post(URL, { name, ...(logo ? { logo } : {}) });
  await mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}
