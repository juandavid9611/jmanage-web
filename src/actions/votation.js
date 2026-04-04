import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.votations;

// ----------------------------------------------------------------------

export function useGetVotations(workspaceId) {
  const { data, isLoading, error, isValidating } = useSWR(
    workspaceId ? `${URL}?workspace_id=${workspaceId}` : null,
    fetcher
  );

  return useMemo(
    () => ({
      votations: data || [],
      votationsLoading: isLoading,
      votationsError: error,
      votationsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetVotation(votationId, workspaceId) {
  const { data, isLoading, error, isValidating, mutate: revalidate } = useSWR(
    votationId && workspaceId ? [`${URL}/${votationId}`, { params: { workspace_id: workspaceId } }] : null,
    fetcher
  );

  return useMemo(
    () => ({
      votation: data || null,
      votationLoading: isLoading,
      votationError: error,
      votationValidating: isValidating,
      revalidate,
    }),
    [data, error, isLoading, isValidating, revalidate]
  );
}

// ----------------------------------------------------------------------

export async function previewCandidates(workspaceId, month, minPct) {
  const res = await axiosInstance.get(`${URL}/preview`, {
    params: { workspace_id: workspaceId, month, min_pct: minPct },
  });
  return res.data;
}

export async function createVotation(payload, workspaceId) {
  const res = await axiosInstance.post(`${URL}?workspace_id=${workspaceId}`, payload);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function castVote(votationId, candidateId, workspaceId) {
  const res = await axiosInstance.post(
    `${URL}/${votationId}/vote?workspace_id=${workspaceId}`,
    { candidate_id: candidateId }
  );
  mutate((key) => typeof key === 'string' && key.startsWith(`${URL}/${votationId}`));
  return res.data;
}

export async function deleteVotation(votationId, workspaceId) {
  await axiosInstance.delete(`${URL}/${votationId}?workspace_id=${workspaceId}`);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
}

export async function closeVotation(votationId, workspaceId) {
  const res = await axiosInstance.patch(
    `${URL}/${votationId}/close?workspace_id=${workspaceId}`
  );
  mutate((key) => typeof key === 'string' && key.startsWith(`${URL}/${votationId}`));
  return res.data;
}

export async function createTiebreaker(votationId, workspaceId) {
  const res = await axiosInstance.post(
    `${URL}/${votationId}/tiebreaker?workspace_id=${workspaceId}`
  );
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}
