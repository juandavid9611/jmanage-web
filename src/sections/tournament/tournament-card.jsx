import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  draft: 'default',
  active: 'success',
  finished: 'info',
  cancelled: 'error',
};

const STATUS_LABEL = {
  draft: 'Borrador',
  active: 'Activo',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const TYPE_LABEL = {
  league: 'Liga',
  knockout: 'Eliminación',
  hybrid: 'Híbrido',
};

export function TournamentCard({ tournament }) {
  const navigate = useNavigate();

  const { id, name, season, type, status, current_matchweek, rules, groups } = tournament;

  return (
    <Card
      sx={{
        transition: 'all 0.2s ease-in-out',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[16] },
      }}
    >
      <CardActionArea onClick={() => navigate(paths.dashboard.tournament.details(id))}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>
                {name}
              </Typography>
              <Chip
                label={STATUS_LABEL[status] || status}
                color={STATUS_COLOR[status] || 'default'}
                size="small"
              />
            </Stack>

            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mdi:calendar" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Temporada: {season}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mdi:trophy" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {TYPE_LABEL[type] || type}
                </Typography>
              </Stack>

              {status === 'active' && current_matchweek > 0 && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="mdi:soccer-field" width={18} sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Jornada {current_matchweek}
                    {rules?.total_matchweeks ? ` / ${rules.total_matchweeks}` : ''}
                  </Typography>
                </Stack>
              )}

              {groups?.length > 0 && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="mdi:group" width={18} sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {groups.length} grupo{groups.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
