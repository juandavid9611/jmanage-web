import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Returns all tournament teams where the current user is the owner,
 * within the active account.
 *
 * Response shape per item:
 *   { tournament_id, tournament_name, tournament_team_id, team_name }
 */
export function useGetMyTeamOwnerTeams() {
  const { data, isLoading, error } = useSWR('/users/me/team-owner/teams', fetcher);

  return useMemo(
    () => ({
      teams: data || [],
      teamsLoading: isLoading,
      teamsError: error,
    }),
    [data, error, isLoading]
  );
}
