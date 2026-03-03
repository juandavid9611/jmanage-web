import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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

function getPhases(tournament, teams) {
  const { status, type } = tournament;
  const teamCount = teams?.length || 0;
  const totalTeams = tournament.num_teams || teamCount;

  const phases = [];

  // Configuración
  phases.push({
    label: 'Configuración',
    sub: status === 'draft' ? 'En progreso' : 'Completo',
    state: status === 'draft' ? 'active' : 'done',
  });

  // Inscripción
  if (status === 'draft') {
    phases.push({
      label: 'Inscripción',
      sub: `${teamCount}/${totalTeams}`,
      state: teamCount > 0 ? 'active' : 'locked',
    });
  } else {
    phases.push({
      label: 'Inscripción',
      sub: `${teamCount}/${totalTeams}`,
      state: 'done',
    });
  }

  // Fase de grupos (for league and hybrid)
  if (type === 'league' || type === 'hybrid') {
    const totalMw = tournament.rules?.total_matchweeks || 0;
    const currentMw = tournament.current_matchweek || 0;

    if (status === 'active' && currentMw > 0) {
      phases.push({
        label: 'Fase grupos',
        sub: `J${currentMw} de ${totalMw}`,
        state: currentMw >= totalMw ? 'done' : 'active',
      });
    } else if (status === 'finished') {
      phases.push({ label: 'Fase grupos', sub: 'Completo', state: 'done' });
    } else {
      phases.push({ label: 'Fase grupos', sub: 'Bloqueado', state: 'locked' });
    }
  }

  // Knockout phases (for knockout and hybrid)
  if (type === 'knockout' || type === 'hybrid') {
    const knockoutPhases = ['Cuartos', 'Semis', 'Final'];
    knockoutPhases.forEach((label) => {
      if (status === 'finished') {
        phases.push({ label, sub: 'Completo', state: 'done' });
      } else {
        phases.push({ label, sub: 'Bloqueado', state: 'locked' });
      }
    });
  }

  return phases;
}

// ----------------------------------------------------------------------

export function TournamentBanner({
  tournament,
  teams,
  isSubmitting,
  onActivate,
  onFinish,
  onDelete,
  onAdvanceMatchweek,
  onNavigateMatches,
  onNavigateEdit,
  onTabChange,
}) {
  const theme = useTheme();

  const totalMw = tournament.rules?.total_matchweeks || 0;
  const currentMw = tournament.current_matchweek || 0;
  const completion = totalMw > 0 ? Math.round((currentMw / totalMw) * 100) : 0;
  const teamCount = teams?.length || 0;
  const canActivate = teamCount >= 2;
  const isLeague = tournament.type === 'league';
  const isHybrid = tournament.type === 'hybrid';
  const isKnockout = tournament.type === 'knockout';

  const phases = getPhases(tournament, teams);

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
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: 'monospace', fontWeight: 500, letterSpacing: -0.5 }}
                  >
                    J{currentMw}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Activa
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 500, letterSpacing: -0.5 }}>
                    {currentMw}/{totalMw}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Jornadas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: 'monospace', fontWeight: 500, letterSpacing: -0.5, color: 'success.main' }}
                  >
                    {completion}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
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
                  onClick={() => onTabChange?.('jornada')}
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

      {/* ── Phase Progress Bar ── */}
      <Box
        sx={{
          display: 'flex',
          px: { xs: 0.5, md: 0 },
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 0 },
        }}
      >
        {phases.map((phase) => (
          <Box
            key={phase.label}
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.25,
              borderBottom: '2px solid',
              borderColor:
                phase.state === 'done'
                  ? alpha(theme.palette.success.main, 0.5)
                  : phase.state === 'active'
                    ? theme.palette.text.primary
                    : 'transparent',
              cursor: 'default',
              flexShrink: 0,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor:
                  phase.state === 'locked'
                    ? alpha(theme.palette.grey[500], 0.2)
                    : undefined,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color:
                  phase.state === 'done'
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
                display: 'block',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                color: 'text.disabled',
                mt: 0.25,
              }}
            >
              {phase.sub}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
