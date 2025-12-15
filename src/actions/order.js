import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------
const URL = endpoints.orders;

export function useGetOrders() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      orders: data || [],
      ordersLoading: isLoading,
      ordersError: error,
      ordersValidating: isValidating,
      ordersEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetOrder(orderId) {
  const { data, isLoading, error, isValidating } = useSWR(
    orderId ? `${URL}/${orderId}` : null,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      order: data,
      orderLoading: isLoading,
      orderError: error,
      orderValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createOrder(orderData) {
  const res = await axiosInstance.post(URL, orderData);
  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res.data;
}

export async function updateOrder(id, orderData) {
  const res = await axiosInstance.put(`${URL}/${id}`, orderData);
  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res.data;
}

export async function deleteOrder(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res;
}
