import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.tours;

export function useGetTours(workspaceId, tourType) {
  const { data, isLoading, error, isValidating } = useSWR(
    workspaceId ? `${URL}?workspace_id=${workspaceId}&tour_type=${tourType}` : null,
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      tours: data || [],
      toursLoading: isLoading,
      toursError: error,
      toursValidating: isValidating,
      toursEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export function useGetTour(tourId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${tourId}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      tour: data,
      tourLoading: isLoading,
      tourError: error,
      tourValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export async function createTour(tourData, workspaceId) {
  try {
    const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : URL;
    const res = await axiosInstance.post(url, tourData);
    mutate((key) => key.startsWith(URL));
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateTour(id, tourData, workspaceId) {
  console.info('tourData', tourData);
  tourData.id = id;
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.put(url, tourData);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function deleteTour(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.delete(url);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function generatePresignedUrls(tourId, files, workspaceId) {
  try {
    files = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const url = workspaceId ? `${URL}/${tourId}/generate-presigned-urls?workspace_id=${workspaceId}` : `${URL}/${tourId}/generate-presigned-urls`;
    const res = await axiosInstance.post(url, files);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

export async function addImages(tourId, file_names, workspaceId) {
  const url = workspaceId ? `${URL}/${tourId}/add_images?workspace_id=${workspaceId}` : `${URL}/${tourId}/add_images`;
  const res = await axiosInstance.post(url, file_names);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function patchBooker(tourId, bookerId, bookerData, workspaceId) {
  const url = workspaceId ? `${URL}/${tourId}/bookers/${bookerId}?workspace_id=${workspaceId}` : `${URL}/${tourId}/bookers/${bookerId}`;
  const res = await axiosInstance.patch(url, bookerData);
  mutate((key) => key.startsWith(URL));
  return res.data;
}
