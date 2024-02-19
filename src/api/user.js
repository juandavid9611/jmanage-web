import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcherLocal, axiosLocalInstance } from 'src/utils/axios';

export function useGetUsers() {
  const URL = '/users';
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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
  const URL = `/users/${userId}`;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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

export async function createUser(userData) {
  try {
    const URL = `/users`;
    const res = await axiosLocalInstance.post(URL, userData);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateUser(id, userData) {
  const URL = `/users/${id}`;
  userData.id = id;
  const res = await axiosLocalInstance.put(URL, userData);
  return res.data;
}

export async function deleteUser(id) {
  const URL = `/users/${id}`;
  const res = await axiosLocalInstance.delete(URL);
  return res.data;
}

export function useGetUserMetrics(userId) {
  const URL = `/users/${userId}/metrics`;
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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
