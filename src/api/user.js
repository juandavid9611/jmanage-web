import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.users;

export function useGetUsers() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

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
    mutate(URL);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateUser(id, userData) {
  userData.id = id;
  const res = await axiosInstance.put(`${URL}/${id}`, userData);
  mutate(URL);
  return res.data;
}

export async function updateUserMetrics(id, metricsData) {
  const res = await axiosInstance.put(`${URL}/${id}/metrics`, metricsData);
  mutate(URL);
  return res.data;
}

export async function deleteUser(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(URL);
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
      lateArrives: data || [],
      lateArrivesLoading: isLoading,
      lateArrivesError: error,
      lateArrivesValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}
