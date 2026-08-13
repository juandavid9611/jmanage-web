import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { endpoints, publicFetcher } from 'src/utils/axios';

const URL = endpoints.donations;

export function useGetDonationSummary() {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/summary`, publicFetcher, {
    refreshInterval: 12000,
  });

  return useMemo(
    () => ({
      totalAmountCop: data?.totalAmountCop || 0,
      contributionCount: data?.contributionCount || 0,
      summaryLoading: isLoading,
      summaryError: error,
      summaryValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetDonationContributions(limit = 20) {
  const { data, isLoading, error } = useSWR([`${URL}/contributions`, { limit }], publicFetcher, {
    refreshInterval: 12000,
  });

  return useMemo(
    () => ({
      contributions: data || [],
      contributionsLoading: isLoading,
      contributionsError: error,
    }),
    [data, error, isLoading]
  );
}

export async function createDonationContribution(data) {
  const res = await axiosInstance.post(`${URL}/contributions`, data);
  mutate(`${URL}/summary`);
  mutate((key) => Array.isArray(key) && key[0] === `${URL}/contributions`);
  return res.data;
}
