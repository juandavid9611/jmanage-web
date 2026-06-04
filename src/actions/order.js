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
  mutate((key) => key.startsWith(URL), undefined, { revalidate: false });
  return res.data;
}

export async function deleteOrder(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res;
}

function syncOrderCache(id, updatedOrder) {
  // Detail cache: replace with the server response (no revalidation).
  mutate(`${URL}/${id}`, updatedOrder, { revalidate: false });
  // List cache: swap the matching row in place if loaded.
  mutate(
    URL,
    (orders) =>
      Array.isArray(orders) ? orders.map((o) => (o.id === id ? updatedOrder : o)) : orders,
    { revalidate: false }
  );
}

export async function setOrderProviderCheck(id, checked, note) {
  const res = await axiosInstance.post(`${URL}/${id}/provider-check`, { checked, note });
  syncOrderCache(id, res.data);
  return res.data;
}

export async function setOrderDeliveryCheck(id, checked, note) {
  const res = await axiosInstance.post(`${URL}/${id}/delivery-check`, { checked, note });
  syncOrderCache(id, res.data);
  return res.data;
}
