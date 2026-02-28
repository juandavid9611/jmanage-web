import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GroupPanel({ groups, teams }) {
  if (!groups?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No hay grupos definidos
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {groups.map((group) => {
        const groupTeams = teams.filter((t) => t.group_id === group.id);

        return (
          <Card key={group.id} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="mdi:group" width={20} />
              <Typography variant="subtitle1">{group.name}</Typography>
              <Chip
                label={`${groupTeams.length} equipos`}
                size="small"
                variant="soft"
                color="primary"
              />
              {group.advancement_slots && (
                <Chip
                  label={`Avanzan ${group.advancement_slots}`}
                  size="small"
                  variant="soft"
                  color="info"
                />
              )}
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={1}>
              {groupTeams.map((team) => (
                <Chip key={team.id} label={team.name} variant="outlined" />
              ))}
              {groupTeams.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Sin equipos asignados
                </Typography>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
