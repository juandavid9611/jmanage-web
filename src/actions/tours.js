import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.tours;

export function useGetTours() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

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

export async function createTour(tourData) {
  try {
    const res = await axiosInstance.post(URL, tourData);
    mutate(URL);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateTour(id, tourData) {
  console.info('tourData', tourData);
  tourData.id = id;
  const res = await axiosInstance.put(`${URL}/${id}`, tourData);
  mutate(URL);
  mutate(`${URL}/${id}`);
  return res.data;
}

export async function deleteTour(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(URL);
  return res.data;
}

export async function generatePresignedUrls(tourId, files) {
  try {
    files = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const res = await axiosInstance.post(`${URL}/${tourId}/generate-presigned-urls`, files);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

export async function addImages(tourId, file_names) {
  const res = await axiosInstance.post(`${URL}/${tourId}/add_images`, file_names);
  mutate(URL);
  mutate(`${URL}/${tourId}`);
  return res.data;
}

export async function patchBooker(tourId, bookerId, bookerData) {
  const res = await axiosInstance.patch(`${URL}/${tourId}/bookers/${bookerId}`, bookerData);
  mutate(URL);
  return res.data;
}
