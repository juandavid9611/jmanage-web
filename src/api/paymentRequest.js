
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const URL = endpoints.paymentRequests;

export function useGetPaymentRequests() {

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

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
  const res = await axiosInstance.put(`${URL}/${id}`, paymentRequestData);
  mutate(URL);
  return res;
}

export async function deletePaymentRequest(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(URL);
  return res.data;
}
