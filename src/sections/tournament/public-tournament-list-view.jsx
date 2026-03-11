import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { useGetPublicTournaments } from 'src/actions/tournament';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { LandingNav } from 'src/sections/landing/landing-nav';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'finished', label: 'Finalizados' },
];

const STATUS_COLOR = {
  active: 'success',
  finished: 'info',
};

const STATUS_META = {
  draft: { label: 'Borrador', color: 'default', accent: 'grey.400' },
  active: { label: 'Activo', color: 'success', accent: 'success.main' },
  finished: { label: 'Finalizado', color: 'info', accent: 'info.main' },
  cancelled: { label: 'Cancelado', color: 'error', accent: 'error.main' },
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

const TYPE_ICON = {
  league: 'mdi:table',
  knockout: 'mdi:tournament',
  hybrid: 'mdi:trophy-outline',
};

// ----------------------------------------------------------------------

export function PublicTournamentListView() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('active');

  const { tournaments, countsByStatus, tournamentsLoading, tournamentsEmpty } =
    useGetPublicTournaments(statusFilter || undefined);

  const handleStatusChange = useCallback((_, newValue) => {
    setStatusFilter(newValue);
  }, []);

  const getCount = (status) => {
    if (!status) return Object.values(countsByStatus).reduce((a, b) => a + b, 0);
    return countsByStatus[status] || 0;
  };

  return (
    <>
      <LandingNav basePath="/" />
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 6, md: 8 } }}>
        <Stack spacing={1} sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography variant="h3">Torneos</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Consulta resultados, tablas y estadísticas de los torneos.
          </Typography>
        </Stack>

        <Tabs
          value={statusFilter}
          onChange={handleStatusChange}
          sx={{
            mb: { xs: 3, md: 5 },
            px: 0,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <Tab
              key={opt.value}
              value={opt.value}
              label={opt.label}
              iconPosition="end"
              icon={
                <Label
                  variant={statusFilter === opt.value ? 'filled' : 'soft'}
                  color={STATUS_COLOR[opt.value] || 'default'}
                >
                  {getCount(opt.value)}
                </Label>
              }
            />
          ))}
        </Tabs>

        {tournamentsEmpty && !tournamentsLoading && (
          <EmptyContent
            filled
            title="No hay torneos"
            description={
              statusFilter
                ? `No hay torneos con estado "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}"`
                : 'No hay torneos disponibles'
            }
            sx={{ py: 10 }}
          />
        )}

        <Box
          gap={3}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        >
          {tournaments.map((tournament) => (
            <PublicTournamentCard
              key={tournament.id}
              tournament={tournament}
              onView={() => navigate(paths.publicTournaments.detail(tournament.id))}
            />
          ))}
        </Box>
      </Container>
    </>
  );
}

// ----------------------------------------------------------------------

function PublicTournamentCard({ tournament, onView }) {
  const { name, season, type, status, current_matchweek, rules, teams } = tournament;

  const meta = STATUS_META[status] || STATUS_META.draft;
  const totalMw = rules?.total_matchweeks || 0;
  const currentMw = current_matchweek || 0;
  const numTeams = rules?.num_teams || 0;
  const teamCount = teams?.length ?? tournament.team_count ?? 0;
  const matchweekPct = totalMw > 0 ? Math.min((currentMw / totalMw) * 100, 100) : 0;

  return (
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

      <Stack sx={{ flex: 1, pl: 2.5, pr: 2, pt: 2.5, pb: 0 }} spacing={0}>
        {/* Top row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 1.75 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
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
                width={18}
                sx={{ color: `${TYPE_COLOR[type] || 'primary'}.main` }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: `${TYPE_COLOR[type] || 'primary'}.main`,
                  lineHeight: 1,
                }}
              >
                {TYPE_LABEL[type] || type}
              </Typography>
              {season && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', display: 'block', lineHeight: 1.4 }}
                >
                  {season}
                </Typography>
              )}
            </Box>
          </Stack>

          <Chip label={meta.label} color={meta.color} size="small" variant="soft" />
        </Stack>

        {/* Name */}
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

        {/* Status section */}
        {status === 'active' &&
          (() => {
            const inKnockout =
              type === 'knockout' || (type === 'hybrid' && totalMw > 0 && currentMw >= totalMw);
            const inGroupStage = !inKnockout && totalMw > 0;

            if (inKnockout) {
              return (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      flexShrink: 0,
                      animation: 'pulseDot 2s ease-in-out infinite',
                      '@keyframes pulseDot': {
                        '0%,100%': { opacity: 1 },
                        '50%': { opacity: 0.25 },
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Fase eliminatoria en curso
                  </Typography>
                </Stack>
              );
            }

            if (inGroupStage) {
              return (
                <Stack spacing={1} sx={{ mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Iconify
                        icon="mdi:calendar-today"
                        width={15}
                        sx={{ color: 'success.main' }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Jornada {currentMw}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: 'text.disabled', ml: 0.25 }}
                        >
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

            return null;
          })()}

        {status === 'finished' && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
            <Iconify icon="mdi:check-circle" width={16} sx={{ color: 'info.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Torneo finalizado
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
          onClick={onView}
        >
          Ver torneo
        </Button>
      </Box>
    </Card>
  );
}
