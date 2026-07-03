import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/**
 * Team managers/contacts for a tournament — the people "Generar Cobros" bills.
 * Built from the teams already loaded for the tournament, since manager info
 * (manager_name, contact_email, manager_user_ids) already lives on the team.
 */
export function TournamentUsersTable({ teams, teamsLoading }) {
  if (teamsLoading) {
    return (
      <Stack spacing={1}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }

  if (!teams?.length) {
    return <EmptyContent title="Sin equipos inscritos todavía" sx={{ py: 6 }} />;
  }

  return (
    <Stack spacing={0.75}>
      {teams.map((team) => {
        const isRegistered = (team.manager_user_ids || []).length > 0;
        const initials = team.short_name || team.name?.slice(0, 2)?.toUpperCase() || '?';
        return (
          <Box
            key={team.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.25,
              bgcolor: 'background.paper',
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
              borderRadius: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar
                src={team.logo_url || undefined}
                variant="rounded"
                sx={{ width: 32, height: 32 }}
              >
                {!team.logo_url && initials}
              </Avatar>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {team.manager_name || 'Sin encargado'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {team.name} · {team.contact_email || 'Sin email'}
                </Typography>
              </Stack>
            </Stack>

            <Chip
              size="small"
              variant="soft"
              color={isRegistered ? 'success' : 'default'}
              label={isRegistered ? 'Registrado' : 'Pendiente'}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
