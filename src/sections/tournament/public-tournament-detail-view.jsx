import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import {
  useGetPublicTeams,
  useGetPublicStats,
  useGetPublicGroups,
  useGetPublicMatches,
  useGetPublicStandings,
  useGetPublicTournament,
  useGetPublicTopScorers,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { LandingNav } from 'src/sections/landing/landing-nav';

// ----------------------------------------------------------------------

const STATUS_META = {
  draft: { label: 'Borrador', color: 'default' },
  active: { label: 'Activo', color: 'success' },
  finished: { label: 'Finalizado', color: 'info' },
};

const TYPE_LABEL = {
  league: 'Liga',
  knockout: 'Eliminación',
  hybrid: 'Híbrido',
};

const TABS = [
  { value: 'overview', label: 'Resumen' },
  { value: 'standings', label: 'Tabla' },
  { value: 'matches', label: 'Partidos' },
  { value: 'scorers', label: 'Goleadores' },
];

const STATUS_BADGE = {
  finished: { label: 'Final', color: 'success' },
  live: { label: 'En vivo', color: 'error' },
  scheduled: { label: 'Pendiente', color: 'warning' },
  postponed: { label: 'Aplazado', color: 'warning' },
};

// ----------------------------------------------------------------------

export function PublicTournamentDetailView({ id }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMw, setSelectedMw] = useState(undefined);

  const { tournament, tournamentLoading } = useGetPublicTournament(id);
  const { teams } = useGetPublicTeams(id);
  const { groups } = useGetPublicGroups(id);
  const { allStandings, allStandingsLoading } = useGetPublicStandings(id);
  const { stats, statsLoading } = useGetPublicStats(id);
  const { scorers, scorersLoading } = useGetPublicTopScorers(id);

  const currentMw = tournament?.current_matchweek || 1;
  const totalMw = tournament?.rules?.total_matchweeks || 0;
  const activeMw = selectedMw === undefined ? currentMw : selectedMw;

  const { matches: allMatches, matchesLoading } = useGetPublicMatches(id);
  const currentMatches = useMemo(
    () => (activeMw === null ? allMatches : allMatches.filter((m) => m.matchweek === activeMw)),
    [allMatches, activeMw]
  );

  if (tournamentLoading) return <LoadingScreen />;
  if (!tournament)
    return (
      <EmptyContent
        title="Torneo no disponible"
        description="Este torneo no existe o no está configurado como público."
      />
    );

  const meta = STATUS_META[tournament.status] || STATUS_META.draft;

  return (
    <>
      <LandingNav basePath="/" />
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 5, md: 8 } }}>
        {/* Back button */}
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate(paths.publicTournaments.root)}
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          Torneos
        </Button>

        {/* Header */}
        <Stack spacing={1} sx={{ mb: { xs: 3, md: 4 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {tournament.logo_url && (
              <Avatar
                src={tournament.logo_url}
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  flexShrink: 0,
                  border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.16)}`,
                }}
              />
            )}
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
              <Typography variant="h4">{tournament.name}</Typography>
              <Chip label={meta.label} color={meta.color} size="small" variant="soft" />
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            {tournament.season && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Temporada {tournament.season}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {TYPE_LABEL[tournament.type] || tournament.type}
            </Typography>
            {tournament.type !== 'knockout' && totalMw > 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Jornada {currentMw} / {totalMw}
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: { xs: 3, md: 4 },
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <PublicStatsOverview stats={stats} statsLoading={statsLoading} tournament={tournament} />
        )}

        {activeTab === 'standings' && (
          <PublicStandingsView
            groups={groups}
            allStandings={allStandings}
            allStandingsLoading={allStandingsLoading}
            teams={teams}
          />
        )}

        {activeTab === 'matches' && (
          <PublicMatchesView
            allMatches={allMatches}
            matchesLoading={matchesLoading}
            currentMatches={currentMatches}
            teams={teams}
            totalMw={totalMw}
            currentMw={currentMw}
            activeMw={activeMw}
            selectedMw={selectedMw}
            onSelectMw={setSelectedMw}
          />
        )}

        {activeTab === 'scorers' && (
          <PublicTopScorers scorers={scorers} scorersLoading={scorersLoading} />
        )}
      </Container>
    </>
  );
}

// ----------------------------------------------------------------------
// Stats Overview

const STAT_TILES = [
  { key: 'total_matches', label: 'Partidos', icon: 'mdi:soccer-field', color: 'primary' },
  {
    key: 'matches_played',
    label: 'Jugados',
    icon: 'mdi:check-circle',
    color: 'success',
    progressOf: 'total_matches',
  },
  { key: 'total_goals', label: 'Goles', icon: 'mdi:soccer', color: 'warning' },
  {
    key: 'average_goals_per_match',
    label: 'Goles/Partido',
    icon: 'mdi:chart-line',
    color: 'info',
    decimals: 1,
  },
  { key: 'total_yellow_cards', label: 'Amarillas', icon: 'mdi:card', color: 'warning' },
  { key: 'total_red_cards', label: 'Rojas', icon: 'mdi:card', color: 'error' },
  { key: 'total_teams', label: 'Equipos', icon: 'mdi:shield-half-full', color: 'primary' },
  { key: 'current_matchweek', label: 'Jornada', icon: 'mdi:calendar-today', color: 'info' },
];

function PublicStatsOverview({ stats, statsLoading, tournament }) {
  if (statsLoading) {
    return (
      <Box
        display="grid"
        gap={1.5}
        gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
      >
        {STAT_TILES.map((tile) => (
          <Skeleton key={tile.key} variant="rounded" height={90} />
        ))}
      </Box>
    );
  }
  if (!stats) return <EmptyContent title="Sin datos" sx={{ py: 8 }} />;

  const champion = stats?.champion || null;

  return (
    <Stack spacing={2.5}>
      {champion && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2.5,
            py: 2,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
            border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:trophy" width={24} sx={{ color: 'warning.main' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'warning.dark',
                fontWeight: 700,
                display: 'block',
                lineHeight: 1,
                mb: 0.25,
              }}
            >
              CAMPEÓN
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'warning.darker', fontWeight: 800, lineHeight: 1.2 }}
              noWrap
            >
              {champion.name}
            </Typography>
            {tournament?.season && (
              <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                Temporada {tournament.season}
              </Typography>
            )}
          </Box>
          <Iconify
            icon="mdi:laurel-wreath"
            width={32}
            sx={{ color: (t) => alpha(t.palette.warning.main, 0.3), flexShrink: 0 }}
          />
        </Box>
      )}

      <Box
        display="grid"
        gap={1.5}
        gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
      >
        {STAT_TILES.map((tile) => {
          const raw = stats[tile.key];
          const value = tile.decimals ? Number(raw).toFixed(tile.decimals) : raw ?? 0;
          const progressPct = tile.progressOf
            ? Math.min((Number(raw) / (stats[tile.progressOf] || 1)) * 100, 100)
            : null;

          return (
            <StatTile
              key={tile.key}
              icon={tile.icon}
              color={tile.color}
              label={tile.label}
              value={value}
              progressPct={progressPct}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

function StatTile({ icon, color, label, value, progressPct }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        borderRadius: 1.5,
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette[color].main, 0.1),
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={15} sx={{ color: `${color}.main` }} />
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontWeight: 600, lineHeight: 1 }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}
      >
        {value}
      </Typography>

      {progressPct !== null && (
        <LinearProgress
          variant="determinate"
          value={progressPct}
          color={color}
          sx={{
            height: 3,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette[color].main, 0.1),
            '& .MuiLinearProgress-bar': { borderRadius: 1 },
          }}
        />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Standings

const COLS = [
  { key: 'rank', label: '#', fixed: '20px', align: 'center' },
  { key: 'name', label: 'Equipo', fixed: '2fr', align: 'left' },
  { key: 'played', label: 'PJ', fixed: '1fr', align: 'center' },
  { key: 'won', label: 'PG', fixed: '1fr', align: 'center' },
  { key: 'drawn', label: 'PE', fixed: '1fr', align: 'center' },
  { key: 'lost', label: 'PP', fixed: '1fr', align: 'center' },
  { key: 'goals_for', label: 'GF', fixed: '1fr', align: 'center' },
  { key: 'goals_against', label: 'GC', fixed: '1fr', align: 'center' },
  { key: 'goal_difference', label: 'DG', fixed: '1fr', align: 'center' },
  { key: 'points', label: 'PTS', fixed: '1fr', align: 'center' },
];

const GRID_TEMPLATE = COLS.map((c) => c.fixed).join(' ');

function PublicStandingsView({ groups, allStandings, allStandingsLoading, teams }) {
  if (allStandingsLoading) {
    return (
      <Stack spacing={0.75}>
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={36} />
        ))}
      </Stack>
    );
  }

  const hasData =
    allStandings?.tournament?.items?.length > 0 ||
    Object.values(allStandings?.groups || {}).some((g) => g.items?.length > 0);

  if (!hasData) return <EmptyContent title="Sin tabla de posiciones" sx={{ py: 8 }} />;

  return (
    <Stack spacing={3}>
      {groups?.length > 0 ? (
        groups.map((group) => (
          <Box key={group.id}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              {group.name}
            </Typography>
            <StandingsTable rows={allStandings?.groups?.[group.id]?.items || []} teams={teams} />
          </Box>
        ))
      ) : (
        <StandingsTable rows={allStandings?.tournament?.items || []} teams={teams} />
      )}
    </Stack>
  );
}

function StandingsTable({ rows, teams }) {
  if (!rows || rows.length === 0) return null;

  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_TEMPLATE,
          alignItems: 'center',
          px: 1,
          py: 0.75,
          bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          gap: 0.25,
          minWidth: 480,
        }}
      >
        {COLS.map((col) => (
          <Typography
            key={col.key}
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              fontWeight: col.key === 'points' ? 700 : 500,
              color: col.key === 'points' ? 'text.secondary' : 'text.disabled',
              textAlign: col.align,
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      <Stack spacing={0} sx={{ minWidth: 480 }}>
        {rows.map((row, idx) => {
          const team = teams?.find((t) => t.id === row.team_id);
          const name = team?.short_name || team?.name || '—';
          const isTop = idx < 2;
          const gd = row.goal_difference;

          return (
            <Box key={row.team_id}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: GRID_TEMPLATE,
                  alignItems: 'center',
                  px: 1,
                  py: 0.875,
                  gap: 0.25,
                  bgcolor: isTop ? (t) => alpha(t.palette.success.main, 0.03) : 'transparent',
                  '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.04) },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    color: isTop ? 'success.main' : 'text.disabled',
                    textAlign: 'center',
                  }}
                >
                  {idx + 1}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {isTop && (
                    <Box
                      sx={{
                        width: 3,
                        height: 12,
                        borderRadius: 0.5,
                        bgcolor: 'success.main',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: isTop ? 600 : 500, fontSize: '0.7rem' }}
                    noWrap
                  >
                    {name}
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', textAlign: 'center', color: 'text.secondary' }}
                >
                  {row.played ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    color: row.won > 0 ? 'success.main' : 'text.secondary',
                  }}
                >
                  {row.won ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', textAlign: 'center', color: 'text.secondary' }}
                >
                  {row.drawn ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    color: row.lost > 0 ? 'error.main' : 'text.secondary',
                  }}
                >
                  {row.lost ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', textAlign: 'center', color: 'text.secondary' }}
                >
                  {row.goals_for ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', textAlign: 'center', color: 'text.secondary' }}
                >
                  {row.goals_against ?? 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    color: gd > 0 ? 'success.main' : gd < 0 ? 'error.main' : 'text.disabled',
                  }}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    color: isTop ? 'success.main' : 'text.primary',
                  }}
                >
                  {row.points}
                </Typography>
              </Box>

              {idx === 1 && rows.length > 2 && (
                <Divider
                  sx={{
                    mx: 1,
                    borderStyle: 'dashed',
                    borderColor: (t) => alpha(t.palette.success.main, 0.24),
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Matches

function PublicMatchesView({
  allMatches,
  matchesLoading,
  currentMatches,
  teams,
  totalMw,
  currentMw,
  activeMw,
  selectedMw,
  onSelectMw,
}) {
  if (matchesLoading) {
    return (
      <Stack spacing={1.5}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={64} />
        ))}
      </Stack>
    );
  }
  if (allMatches.length === 0) return <EmptyContent title="Sin partidos" sx={{ py: 8 }} />;

  const matchweeks =
    totalMw > 0
      ? Array.from({ length: totalMw }, (_, i) => i + 1)
      : [...new Set(allMatches.map((m) => m.matchweek).filter(Boolean))].sort((a, b) => a - b);

  return (
    <Box>
      {/* Matchweek selector */}
      {matchweeks.length > 1 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {matchweeks.map((mw) => (
            <Chip
              key={mw}
              label={`J${mw}`}
              size="small"
              variant={activeMw === mw ? 'filled' : 'soft'}
              color={activeMw === mw ? 'primary' : 'default'}
              onClick={() => onSelectMw(mw)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <Chip
            label="Todos"
            size="small"
            variant={selectedMw === null ? 'filled' : 'soft'}
            color={selectedMw === null ? 'primary' : 'default'}
            onClick={() => onSelectMw(null)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      )}

      {/* Match cards */}
      <Stack spacing={1.5}>
        {currentMatches.length === 0 ? (
          <EmptyContent title="Sin partidos en esta jornada" sx={{ py: 4 }} />
        ) : (
          currentMatches.map((match) => (
            <PublicMatchRow key={match.id} match={match} teams={teams} />
          ))
        )}
      </Stack>
    </Box>
  );
}

function PublicMatchRow({ match, teams }) {
  const homeTeam = teams?.find((t) => t.id === match.home_team_id);
  const awayTeam = teams?.find((t) => t.id === match.away_team_id);
  const homeName = homeTeam?.name || 'TBD';
  const awayName = awayTeam?.name || 'TBD';

  const badge = STATUS_BADGE[match.status] || STATUS_BADGE.scheduled;
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const hasScore = isFinished || isLive;

  return (
    <Card sx={{ px: 2.5, py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Status badge */}
        <Chip
          label={badge.label}
          color={badge.color}
          size="small"
          variant="soft"
          sx={{ minWidth: 72, justifyContent: 'center' }}
        />

        {/* Match info */}
        <Stack direction="row" alignItems="center" spacing={1.5} flex={1} justifyContent="center">
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', flex: 1 }} noWrap>
            {homeName}
          </Typography>

          {hasScore ? (
            <Box
              sx={{
                px: 1.5,
                py: 0.25,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                minWidth: 56,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {match.score_home ?? 0} – {match.score_away ?? 0}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: 'text.disabled', minWidth: 40, textAlign: 'center' }}
            >
              vs
            </Typography>
          )}

          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'left', flex: 1 }} noWrap>
            {awayName}
          </Typography>
        </Stack>

        {/* Venue */}
        {match.venue && (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}
            noWrap
          >
            {match.venue}
          </Typography>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Top Scorers

function PublicTopScorers({ scorers, scorersLoading }) {
  if (scorersLoading) {
    return (
      <Card>
        <TableContainer>
          <Table>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }
  if (!scorers?.length) return <EmptyContent title="Sin goleadores" sx={{ py: 8 }} />;

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Jugador</TableCell>
              <TableCell>Equipo</TableCell>
              <TableCell align="center">
                <Iconify icon="mdi:soccer" width={18} sx={{ verticalAlign: 'middle' }} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scorers.map((scorer, idx) => (
              <TableRow key={scorer.player_id || idx} hover>
                <TableCell>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: idx < 3 ? 'warning.main' : 'text.primary' }}
                  >
                    {idx + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {scorer.player_name || scorer.name || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {scorer.team_name || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={scorer.goals ?? 0} size="small" color="primary" variant="soft" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
