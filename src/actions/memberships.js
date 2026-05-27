import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.memberships;

export function useGetUserMemberships(userId) {
  const key = userId ? `${URL}/${userId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(key, fetcher);

  return useMemo(
    () => ({
      memberships: data || [],
      membershipsLoading: isLoading,
      membershipsError: error,
      membershipsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

function invalidate(userId) {
  mutate(`${URL}/${userId}`);
  mutate((key) => typeof key === 'string' && key.startsWith(endpoints.users));
}

export async function updateMembershipRole(userId, workspaceId, role) {
  const res = await axiosInstance.patch(
    `${URL}/${userId}`,
    { role },
    { params: { workspace_id: workspaceId } }
  );
  invalidate(userId);
  return res.data;
}

export async function createMembership(userId, workspaceId, role = 'user') {
  const res = await axiosInstance.post(`${URL}/${userId}`, null, {
    params: { workspace_id: workspaceId, role },
  });
  invalidate(userId);
  return res.data;
}

export async function deleteMembership(userId, workspaceId) {
  const res = await axiosInstance.delete(`${URL}/${userId}`, {
    params: { workspace_id: workspaceId },
  });
  invalidate(userId);
  return res.data;
}
