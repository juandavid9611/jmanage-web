import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const URL = endpoints.paymentRquests;

export function useGetPaymentRequests(workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

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

export function useGetPaymentRequestsByUser(userId, workspaceId) {
  const url = workspaceId ? `${URL}?user_id=${userId}&workspace_id=${workspaceId}` : `${URL}?user_id=${userId}`;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

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

export async function createPaymentRequests(paymentRequestsData, workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : URL;
  const res = await axiosInstance.post(url, paymentRequestsData);
  mutate((key) => key.startsWith(URL));
  return res;
}

export async function updatePaymentRequest(id, paymentRequestData, workspaceId) {
  paymentRequestData.id = id;
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.put(url, paymentRequestData);
  mutate((key) => key.startsWith(URL));
  return res;
}

export async function deletePaymentRequest(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.delete(url);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function requestPaymentRequestApproval(id, file_names, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/request_approval?workspace_id=${workspaceId}` : `${URL}/${id}/request_approval`;
  const res = await axiosInstance.post(url, file_names);
  mutate((key) => key.startsWith(URL));
  return res.data;
}

export async function generatePresignedUrls(paymentRequestId, files, workspaceId) {
  try {
    files = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const url = workspaceId ? `${URL}/${paymentRequestId}/generate-presigned-urls?workspace_id=${workspaceId}` : `${URL}/${paymentRequestId}/generate-presigned-urls`;
    const res = await axiosInstance.post(
      url,
      files
    );
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
