import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { uuidv4 } from 'src/utils/uuidv4';

// ----------------------------------------------------------------------
// No backend endpoint exists yet for this feature (the API lives in a
// separate Lambda not available in this repo). Sessions are persisted to
// localStorage, scoped per workspace, using the same SWR + mutate shape
// the real integration would use in src/actions/*.js — swapping this file
// for an axios-backed one later shouldn't require touching any caller.

const STORAGE_PREFIX = 'jmanage_training_sessions_';

function storageKey(workspaceId) {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

function readSessions(workspaceId) {
  if (!workspaceId) return [];
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function writeSessions(workspaceId, sessions) {
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(sessions));
}

// ----------------------------------------------------------------------

export function useGetTrainingSessions(selectedWorkspace) {
  const workspaceId = selectedWorkspace?.id;
  const key = workspaceId ? storageKey(workspaceId) : null;

  const { data, isLoading, error } = useSWR(key, () => readSessions(workspaceId));

  return useMemo(() => {
    const sessions = data || [];
    const countsByStatus = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    return {
      sessions,
      countsByStatus,
      sessionsLoading: isLoading,
      sessionsError: error,
      sessionsEmpty: !isLoading && !sessions.length,
    };
  }, [data, error, isLoading]);
}

// ----------------------------------------------------------------------

export function useGetTrainingSession(selectedWorkspace, id) {
  const workspaceId = selectedWorkspace?.id;
  const key = workspaceId ? storageKey(workspaceId) : null;

  const { data, isLoading } = useSWR(key, () => readSessions(workspaceId));

  return useMemo(() => {
    const session = (data || []).find((item) => item.id === id);
    return { session, sessionLoading: isLoading };
  }, [data, id, isLoading]);
}

// ----------------------------------------------------------------------

export async function createTrainingSession(sessionData, workspaceId) {
  const sessions = readSessions(workspaceId);
  const now = new Date().toISOString();
  const newSession = {
    status: 'draft',
    exercises: [],
    ...sessionData,
    id: uuidv4(),
    workspaceId,
    createdAt: now,
    updatedAt: now,
  };

  writeSessions(workspaceId, [newSession, ...sessions]);
  mutate(storageKey(workspaceId));
  return newSession;
}

// ----------------------------------------------------------------------

export async function updateTrainingSession(sessionData, workspaceId) {
  const sessions = readSessions(workspaceId);
  const now = new Date().toISOString();
  const updated = sessions.map((session) =>
    session.id === sessionData.id ? { ...session, ...sessionData, updatedAt: now } : session
  );

  writeSessions(workspaceId, updated);
  mutate(storageKey(workspaceId));
}

// ----------------------------------------------------------------------

export async function deleteTrainingSession(id, workspaceId) {
  const sessions = readSessions(workspaceId).filter((session) => session.id !== id);
  writeSessions(workspaceId, sessions);
  mutate(storageKey(workspaceId));
}

// ----------------------------------------------------------------------

export async function sendTrainingSession(id, workspaceId) {
  const sessions = readSessions(workspaceId);
  const now = new Date().toISOString();
  const updated = sessions.map((session) =>
    session.id === id ? { ...session, status: 'sent', updatedAt: now } : session
  );

  writeSessions(workspaceId, updated);
  mutate(storageKey(workspaceId));
}

// ----------------------------------------------------------------------

export async function reviewTrainingSession(id, { approved, comment, reviewer }, workspaceId) {
  const sessions = readSessions(workspaceId);
  const now = new Date().toISOString();
  const updated = sessions.map((session) =>
    session.id === id
      ? {
          ...session,
          status: approved ? 'approved' : 'rejected',
          reviewComment: comment || '',
          reviewedBy: reviewer,
          reviewedAt: now,
          updatedAt: now,
        }
      : session
  );

  writeSessions(workspaceId, updated);
  mutate(storageKey(workspaceId));
}
