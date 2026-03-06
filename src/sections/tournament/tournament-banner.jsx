import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_LABEL = {
  draft: 'Borrador',
  active: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR = {
  draft: 'default',
  active: 'success',
  finished: 'info',
  cancelled: 'error',
};

const TYPE_LABEL = {
  league: 'Liga',
  knockout: 'Eliminación',
  hybrid: 'Grupos + Knockout',
};

const SPORT_ICONS = {
  futbol: '⚽',
  baloncesto: '🏀',
  voleibol: '🏐',
  tenis: '🎾',
  padel: '🏸',
};

// ----------------------------------------------------------------------

/**
 * Build the list of phases for this tournament.
 * Each phase has: key, label, sub, state (done | active | locked).
 * The `key` is used for navigation — it maps to what content to show.
 */
export function getPhases(tournament, teams, totalMatchweeks) {
  const { status, type } = tournament;
  const teamCount = teams?.length || 0;
  const totalTeams = tournament.num_teams || teamCount;
  const totalMw = totalMatchweeks ?? tournament.rules?.total_matchweeks ?? 0;
  const currentMw = tournament.current_matchweek || 0;

  const phases = [];

  // Configuración — maps to overview/stats
  phases.push({
    key: 'configuracion',
    label: 'Configuración',
    sub: status === 'draft' ? 'En progreso' : 'Completo',
    state: status === 'draft' ? 'active' : 'done',
  });

  // Inscripción — maps to teams + scorers
  if (status === 'draft') {
    phases.push({
      key: 'inscripcion',
      label: 'Inscripción',
      sub: `${teamCount}/${totalTeams}`,
      state: teamCount > 0 ? 'active' : 'locked',
    });
  } else {
    phases.push({
      key: 'inscripcion',
      label: 'Inscripción',
      sub: `${teamCount}/${totalTeams}`,
      state: 'done',
    });
  }

  // Fase de grupos (for league and hybrid) — maps to matchweek/jornada content
  if (type === 'league' || type === 'hybrid') {
    if (status === 'active' && currentMw > 0) {
      phases.push({
        key: 'fase_grupos',
        label: 'Fase grupos',
        sub: `J${currentMw} de ${totalMw}`,
        state: currentMw >= totalMw ? 'done' : 'active',
      });
    } else if (status === 'finished') {
      phases.push({ key: 'fase_grupos', label: 'Fase grupos', sub: 'Completo', state: 'done' });
    } else {
      phases.push({ key: 'fase_grupos', label: 'Fase grupos', sub: 'Bloqueado', state: 'locked' });
    }
  }

  // Knockout phases (for knockout and hybrid) — maps to bracket view
  if (type === 'knockout' || type === 'hybrid') {
    if (status === 'finished') {
      phases.push({ key: 'eliminatorias', label: 'Fase Final', sub: 'Completo', state: 'done' });
    } else if (status === 'active') {
      // For knockout-only: always accessible once active.
      // For hybrid: only after all group-stage jornadas are done.
      const groupsDone = type === 'knockout' || (totalMw > 0 && currentMw >= totalMw);
      phases.push({
        key: 'eliminatorias',
        label: 'Fase Final',
        sub: groupsDone ? 'Lista para iniciar' : 'Bloqueado',
        state: groupsDone ? 'active' : 'locked',
      });
    } else {
      phases.push({ key: 'eliminatorias', label: 'Fase Final', sub: 'Bloqueado', state: 'locked' });
    }
  }

  return phases;
}

// ----------------------------------------------------------------------

export function TournamentBanner({
  tournament,
  teams,
  activePhase,
  isSubmitting,
  totalMatchweeks,
  onPhaseClick,
  onActivate,
  onFinish,
  onDelete,
  onAdvanceMatchweek,
  onNavigateEdit,
}) {
  const theme = useTheme();

  const totalMw = totalMatchweeks ?? tournament.rules?.total_matchweeks ?? 0;
  const currentMw = tournament.current_matchweek || 0;
  const completion = totalMw > 0 ? Math.round((currentMw / totalMw) * 100) : 0;
  const teamCount = teams?.length || 0;
  const canActivate = teamCount >= 2;
  const isLeague = tournament.type === 'league';
  const isHybrid = tournament.type === 'hybrid';

  const phases = getPhases(tournament, teams, totalMw);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
      }}
    >
      {/* ── Top Section ── */}
      <Box sx={{ px: { xs: 2, md: 3.5 }, pt: { xs: 2, md: 2.75 }, pb: 0 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'flex-start' }}
          spacing={2}
          sx={{ mb: 2.25 }}
        >
          {/* Left */}
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'text.disabled', letterSpacing: 2, mb: 0.5, display: 'block' }}
            >
              Torneo {STATUS_LABEL[tournament.status]?.toLowerCase() || ''}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.75 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                {tournament.name}
              </Typography>
              <Chip
                label={STATUS_LABEL[tournament.status] || tournament.status}
                color={STATUS_COLOR[tournament.status] || 'default'}
                size="small"
                sx={{
                  fontWeight: 600,
                  ...(tournament.status === 'active' && {
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }),
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1.75} sx={{ color: 'text.secondary' }}>
              <Typography variant="body2">
                {SPORT_ICONS[tournament.sport] || '🏆'} {tournament.sport || 'Deporte'}
              </Typography>
              {tournament.city && (
                <Typography variant="body2">📍 {tournament.city}</Typography>
              )}
              <Typography variant="body2">
                {teamCount} equipo{teamCount !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2">
                {TYPE_LABEL[tournament.type] || tournament.type}
              </Typography>
            </Stack>
          </Box>

          {/* Right */}
          <Stack
            direction={{ xs: 'row', md: 'column' }}
            spacing={1.25}
            alignItems={{ xs: 'center', md: 'flex-end' }}
          >
            {/* Quick Stats */}
            {tournament.status === 'active' && (isLeague || isHybrid) && totalMw > 0 && (
              <Stack direction="row" spacing={2.5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    J{currentMw}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Activa
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {currentMw}/{totalMw}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Jornadas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {completion}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Completado
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tournament.status === 'active' && (isLeague || isHybrid) && totalMw > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onPhaseClick?.('fase_grupos')}
                  endIcon={<Iconify icon="eva:arrow-forward-fill" width={16} />}
                >
                  Ir a Jornada {currentMw}
                </Button>
              )}

              {tournament.status === 'draft' && (
                <Tooltip
                  title={!canActivate ? 'Se necesitan al menos 2 equipos' : ''}
                  arrow
                >
                  <span>
                    <LoadingButton
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<Iconify icon="mdi:play" width={16} />}
                      loading={isSubmitting}
                      onClick={onActivate}
                      disabled={!canActivate}
                    >
                      Activar
                    </LoadingButton>
                  </span>
                </Tooltip>
              )}

              {tournament.status === 'active' && (isLeague || isHybrid) && totalMw > 0 && currentMw < totalMw && (
                <LoadingButton
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="mdi:skip-next" width={16} />}
                  loading={isSubmitting}
                  onClick={onAdvanceMatchweek}
                >
                  Avanzar Jornada
                </LoadingButton>
              )}

              {isHybrid && tournament.status === 'active' && totalMw > 0 && currentMw >= totalMw && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<Iconify icon="mdi:tournament" width={16} />}
                  onClick={() => onPhaseClick?.('eliminatorias')}
                >
                  Iniciar Fase Final
                </Button>
              )}

              {tournament.status === 'active' && (
                <LoadingButton
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<Iconify icon="mdi:flag-checkered" width={16} />}
                  loading={isSubmitting}
                  onClick={onFinish}
                >
                  Finalizar
                </LoadingButton>
              )}

              {tournament.status !== 'finished' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                  onClick={onNavigateEdit}
                >
                  Editar
                </Button>
              )}

              <Button
                variant="soft"
                color="error"
                size="small"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
                onClick={onDelete}
              >
                Eliminar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* ── Phase Stepper Navigation ── */}
      <Tabs
        value={activePhase}
        onChange={(_, v) => onPhaseClick?.(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: { xs: 1, md: 2 },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        {phases.map((phase) => (
          <Tab
            key={phase.key}
            value={phase.key}
            label={
              <Stack alignItems="center" spacing={0.25}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: activePhase === phase.key ? 700 : 500,
                    color:
                      activePhase === phase.key
                        ? 'primary.main'
                        : phase.state === 'done'
                          ? 'success.main'
                          : phase.state === 'active'
                            ? 'text.primary'
                            : 'text.disabled',
                  }}
                >
                  {phase.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: activePhase === phase.key ? 'primary.main' : 'text.disabled',
                    fontSize: '0.65rem',
                  }}
                >
                  {phase.sub}
                </Typography>
              </Stack>
            }
            sx={{
              minHeight: 56,
              textTransform: 'none',
              minWidth: 'auto',
              px: 2,
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
