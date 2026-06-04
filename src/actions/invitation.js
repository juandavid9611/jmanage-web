import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints, publicFetcher } from 'src/utils/axios';

const PUBLIC_INVITE_URL = '/public/invites';
const URL = endpoints.tournaments;

// ── Public Invitation (no auth) ───────────────────────────────────────

export function useGetPublicInvitation(token) {
  const { data, error, isLoading, isValidating, mutate: revalidate } = useSWR(
    token ? `${PUBLIC_INVITE_URL}/${token}` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      invitation: data,
      invitationLoading: isLoading,
      invitationError: error,
      invitationValidating: isValidating,
      refetch: revalidate,
    }),
    [data, error, isLoading, isValidating, revalidate]
  );
}

export async function acceptInvitation({ token, password }) {
  const res = await axiosInstance.post(`${PUBLIC_INVITE_URL}/${token}/accept`, {
    password,
  });
  return res.data;
}

// ── Tournament Invitations (auth required) ────────────────────────────

export function useGetTournamentInvitations(tournamentId) {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/invitations` : null,
    fetcher
  );

  return useMemo(
    () => ({
      invitations: data ?? [],
      invitationsLoading: isLoading,
      invitationsError: error,
      refetch: revalidate,
    }),
    [data, error, isLoading, revalidate]
  );
}

export async function resendInvitation({ tournamentId, teamId }) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/invitations/resend`
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/invitations`));
  return res.data;
}

export async function revokeInvitation({ tournamentId, teamId }) {
  const res = await axiosInstance.delete(
    `${URL}/${tournamentId}/teams/${teamId}/invitations`
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/invitations`));
  return res.data;
}
