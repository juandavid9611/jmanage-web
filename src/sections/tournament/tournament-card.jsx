import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { deleteTournament } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

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

const TYPE_COLOR = {
  league: 'primary',
  knockout: 'warning',
  hybrid: 'secondary',
};

export function TournamentCard({ tournament, onDelete }) {
  const navigate = useNavigate();
  const popover = usePopover();

  const { id, name, season, type, status, current_matchweek, rules, teams } = tournament;

  const totalMw = rules?.total_matchweeks || 0;
  const currentMw = current_matchweek || 0;
  const matchweekProgress = totalMw > 0 ? (currentMw / totalMw) * 100 : 0;
  const teamCount = teams?.length ?? tournament.team_count ?? 0;

  const handleDelete = useCallback(async () => {
    popover.onClose();
    try {
      await deleteTournament(id);
      toast.success('Torneo eliminado');
      onDelete?.(id);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  }, [id, onDelete, popover]);

  return (
    <>
      <Card
        sx={{
          transition: 'all 0.2s ease-in-out',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[16] },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ flex: 1 }}>
          <Stack spacing={2}>
            {/* Header row */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={0.5} sx={{ flex: 1, mr: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap>
                  {name}
                </Typography>
                {season && (
                  <Typography variant="caption" color="text.secondary">
                    Temporada: {season}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Chip
                  label={STATUS_LABEL[status] || status}
                  color={STATUS_COLOR[status] || 'default'}
                  size="small"
                />
                <IconButton size="small" onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" width={20} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Type + teams row */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={TYPE_LABEL[type] || type}
                color={TYPE_COLOR[type] || 'default'}
                size="small"
                variant="soft"
              />
              {teamCount > 0 && (
                <Chip
                  icon={<Iconify icon="mdi:shield-half-full" width={14} />}
                  label={`${teamCount} equipo${teamCount !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Matchweek progress (league/active) */}
            {status === 'active' && totalMw > 0 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Jornada {currentMw} / {totalMw}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(matchweekProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={matchweekProgress}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            )}
          </Stack>
        </CardContent>

        {/* Action button */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => navigate(paths.dashboard.tournament.details(id))}
          >
            Gestionar
          </Button>
        </Box>
      </Card>

      {/* Overflow menu */}
      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuItem onClick={() => { popover.onClose(); navigate(paths.dashboard.tournament.edit(id)); }}>
          <Iconify icon="solar:pen-bold" />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Eliminar
        </MenuItem>
      </CustomPopover>
    </>
  );
}
