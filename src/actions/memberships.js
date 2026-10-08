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
  mutate((key) => typeof key === 'string' && key.startsWith(endpoints.workspaces));
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

const BULK_CHUNK = 200; // API limit per request

/**
 * Add / move / remove many users to a workspace (category) in one go.
 * Chunks to the API limit, merges the per-user results, and revalidates the
 * users / workspaces / memberships SWR keys ONCE at the end.
 */
export async function bulkUpdateMemberships({
  userIds,
  workspaceId,
  role = 'user',
  mode = 'add',
  fromWorkspaceId,
}) {
  const merged = { results: [], created: 0, skipped: 0, moved: 0, removed: 0, failed: 0 };

  for (let i = 0; i < userIds.length; i += BULK_CHUNK) {
    // eslint-disable-next-line no-await-in-loop
    const res = await axiosInstance.post(`${URL}/bulk`, {
      userIds: userIds.slice(i, i + BULK_CHUNK),
      workspaceId,
      role,
      mode,
      ...(fromWorkspaceId ? { fromWorkspaceId } : {}),
    });
    const data = res.data || {};
    merged.results.push(...(data.results || []));
    ['created', 'skipped', 'moved', 'removed', 'failed'].forEach((k) => {
      merged[k] += data[k] || 0;
    });
  }

  mutate(
    (key) =>
      typeof key === 'string' &&
      [endpoints.users, endpoints.workspaces, URL].some((prefix) => key.startsWith(prefix))
  );
  return merged;
}
