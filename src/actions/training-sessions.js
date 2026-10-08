import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const TRAINING_ENDPOINT = endpoints.trainingSessions;

function withWorkspace(path, workspaceId) {
  return `${path}?workspace_id=${workspaceId}`;
}

function revalidateSessions() {
  return mutate((key) => typeof key === 'string' && key.startsWith(TRAINING_ENDPOINT));
}

// ----------------------------------------------------------------------

export function useGetTrainingSessions(selectedWorkspace) {
  const workspaceId = selectedWorkspace?.id;

  const { data, isLoading, error } = useSWR(
    workspaceId ? withWorkspace(TRAINING_ENDPOINT, workspaceId) : null,
    fetcher
  );

  return useMemo(() => {
    const sessions = [...(data || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const countsByStatus = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    return {
      sessions,
      countsByStatus,
      sessionsLoading: isLoading,
      sessionsError: error,
      sessionsEmpty: !isLoading && !error && !sessions.length,
    };
  }, [data, error, isLoading]);
}

// ----------------------------------------------------------------------

export function useGetTrainingSession(selectedWorkspace, id) {
  const workspaceId = selectedWorkspace?.id;

  const { data, isLoading, error } = useSWR(
    workspaceId && id ? withWorkspace(`${TRAINING_ENDPOINT}/${id}`, workspaceId) : null,
    fetcher
  );

  return useMemo(
    () => ({
      session: data || null,
      sessionLoading: isLoading,
      sessionError: error,
      // the API answers 404 for unknown ids and for ids of another account
      sessionNotFound: !!workspaceId && !isLoading && (error?.status === 404 || (!error && !data)),
    }),
    [data, error, isLoading, workspaceId]
  );
}

// ----------------------------------------------------------------------

// `sessionData`: { title, date, exercises }. Always created as a draft; call
// sendTrainingSession afterwards to submit it for review.
export async function createTrainingSession(sessionData, workspaceId) {
  const res = await axios.post(withWorkspace(TRAINING_ENDPOINT, workspaceId), sessionData);
  await revalidateSessions();
  return res.data;
}

// ----------------------------------------------------------------------

export async function updateTrainingSession(sessionData, workspaceId) {
  const { id, ...body } = sessionData;
  const res = await axios.put(withWorkspace(`${TRAINING_ENDPOINT}/${id}`, workspaceId), body);
  await revalidateSessions();
  return res.data;
}

// ----------------------------------------------------------------------

export async function deleteTrainingSession(id, workspaceId) {
  await axios.delete(withWorkspace(`${TRAINING_ENDPOINT}/${id}`, workspaceId));
  await revalidateSessions();
}

// ----------------------------------------------------------------------

export async function sendTrainingSession(id, workspaceId) {
  const res = await axios.post(withWorkspace(`${TRAINING_ENDPOINT}/${id}/send`, workspaceId));
  await revalidateSessions();
  return res.data;
}

// ----------------------------------------------------------------------

// reviewedBy is taken from the token server-side.
export async function reviewTrainingSession(id, { approved, comment }, workspaceId) {
  const res = await axios.post(withWorkspace(`${TRAINING_ENDPOINT}/${id}/review`, workspaceId), {
    approved,
    comment: comment || '',
  });
  await revalidateSessions();
  return res.data;
}
