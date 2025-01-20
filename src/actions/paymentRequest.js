import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const URL = endpoints.paymentRquests;

export function useGetPaymentRequests(workspaceId) {
  const { data, isLoading, error, isValidating } = useSWR(
    workspaceId ? `${URL}?workspace_id=${workspaceId}` : null,
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      paymentRequests: data || [],
      paymentRequestsLoading: isLoading,
      paymentRequestsError: error,
      paymentRequestsValidating: isValidating,
      paymentRequestsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetPaymentRequestsByUser(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}?user_id=${userId}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      paymentRequests: data || [],
      paymentRequestsLoading: isLoading,
      paymentRequestsError: error,
      paymentRequestsValidating: isValidating,
      paymentRequestsEmpty: !isLoading && !data.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetPaymentRequest(id) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${id}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      paymentRequest: data,
      paymentRequestLoading: isLoading,
      paymentRequestError: error,
      paymentRequestValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createPaymentRequests(paymentRequestsData) {
  const res = await axiosInstance.post(URL, paymentRequestsData);
  mutate(URL);
  return res;
}

export async function updatePaymentRequest(id, paymentRequestData) {
  paymentRequestData.id = id;
  const res = await axiosInstance.put(`${URL}/${id}`, paymentRequestData);
  mutate(URL);
  mutate(`${URL}/${id}`);
  return res;
}

export async function deletePaymentRequest(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(URL);
  return res.data;
}

export async function requestPaymentRequestApproval(id, file_names) {
  const res = await axiosInstance.post(`${URL}/${id}/request_approval`, file_names);
  mutate(URL);
  mutate(`${URL}/${id}`);
  return res.data;
}

export async function generatePresignedUrls(paymentRequestId, files) {
  try {
    files = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const res = await axiosInstance.post(
      `${URL}/${paymentRequestId}/generate-presigned-urls`,
      files
    );
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
