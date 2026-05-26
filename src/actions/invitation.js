import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints, publicFetcher } from 'src/utils/axios';

const PUBLIC_INVITE_URL = '/public/invites';
const URL = endpoints.tournaments;

// ── Public Invitation (no auth) ───────────────────────────────────────

export function useGetPublicInvitation(token) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    token ? `${PUBLIC_INVITE_URL}/${token}` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      invitation: data,
      invitationLoading: isLoading,
      invitationError: error,
      invitationValidating: isValidating,
      refetch: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export async function acceptInvitation({ token, password }) {
  const res = await axiosInstance.post(`${PUBLIC_INVITE_URL}/${token}/accept`, { password });
  return res.data;
}

// ── Tournament Invitations (auth required) ────────────────────────────

export function useGetTournamentInvitations(tournamentId) {
  const { data, error, isLoading, mutate } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/invitations` : null,
    fetcher
  );

  return useMemo(
    () => ({
      invitations: data ?? [],
      invitationsLoading: isLoading,
      invitationsError: error,
      refetch: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function resendInvitation({ tournamentId, teamId }) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/invitations/resend`
  );
  return res.data;
}

export async function revokeInvitation({ tournamentId, teamId }) {
  const res = await axiosInstance.delete(
    `${URL}/${tournamentId}/teams/${teamId}/invitations`
  );
  return res.data;
}
