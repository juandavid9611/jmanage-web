import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.users;

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

export function useGetUsers(selectedWorkspace, includeDisabled = false) {
  const workspaceId = selectedWorkspace?.id;
  const { data, isLoading, error, isValidating } = useSWR(
    `${URL}?workspace_id=${workspaceId}&include_disabled=${includeDisabled}`,
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      users: data?.users || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !data?.users.length,
    }),
    [data?.users, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export function useGetUser(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      user: data,
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export async function getUser(userId) {
  return axiosInstance.get(`${URL}/${userId}`).then((res) => res.data);
}

export async function createUser(userData) {
  try {
    const res = await axiosInstance.post(URL, userData);
    mutate((key) => key.startsWith(URL));
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateUser(id, userData) {
  userData.id = id;
  const res = await axiosInstance.put(`${URL}/${id}`, userData);
  mutate((key) => key.startsWith(URL));
  mutate((key) => key.startsWith('/workspaces'));
  return res.data;
}

export async function updateUserMetrics(id, metricsData) {
  const res = await axiosInstance.put(`${URL}/${id}/metrics`, metricsData);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function deleteUser(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export function useGetUserMetrics(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}/metrics`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      metrics: data || {},
      metricsLoading: isLoading,
      metricsError: error,
      metricsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export function useGetLateArrives(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}/late_arrives`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      lateArrives: data ?? [],
      lateArrivesLoading: isLoading,
      lateArrivesError: error,
      lateArrivesValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export async function generatePresignedUrl(userId, file) {
  try {
    const files = [];
    files.push({ file_name: file.name, content_type: file.type });
    const res = await axiosInstance.post(`${URL}/${userId}/generate-presigned-url`, files);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

export async function updateAvatarUrl(id, avatarUrl) {
  const data = { avatar_url: avatarUrl };
  const res = await axiosInstance.put(`${URL}/${id}/avatar`, data);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function disableUser(id) {
  const res = await axiosInstance.put(`${URL}/${id}/disable`);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function enableUser(id) {
  const res = await axiosInstance.put(`${URL}/${id}/enable`);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export function useGetTopGoalsAndAssists(selectedWorkspace) {
  const workspaceId = selectedWorkspace?.id;
  const { data, isLoading, error, isValidating } = useSWR(
    workspaceId ? `/top_goals_and_assists?workspace_id=${workspaceId}` : null, // Construct the URL with the workspaceId
    fetcher,
    swrOptions
  );

  const topGoalsAndAssists = useMemo(() => data || [], [data]);
  return {
    topGoalsAndAssists,
    isLoading,
    error,
    isValidating,
  };
}
