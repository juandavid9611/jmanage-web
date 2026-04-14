import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { deleteTournament } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const STATUS_META = {
  draft:     { label: 'Borrador',   color: 'default', accent: 'grey.400' },
  active:    { label: 'Activo',     color: 'success', accent: 'success.main' },
  finished:  { label: 'Finalizado', color: 'info',    accent: 'info.main' },
  cancelled: { label: 'Cancelado',  color: 'error',   accent: 'error.main' },
};

const TYPE_LABEL = {
  league:   'Liga',
  knockout: 'Eliminación',
  hybrid:   'Híbrido',
};

const TYPE_COLOR = {
  league:   'primary',
  knockout: 'warning',
  hybrid:   'secondary',
};

const TYPE_ICON = {
  league:   'mdi:table',
  knockout: 'mdi:tournament',
  hybrid:   'mdi:trophy-outline',
};

// ----------------------------------------------------------------------

export function TournamentCard({ tournament, onDelete }) {
  const navigate = useNavigate();
  const popover = usePopover();

  const { id, name, season, type, status, current_matchweek, rules, teams, logo_url } = tournament;

  const meta = STATUS_META[status] || STATUS_META.draft;
  const totalMw = rules?.total_matchweeks || 0;
  const currentMw = current_matchweek || 0;
  const numTeams = rules?.num_teams || 0;
  const teamCount = teams?.length ?? tournament.team_count ?? 0;
  const matchweekPct = totalMw > 0 ? Math.min((currentMw / totalMw) * 100, 100) : 0;

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
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: (t) => t.shadows[16] },
        }}
      >
        {/* Status accent bar */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: meta.accent,
            ...(status === 'active' && {
              animation: 'pulseBar 2s ease-in-out infinite',
              '@keyframes pulseBar': {
                '0%,100%': { opacity: 1 },
                '50%': { opacity: 0.45 },
              },
            }),
          }}
        />

        {/* Card body */}
        <Stack sx={{ flex: 1, pl: 2.5, pr: 2, pt: 2.5, pb: 0 }} spacing={0}>

          {/* Top row: type icon + season | status chip + overflow */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.75 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {logo_url ? (
                <Avatar
                  src={logo_url}
                  variant="rounded"
                  sx={{ width: 40, height: 40, borderRadius: 1.5, flexShrink: 0 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette[TYPE_COLOR[type] || 'primary'].main, 0.08),
                    flexShrink: 0,
                  }}
                >
                  <Iconify
                    icon={TYPE_ICON[type] || 'mdi:trophy-outline'}
                    width={20}
                    sx={{ color: `${TYPE_COLOR[type] || 'primary'}.main` }}
                  />
                </Box>
              )}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: `${TYPE_COLOR[type] || 'primary'}.main`, lineHeight: 1 }}>
                  {TYPE_LABEL[type] || type}
                </Typography>
                {season && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', lineHeight: 1.4 }}>
                    {season}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Chip label={meta.label} color={meta.color} size="small" variant="soft" />
              <IconButton size="small" onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" width={20} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Tournament name */}
          <Typography variant="h6" sx={{ mb: 0.5, lineHeight: 1.25 }}>
            {name}
          </Typography>

          {/* Team count */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
            <Iconify icon="mdi:shield-half-full" width={13} sx={{ color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {teamCount > 0
                ? `${teamCount} equipo${teamCount !== 1 ? 's' : ''}${numTeams > 0 ? ` / ${numTeams}` : ''}`
                : 'Sin equipos'}
            </Typography>
          </Stack>

          <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

          {/* Status-specific section */}
          {status === 'draft' && (
            <DraftSection teamCount={teamCount} numTeams={numTeams} />
          )}
          {status === 'active' && (
            <ActiveSection
              type={type}
              currentMw={currentMw}
              totalMw={totalMw}
              matchweekPct={matchweekPct}
            />
          )}
          {status === 'finished' && (
            <FinishedSection tournament={tournament} />
          )}
          {status === 'cancelled' && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:cancel" width={15} sx={{ color: 'error.main' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Torneo cancelado
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Action footer */}
        <Box sx={{ pl: 2.5, pr: 2, pb: 2.5, pt: 2 }}>
          <Button
            fullWidth
            variant="soft"
            size="small"
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            onClick={() => navigate(paths.dashboard.tournament.details(id))}
          >
            Gestionar
          </Button>
        </Box>
      </Card>

      {/* Overflow menu */}
      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuItem
          onClick={() => {
            popover.onClose();
            navigate(paths.dashboard.tournament.edit(id));
          }}
        >
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

// ----------------------------------------------------------------------

function DraftSection({ teamCount, numTeams }) {
  const filledPct = numTeams > 0 ? Math.min((teamCount / numTeams) * 100, 100) : 0;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Iconify icon="mdi:pencil-circle-outline" width={15} sx={{ color: 'text.disabled' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Inscripción abierta
        </Typography>
      </Stack>
      {numTeams > 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Equipos inscritos
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: teamCount >= numTeams ? 'success.main' : 'text.secondary' }}>
              {teamCount} / {numTeams}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={filledPct}
            sx={{
              height: 5,
              borderRadius: 1,
              bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
              '& .MuiLinearProgress-bar': { borderRadius: 1 },
            }}
          />
        </Box>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ActiveSection({ type, currentMw, totalMw, matchweekPct }) {
  const inKnockoutPhase =
    type === 'knockout' || (type === 'hybrid' && totalMw > 0 && currentMw >= totalMw);

  if (inKnockoutPhase) {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'success.main',
            flexShrink: 0,
            animation: 'pulseDot 2s ease-in-out infinite',
            '@keyframes pulseDot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
          }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Fase eliminatoria en curso
        </Typography>
      </Stack>
    );
  }

  if (totalMw > 0) {
    return (
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Iconify icon="mdi:calendar-today" width={15} sx={{ color: 'success.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Jornada {currentMw}
              <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 0.25 }}>
                / {totalMw}
              </Typography>
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
            {Math.round(matchweekPct)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={matchweekPct}
          color="success"
          sx={{
            height: 5,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.success.main, 0.1),
            '& .MuiLinearProgress-bar': { borderRadius: 1 },
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: 'success.main',
          flexShrink: 0,
          animation: 'pulseDot 2s ease-in-out infinite',
          '@keyframes pulseDot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
        }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Torneo en curso
      </Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function FinishedSection({ tournament }) {
  const winner = tournament.winner_team_name || tournament.winner;

  if (winner) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
          border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.18)}`,
        }}
      >
        <Iconify icon="mdi:trophy" width={22} sx={{ color: 'warning.main', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.25 }}>
            Campeón
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {winner}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Iconify icon="mdi:check-circle" width={16} sx={{ color: 'info.main' }} />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Torneo finalizado
      </Typography>
    </Stack>
  );
}
