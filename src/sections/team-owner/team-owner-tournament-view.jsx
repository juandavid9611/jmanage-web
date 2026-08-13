import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { useCountdownDate } from 'src/hooks/use-countdown';

import { useGetMyTeamOwnerTeams } from 'src/actions/me';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTeams,
  deletePlayer,
  useGetMatches,
  useGetPlayers,
  useGetBracket,
  useGetTournament,
} from 'src/actions/tournament';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { MatchList } from 'src/sections/tournament/match-row';
import { BracketView } from 'src/sections/tournament/bracket-view';
import { StatsOverview } from 'src/sections/tournament/stats-overview';
import { StandingsSidebar } from 'src/sections/tournament/standings-sidebar';
import { PlayerFormDialog } from 'src/sections/tournament/player-form-dialog';
import { MatchweekTimeline } from 'src/sections/tournament/matchweek-timeline';
import { PlayerRankingTable } from 'src/sections/tournament/player-ranking-table';
import { getPhases, TournamentBanner } from 'src/sections/tournament/tournament-banner';
import { DonationDashboardBanner } from 'src/sections/donation/donation-dashboard-banner';
import { TournamentConfigSummary } from 'src/sections/tournament/tournament-config-summary';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

function getDefaultPhase(tournament, teams, t) {
  const phases = getPhases(tournament, teams, undefined, undefined, t);
  const active = phases.find((p) => p.state === 'active');
  if (active) return active.key;
  const lastDone = [...phases].reverse().find((p) => p.state === 'done');
  if (lastDone) return lastDone.key;
  return phases[0]?.key || 'configuracion';
}

// ----------------------------------------------------------------------

/**
 * Inner view: shows a single tournament read-only for a team owner.
 * The owner's team is highlighted via highlightTeamId.
 */
function TournamentView({ tournamentId, highlightTeamId, initialPhase = null, onBack }) {
  const { t } = useTranslation();
  const [activePhase, setActivePhase] = useState(initialPhase);
  const [selectedMw, setSelectedMw] = useState(undefined);

  const { tournament, tournamentLoading } = useGetTournament(tournamentId);
  const { teams } = useGetTeams(tournamentId);
  const { matches: allMatches, matchesLoading } = useGetMatches(tournamentId);
  const { bracket, bracketLoading } = useGetBracket(tournamentId);
  const { players: myPlayers } = useGetPlayers(tournamentId, highlightTeamId);
  const myRoster = highlightTeamId ? { count: myPlayers?.length || 0, max: 30 } : undefined;

  const currentMw = tournament?.current_matchweek || 1;
  const totalMw =
    tournament?.rules?.total_matchweeks ||
    (allMatches.length > 0 ? Math.max(...allMatches.map((m) => m.matchweek || 0)) : 0);
  const activeMw = selectedMw === undefined ? currentMw : selectedMw;

  const currentMatches = useMemo(
    () => (activeMw === null ? allMatches : allMatches.filter((m) => m.matchweek === activeMw)),
    [allMatches, activeMw]
  );

  const currentPhase =
    activePhase || (tournament ? getDefaultPhase(tournament, teams, t) : 'configuracion');

  const isKnockoutPhase = currentPhase === 'eliminatorias';

  if (tournamentLoading) return <LoadingScreen />;

  if (!tournament) {
    return <EmptyContent title={t('label_tournament_not_found')} sx={{ py: 8 }} />;
  }

  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      {/* Team strip */}
      <TeamStrip
        tournament={tournament}
        teams={teams}
        highlightTeamId={highlightTeamId}
        onBack={onBack}
      />

      {/* Tournament banner with phase tabs (read-only — no edit controls) */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={(p) => setActivePhase(p)}
        publicMode
        myRoster={myRoster}
      />

      {/* Phase content */}
      <Box sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02), minHeight: 400 }}>
        {/* ── RESUMEN (configuracion) ── */}
        {currentPhase === 'configuracion' && (
          <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
            <StatsOverview tournamentId={tournamentId} tournament={tournament} />
            <TournamentConfigSummary tournament={tournament} />
          </Stack>
        )}

        {/* ── INSCRIPCIÓN: my team roster ── */}
        {currentPhase === 'inscripcion' && highlightTeamId && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <MyTeamRoster tournamentId={tournamentId} teamId={highlightTeamId} teams={teams} />
          </Box>
        )}

        {/* ── FASE GRUPOS: matches + standings ── */}
        {currentPhase === 'fase_grupos' && (
          <Grid container>
            <Grid
              xs={12}
              md={6}
              sx={{
                borderRight: (theme) => ({
                  md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                }),
              }}
            >
              {totalMw > 0 && (
                <MatchweekTimeline
                  totalMatchweeks={totalMw}
                  currentMatchweek={currentMw}
                  allMatches={allMatches}
                  selectedMatchweek={activeMw}
                  onSelect={(mw) => setSelectedMw(mw)}
                  onViewAll={() => setSelectedMw(null)}
                />
              )}

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                    {activeMw === null
                      ? t('label_all_matches')
                      : `${t('label_matchday')} ${activeMw}`}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                    }}
                  />
                </Stack>

                {matchesLoading ? (
                  <Stack spacing={0.75}>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={64} />
                    ))}
                  </Stack>
                ) : (
                  <MatchList
                    matches={currentMatches}
                    teams={teams}
                    tournamentId={tournamentId}
                    grouped
                    highlightTeamId={highlightTeamId}
                  />
                )}
              </Box>
            </Grid>

            <Grid xs={12} md={6}>
              <StandingsSidebar
                tournamentId={tournamentId}
                teams={teams}
                allMatches={allMatches}
                currentMatchweek={currentMw}
                totalMatchweeks={totalMw}
                highlightTeamId={highlightTeamId}
              />
            </Grid>
          </Grid>
        )}

        {/* ── FASE FINAL (bracket) ── */}
        {isKnockoutPhase && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BracketView
              tournamentId={tournamentId}
              teams={teams}
              tournament={tournament}
              allMatches={allMatches}
              readOnly
              bracket={bracket}
              bracketLoading={bracketLoading}
            />
          </Box>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {currentPhase === 'estadisticas' && (
          <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_top_scorers')}
              </Typography>
              <PlayerRankingTable
                tournamentId={tournamentId}
                metric="goals"
                highlightTeamId={highlightTeamId}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_assists')}
              </Typography>
              <PlayerRankingTable
                tournamentId={tournamentId}
                metric="assists"
                highlightTeamId={highlightTeamId}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_cautions')}
              </Typography>
              <PlayerRankingTable
                tournamentId={tournamentId}
                metric="cards"
                highlightTeamId={highlightTeamId}
              />
            </Box>
          </Stack>
        )}
      </Box>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

/**
 * Top strip showing the team owner's team info + tournament context.
 */
function TeamStrip({ tournament, teams, highlightTeamId, onBack }) {
  const { t } = useTranslation();
  const myTeam = teams?.find((team) => team.id === highlightTeamId);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 5 },
        py: 2,
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1}>
        {onBack && (
          <Button
            size="small"
            color="inherit"
            onClick={onBack}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={18} />}
            sx={{ mr: 1, flexShrink: 0 }}
          >
            {t('label_my_tournaments')}
          </Button>
        )}
        {/* Team logo + name */}
        {myTeam && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {myTeam.logo_url ? (
              <Avatar
                src={myTeam.logo_url}
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  border: (theme) => `2px solid ${theme.palette.primary.main}`,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: (theme) => `2px solid ${theme.palette.primary.main}`,
                }}
              >
                <Iconify icon="mdi:shield-half-full" width={24} sx={{ color: 'primary.main' }} />
              </Box>
            )}
            <Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {myTeam.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {t('label_my_team')}
              </Typography>
            </Stack>
          </Stack>
        )}

        {/* Divider */}
        {myTeam && (
          <Box
            sx={{
              width: '1px',
              height: 32,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.2),
              alignSelf: 'stretch',
              display: { xs: 'none', sm: 'block' },
            }}
          />
        )}

        {/* Tournament info */}
        <Stack>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {tournament?.name}
          </Typography>
          {tournament?.start_date && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {tournament.start_date}
              {tournament.end_date ? ` — ${tournament.end_date}` : ''}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const POSITION_LABEL = {
  Goalkeeper: 'position_goalkeeper',
  Defender: 'position_defender',
  Midfielder: 'position_midfielder',
  Forward: 'position_forward',
};
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const POSITION_COLOR = {
  Goalkeeper: 'warning',
  Defender: 'info',
  Midfielder: 'success',
  Forward: 'error',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Player card with avatar, jersey number, position pill, and three-dot menu.
 */
function PlayerRow({ player, onEdit, onDelete }) {
  const { t } = useTranslation();
  const popover = usePopover();
  const hasPhoto = !!player.avatar_url;
  const positionColor = POSITION_COLOR[player.position] || 'primary';
  const positionLabel = POSITION_LABEL[player.position]
    ? t(POSITION_LABEL[player.position])
    : player.position;

  return (
    <Box
      sx={{
        position: 'relative',
        p: 1.5,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        bgcolor: 'background.paper',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
          boxShadow: (theme) => theme.customShadows?.z8 || '0 4px 12px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {/* Avatar with jersey number badge */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={player.avatar_url}
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: (theme) => alpha(theme.palette[positionColor].main, 0.12),
              color: `${positionColor}.dark`,
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {!hasPhoto && getInitials(player.name)}
          </Avatar>
          {player.number != null && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                minWidth: 22,
                height: 22,
                px: 0.6,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: (theme) => `1.5px solid ${theme.palette.text.primary}`,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.7rem',
                lineHeight: 1,
              }}
            >
              {player.number}
            </Box>
          )}
        </Box>

        {/* Identity stack */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }} noWrap>
            {player.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
            {positionLabel && (
              <Label variant="soft" color={positionColor} sx={{ height: 20 }}>
                {positionLabel}
              </Label>
            )}
          </Stack>
          {player.id_number && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
              ID: {player.id_number}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <IconButton
          size="small"
          onClick={popover.onOpen}
          sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
        >
          <Iconify icon="eva:more-vertical-fill" width={18} />
        </IconButton>
      </Stack>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit(player);
          }}
          sx={{ fontSize: 13 }}
        >
          <Iconify icon="solar:pen-bold" width={16} sx={{ mr: 1 }} />
          {t('edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete(player);
          }}
          sx={{ fontSize: 13, color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={16} sx={{ mr: 1 }} />
          {t('delete')}
        </MenuItem>
      </CustomPopover>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * My team's player roster with CRUD affordances for team owners.
 */
function MyTeamRoster({ tournamentId, teamId, teams }) {
  const { t } = useTranslation();
  const myTeam = teams?.find((team) => team.id === teamId);
  const { players, playersLoading } = useGetPlayers(tournamentId, teamId);

  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [deletePlayer_, setDeletePlayer_] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = useCallback((p) => setEditPlayer(p), []);
  const handleDelete = useCallback((p) => setDeletePlayer_(p), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletePlayer_) return;
    setDeleting(true);
    try {
      await deletePlayer(tournamentId, deletePlayer_.id);
      toast.success(t('label_player_deleted'));
      setDeletePlayer_(null);
    } catch (err) {
      toast.error(err?.message || t('label_error_deleting_player'));
    } finally {
      setDeleting(false);
    }
  }, [tournamentId, deletePlayer_, t]);

  if (!myTeam) return null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">
          {t('label_roster')} — {myTeam.name}
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={() => setAddOpen(true)}
        >
          {t('label_add_player')}
        </Button>
      </Stack>

      {playersLoading ? (
        <Stack spacing={0.75}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={40} />
          ))}
        </Stack>
      ) : !players?.length ? (
        <EmptyContent title={t('label_no_players_registered')} sx={{ py: 4 }} />
      ) : (
        <Stack spacing={3}>
          {POSITION_ORDER.map((position) => {
            const group = players.filter((p) => p.position === position);
            if (group.length === 0) return null;
            return (
              <Box key={position}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t(POSITION_LABEL[position])}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {group.length}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                    }}
                  />
                </Stack>
                <Box
                  display="grid"
                  gap={1}
                  gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
                >
                  {group.map((p) => (
                    <PlayerRow key={p.id} player={p} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </Box>
              </Box>
            );
          })}
          {(() => {
            const other = players.filter((p) => !POSITION_ORDER.includes(p.position));
            if (other.length === 0) return null;
            return (
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('label_no_position')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {other.length}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                    }}
                  />
                </Stack>
                <Box
                  display="grid"
                  gap={1}
                  gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
                >
                  {other.map((p) => (
                    <PlayerRow key={p.id} player={p} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </Box>
              </Box>
            );
          })()}
        </Stack>
      )}

      {/* Add player dialog */}
      <PlayerFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tournamentId={tournamentId}
        teamId={teamId}
      />

      {/* Edit player dialog */}
      <PlayerFormDialog
        open={!!editPlayer}
        onClose={() => setEditPlayer(null)}
        tournamentId={tournamentId}
        teamId={teamId}
        currentPlayer={editPlayer}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deletePlayer_}
        onClose={() => setDeletePlayer_(null)}
        title={t('label_delete_player')}
        content={`${t('label_confirm_delete_player_prefix')} ${deletePlayer_?.name}? ${t('label_action_cannot_be_undone')}`}
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            {t('delete')}
          </LoadingButton>
        }
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  draft: 'default',
  active: 'success',
  in_progress: 'success',
  completed: 'info',
  archived: 'default',
};

const STATUS_LABELS = {
  draft: 'Borrador',
  active: 'En progreso',
  in_progress: 'En progreso',
  completed: 'Finalizado',
  archived: 'Archivado',
};

function getFirstName(user) {
  const raw = user?.name?.trim();
  if (raw) return raw.split(' ')[0];
  const email = user?.email;
  if (email) {
    const local = email.split('@')[0]?.split('+')[0] || '';
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return '';
}

/**
 * Team owner welcome landing — greeting + one rich card per managed team.
 */
function TeamOwnerWelcome({ teams, onEnter }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const firstName = getFirstName(user);

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <DonationDashboardBanner />

        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {t('label_welcome')}
            {firstName ? `, ${firstName}` : ''} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {teams.length === 1
              ? t('label_this_is_team_you_manage_today')
              : t('label_these_are_teams_you_manage_today')}
          </Typography>
        </Box>

        <Stack spacing={3}>
          {teams.map((entry) => (
            <RichTeamCard key={entry.tournament_team_id} entry={entry} onEnter={onEnter} />
          ))}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}

function formatDate(date) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
}

function RichTeamCard({ entry, onEnter }) {
  const { t } = useTranslation();
  const { tournament } = useGetTournament(entry.tournament_id);
  const { teams: tournamentTeams } = useGetTeams(entry.tournament_id);
  const { players } = useGetPlayers(entry.tournament_id, entry.tournament_team_id);

  const startDate = tournament?.start_date;
  const drawDate = tournament?.group_draw_date || tournament?.rules?.group_draw_date;
  const sport = tournament?.sport;
  const city = tournament?.city;

  const playerCount = players?.length ?? 0;
  const ROSTER_MAX = 30;
  const rosterDone = playerCount >= ROSTER_MAX;

  const otherTeams = (tournamentTeams || []).filter((team) => team.id !== entry.tournament_team_id);
  const myTeam = (tournamentTeams || []).find((team) => team.id === entry.tournament_team_id);

  return (
    <Card>
      {/* Header */}
      <CardContent sx={{ pb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Avatar
                variant="rounded"
                src={myTeam?.logo_url || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }}
              >
                <Iconify icon="mdi:shield-half-full" width={32} />
              </Avatar>
              <Avatar
                variant="rounded"
                src={tournament?.logo_url || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                }}
              >
                <Iconify icon="mdi:trophy-outline" width={28} />
              </Avatar>
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {entry.team_name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {t('label_your_team_in')} <strong>{entry.tournament_name}</strong>
              </Typography>
            </Box>
          </Stack>

          <Button
            disableElevation
            onClick={() => onEnter(entry, 'configuracion')}
            endIcon={<Iconify icon="solar:arrow-right-bold" width={16} />}
            sx={{
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'center' },
              px: 2.5,
              py: 1,
              borderRadius: 1.5,
              fontWeight: 700,
              color: 'primary.dark',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            {t('label_enter_tournament')}
          </Button>
        </Stack>

        {/* Stats row */}
        <Stack
          direction="row"
          spacing={3}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2.5, color: 'text.secondary' }}
        >
          {sport && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="mdi:soccer" width={16} />
              <Typography variant="body2">{sport}</Typography>
            </Stack>
          )}
          {city && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:map-point-bold" width={16} />
              <Typography variant="body2">{city}</Typography>
            </Stack>
          )}
          {startDate && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:calendar-bold" width={16} />
              <Typography variant="body2">
                {t('label_starts')} {formatDate(startDate)}
              </Typography>
            </Stack>
          )}
          {drawDate && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="mdi:dice-multiple" width={16} />
              <Typography variant="body2">
                {t('label_draw')} {formatDate(drawDate)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      {startDate && new Date(startDate) > new Date() && (
        <TournamentCountdown targetDate={new Date(startDate)} />
      )}

      <Divider />

      {/* Próximos pasos + Equipos participantes — side-by-side on md+ */}
      <Grid container>
        <Grid
          xs={12}
          md={otherTeams.length > 0 ? 7 : 12}
          sx={{
            borderRight: (theme) => ({
              md:
                otherTeams.length > 0
                  ? `1px solid ${alpha(theme.palette.grey[500], 0.12)}`
                  : 'none',
            }),
          }}
        >
          <CardContent sx={{ pb: 2 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}
            >
              {t('label_next_steps')}
            </Typography>
            <Stack spacing={1.25}>
              <ChecklistItem done label={t('label_accepted_invitation')} />
              <ChecklistItem
                done={rosterDone}
                label={t('label_confirm_your_roster')}
                hint={`${playerCount}/${ROSTER_MAX} ${t('label_players_lowercase')}`}
                progress={{ value: playerCount, max: ROSTER_MAX }}
                actionLabel={rosterDone ? undefined : t('label_register')}
                onAction={rosterDone ? undefined : () => onEnter(entry, 'inscripcion')}
              />
              <ChecklistItem
                done={false}
                label={t('label_wait_for_group_draw')}
                hint={drawDate ? formatDate(drawDate) : t('label_soon')}
              />
            </Stack>
          </CardContent>
        </Grid>

        {otherTeams.length > 0 && (
          <Grid
            xs={12}
            md={5}
            sx={{
              borderTop: (theme) => ({
                xs: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                md: 'none',
              }),
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.disabled', display: 'block', mb: 1 }}
              >
                {t('label_participating_teams')} ({otherTeams.length + 1})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={entry.team_name}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
                {otherTeams.map((team) => (
                  <Chip key={team.id} size="small" label={team.name} variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Grid>
        )}
      </Grid>
    </Card>
  );
}

function TournamentCountdown({ targetDate }) {
  const { t } = useTranslation();
  const countdown = useCountdownDate(targetDate);

  return (
    <>
      <Divider />
      <Box sx={{ px: 3, py: 2.5, textAlign: 'center' }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.disabled', letterSpacing: 2, display: 'block', mb: 1.5 }}
        >
          {t('label_tournament_starts_in')}
        </Typography>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="baseline"
          divider={
            <Box sx={{ mx: { xs: 1, sm: 1.5 }, color: 'text.disabled', typography: 'h4' }}>:</Box>
          }
          sx={{ typography: { xs: 'h4', sm: 'h3' } }}
        >
          <TimeBlock value={countdown.days} label={t('label_days_abbr')} />
          <TimeBlock value={countdown.hours} label={t('label_hours_abbr')} />
          <TimeBlock value={countdown.minutes} label={t('label_minutes_abbr')} />
          <TimeBlock value={countdown.seconds} label={t('label_seconds_abbr')} />
        </Stack>
      </Box>
    </>
  );
}

function TimeBlock({ value, label }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 48 }}>
      <Box sx={{ fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ChecklistItem({ done, label, hint, actionLabel, onAction, progress }) {
  const pct = progress ? Math.min(100, Math.round((progress.value / progress.max) * 100)) : null;
  return (
    <Stack direction="row" alignItems={progress ? 'flex-start' : 'center'} spacing={1.5}>
      <Iconify
        icon={done ? 'solar:check-circle-bold' : 'solar:check-circle-line-duotone'}
        width={20}
        sx={{
          color: done ? 'success.main' : 'text.disabled',
          flexShrink: 0,
          mt: progress ? 0.25 : 0,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {hint}
          </Typography>
        )}
        {progress && (
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              mt: 0.75,
              height: 6,
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                bgcolor: done ? 'success.main' : 'primary.main',
              },
            }}
          />
        )}
      </Box>
      {!done && actionLabel && onAction && (
        <Button size="small" color="inherit" onClick={onAction} sx={{ flexShrink: 0 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

/**
 * Root view: resolves the team owner's tournament(s) and renders the appropriate UI.
 */
export function TeamOwnerTournamentView() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const { teams, teamsLoading } = useGetMyTeamOwnerTeams();

  if (teamsLoading) return <LoadingScreen />;

  if (!teams?.length) {
    return (
      <DashboardContent>
        <Stack spacing={3}>
          <DonationDashboardBanner />
          <EmptyContent
            title={t('label_no_tournament_assigned')}
            description={t('label_no_tournament_assigned_desc')}
            sx={{ py: 10 }}
          />
        </Stack>
      </DashboardContent>
    );
  }

  if (selected) {
    return (
      <TournamentView
        tournamentId={selected.entry.tournament_id}
        highlightTeamId={selected.entry.tournament_team_id}
        initialPhase={selected.initialPhase}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <TeamOwnerWelcome
      teams={teams}
      onEnter={(entry, initialPhase) => setSelected({ entry, initialPhase })}
    />
  );
}
