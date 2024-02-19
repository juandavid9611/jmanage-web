import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcherLocal, axiosLocalInstance } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetPaymentRequests() {
  const URL = '/payment_requests';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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
  const URL = `/payment_requests?user_id=${userId}`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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
  const URL = `/payment_requests/${id}`;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcherLocal);

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
  const URL = `/payment_requests`;
  const res = await axiosLocalInstance.post(URL, paymentRequestsData);

  return res;
}

export async function updatePaymentRequest(id, paymentRequestData) {
  const URL = `/payment_requests/${id}`;
  const res = await axiosLocalInstance.put(URL, paymentRequestData);

  return res;
}

export async function deletePaymentRequest(id) {
  const URL = `/payment_requests/${id}`;

  const res = await axiosLocalInstance.delete(URL);

  return res.data;
}
