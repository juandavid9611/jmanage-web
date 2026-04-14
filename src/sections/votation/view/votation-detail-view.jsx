import { toast } from 'sonner';
import { useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetUsers } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetVotation,
  castVote as apiCastVote,
  closeVotation as apiCloseVotation,
  deleteVotation as apiDeleteVotation,
  createTiebreaker as apiCreateTiebreaker,
} from 'src/actions/votation';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const PODIUM_COLORS = {
  0: { border: '#FFD700', label: '🥇 1°' },
  1: { border: '#C0C0C0', label: '🥈 2°' },
  2: { border: '#CD7F32', label: '🥉 3°' },
};

// ----------------------------------------------------------------------

export function VotationDetailView() {
  const { votationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';

  const confirmDelete = useBoolean();

  const { votation, votationLoading, revalidate } = useGetVotation(votationId, selectedWorkspace?.id);

  const monthLabelText = state?.monthLabel || votation?.month || '';

  const myVote = votation?.votes?.[user?.sub];

  const totalVotes = votation ? Object.keys(votation.votes || {}).length : 0;

  const getVotesForCandidate = useCallback(
    (candidateId) =>
      votation
        ? Object.values(votation.votes || {}).filter((v) => v === candidateId).length
        : 0,
    [votation]
  );

  const { users } = useGetUsers(isAdmin ? selectedWorkspace : null);

  const voterMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => { map[u.id] = u; });
    return map;
  }, [users]);

  const getVotersForCandidate = useCallback(
    (candidateId) =>
      Object.entries(votation?.votes || {})
        .filter(([, cid]) => cid === candidateId)
        .map(([vid]) => voterMap[vid])
        .filter(Boolean),
    [votation, voterMap]
  );

  const handleVote = useCallback(
    async (candidateId) => {
      if (!votation) return;
      try {
        await apiCastVote(votationId, candidateId, selectedWorkspace?.id);
        await revalidate();
        toast.success(myVote ? 'Voto actualizado' : 'Voto registrado');
      } catch {
        toast.error('Error al registrar el voto');
      }
    },
    [votation, myVote, votationId, selectedWorkspace?.id, revalidate]
  );

  const handleClose = useCallback(async () => {
    if (!votation) return;
    try {
      await apiCloseVotation(votationId, selectedWorkspace?.id);
      await revalidate();
      toast.success('Votación cerrada');
    } catch {
      toast.error('Error al cerrar la votación');
    }
  }, [votation, votationId, selectedWorkspace?.id, revalidate]);

  const handleCreateTiebreaker = useCallback(async () => {
    try {
      const created = await apiCreateTiebreaker(votationId, selectedWorkspace?.id);
      toast.success('Ronda de desempate creada');
      navigate(paths.dashboard.votaciones.detail(created.id));
    } catch {
      toast.error('Error al crear la ronda de desempate');
    }
  }, [votationId, selectedWorkspace?.id, navigate]);

  const handleDelete = useCallback(async () => {
    try {
      await apiDeleteVotation(votationId, selectedWorkspace?.id);
      toast.success('Votación eliminada');
      navigate(paths.dashboard.votaciones.root);
    } catch {
      toast.error('Error al eliminar la votación');
    } finally {
      confirmDelete.onFalse();
    }
  }, [votationId, selectedWorkspace?.id, navigate, confirmDelete]);

  if (votationLoading) {
    return (
      <DashboardContent>
        <EmptyContent title="Cargando votación..." sx={{ py: 8 }} />
      </DashboardContent>
    );
  }

  if (!votation) {
    return (
      <DashboardContent>
        <EmptyContent title="Votación no encontrada" sx={{ py: 8 }} />
      </DashboardContent>
    );
  }

  const isOpen = votation.status === 'open';
  const isClosed = votation.status === 'closed';
  const isTied = votation.status === 'tied';

  const sortedCandidates =
    isClosed || isTied || (isOpen && isAdmin)
      ? [...votation.candidates].sort(
          (a, b) => getVotesForCandidate(b.id) - getVotesForCandidate(a.id)
        )
      : votation.candidates;

  const showResults = isClosed || isTied;
  const podiumCandidates = showResults ? sortedCandidates.slice(0, 3) : [];
  const remainingCandidates = showResults ? sortedCandidates.slice(3) : [];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Jugador del mes — ${monthLabelText}`}
        links={[
          { name: 'Votaciones', href: paths.dashboard.votaciones.root },
          { name: 'Votación' },
        ]}
        action={
          isAdmin ? (
            <Stack direction="row" spacing={1}>
              {isOpen && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Iconify icon="solar:lock-bold" />}
                  onClick={handleClose}
                >
                  Cerrar Votación
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={confirmDelete.onTrue}
              >
                Eliminar
              </Button>
            </Stack>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Tiebreaker context banner — shown on a child tiebreaker votation */}
      {votation.parent_votation_id && (
        <Card
          sx={{
            mb: 3,
            px: 2,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: (t) => `1px solid ${alpha(t.palette.info.main, 0.24)}`,
            bgcolor: (t) => alpha(t.palette.info.main, 0.04),
            cursor: 'pointer',
          }}
          onClick={() => navigate(paths.dashboard.votaciones.detail(votation.parent_votation_id))}
        >
          <Iconify icon="solar:info-circle-bold" width={16} sx={{ color: 'info.main', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>
            Ronda de desempate
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            · Ver votación original
          </Typography>
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled', ml: 'auto' }} />
        </Card>
      )}

      {/* Status bar */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Label
          color={isOpen ? 'success' : isTied ? 'warning' : 'default'}
          sx={{ fontSize: '0.75rem', px: 1.5, py: 0.75 }}
        >
          {isOpen ? 'Abierta' : isTied ? 'Empate' : 'Cerrada'}
        </Label>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Asistencia mínima: <strong>{votation.min_pct}%</strong>
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} registrados
        </Typography>
        {myVote && (
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Iconify icon="eva:checkmark-circle-2-fill" width={16} sx={{ color: 'success.main' }} />
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
              Tu voto ha sido registrado
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Winner banner */}
      {isClosed && votation.winner_id && (
        <WinnerBanner
          winner={votation.candidates.find((c) => c.id === votation.winner_id)}
          votes={getVotesForCandidate(votation.winner_id)}
          totalVotes={totalVotes}
        />
      )}

      {/* Tie banner */}
      {isTied && (
        <TieBanner
          votation={votation}
          candidates={votation.candidates.filter((c) =>
            (votation.tied_candidate_ids || []).includes(c.id)
          )}
          getVotes={getVotesForCandidate}
          isAdmin={isAdmin}
          onCreateTiebreaker={handleCreateTiebreaker}
          onViewTiebreaker={() =>
            navigate(paths.dashboard.votaciones.detail(votation.tiebreaker_votation_id))
          }
        />
      )}

      {/* Closed/Tied: votes chart + podium side by side */}
      {showResults && sortedCandidates.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
            Resultados
          </Typography>

          <Grid container spacing={3} alignItems="stretch">
            {/* Left: horizontal bar chart */}
            <Grid xs={12} md={7}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                  {sortedCandidates.map((candidate, idx) => {
                    const votes = getVotesForCandidate(candidate.id);
                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isWinnerRow = candidate.id === votation.winner_id;
                    return (
                      <Box key={candidate.id}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.75 }}>
                          <Typography
                            variant="caption"
                            sx={{ width: 20, fontWeight: 700, color: 'text.disabled', flexShrink: 0, textAlign: 'right' }}
                          >
                            {idx + 1}
                          </Typography>
                          <Avatar
                            src={candidate.avatar_url}
                            alt={candidate.name}
                            sx={{ width: 28, height: 28, fontSize: '0.75rem', flexShrink: 0 }}
                          >
                            {candidate.name?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={isWinnerRow ? 700 : 500} noWrap>
                              {candidate.name}
                            </Typography>
                            <Stack direction="row" spacing={1.5}>
                              <Tooltip title="Asistencia entrenamientos">
                                <Stack direction="row" alignItems="center" spacing={0.4}>
                                  <Iconify icon="solar:dumbbell-bold" width={12} sx={{ color: 'text.disabled' }} />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      color:
                                        candidate.training_pct >= 80
                                          ? 'success.main'
                                          : candidate.training_pct >= 50
                                            ? 'warning.main'
                                            : 'error.main',
                                    }}
                                  >
                                    {candidate.training_pct}%
                                  </Typography>
                                </Stack>
                              </Tooltip>
                              {candidate.match_pct != null && (
                                <Tooltip title="Asistencia partidos">
                                  <Stack direction="row" alignItems="center" spacing={0.4}>
                                    <Iconify icon="solar:football-bold" width={12} sx={{ color: 'text.disabled' }} />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '0.68rem',
                                        color:
                                          candidate.match_pct >= 80
                                            ? 'success.main'
                                            : candidate.match_pct >= 50
                                              ? 'warning.main'
                                              : 'error.main',
                                      }}
                                    >
                                      {candidate.match_pct}%
                                    </Typography>
                                  </Stack>
                                </Tooltip>
                              )}
                            </Stack>
                          </Box>
                          <Typography variant="caption" fontWeight={700} sx={{ flexShrink: 0, color: isWinnerRow ? 'warning.main' : 'text.secondary' }}>
                            {votes} {votes === 1 ? 'voto' : 'votos'} · {pct}%
                          </Typography>
                          {isWinnerRow && (
                            <Iconify icon="solar:cup-star-bold" width={16} sx={{ color: 'warning.main', flexShrink: 0 }} />
                          )}
                        </Stack>
                        <Box sx={{ pl: '44px' }}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={isWinnerRow ? 'warning' : 'primary'}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                            }}
                          />
                          {isAdmin && (
                            <VoterChips voters={getVotersForCandidate(candidate.id)} />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Card>
            </Grid>

            {/* Right: Olympic podium */}
            {podiumCandidates.length > 0 && (
              <Grid xs={12} md={5}>
                <Card sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <PodiumView
                    candidates={podiumCandidates}
                    getVotes={getVotesForCandidate}
                    totalVotes={totalVotes}
                  />
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Closed/Tied: remaining candidates (4th+) */}
      {showResults && remainingCandidates.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Otros candidatos
          </Typography>
          <Grid container spacing={2}>
            {remainingCandidates.map((candidate) => {
              const votes = getVotesForCandidate(candidate.id);
              const voteBarWidth = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              return (
                <Grid key={candidate.id} xs={12} sm={6} md={4}>
                  <CandidateCard
                    candidate={candidate}
                    votes={votes}
                    voteBarWidth={voteBarWidth}
                    isWinner={false}
                    isMyVote={myVote === candidate.id}
                    isClosed={showResults}
                    isOpen={false}
                    isAdmin={isAdmin}
                    myVote={myVote}
                    onVote={handleVote}
                    voters={isAdmin ? getVotersForCandidate(candidate.id) : []}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Open: candidate grid for voting */}
      {isOpen && (
        <Grid container spacing={2.5}>
          {sortedCandidates.map((candidate) => {
            const votes = getVotesForCandidate(candidate.id);
            const voteBarWidth = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            return (
              <Grid key={candidate.id} xs={12} sm={6} md={4}>
                <CandidateCard
                  candidate={candidate}
                  votes={votes}
                  voteBarWidth={voteBarWidth}
                  isWinner={false}
                  isMyVote={myVote === candidate.id}
                  isClosed={false}
                  isOpen={isOpen}
                  isAdmin={isAdmin}
                  myVote={myVote}
                  onVote={handleVote}
                  voters={isAdmin ? getVotersForCandidate(candidate.id) : []}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Eliminar votación"
        content="¿Eliminar esta votación? Esta acción no se puede deshacer."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function PodiumView({ candidates, getVotes, totalVotes }) {
  // Olympic order: 2nd | 1st | 3rd
  const order = candidates.length >= 3
    ? [candidates[1], candidates[0], candidates[2]]
    : candidates.length === 2
      ? [candidates[1], candidates[0]]
      : [candidates[0]];

  const heights = { 0: 180, 1: 140, 2: 110 };
  const orderMap = candidates.length >= 3
    ? [1, 0, 2]
    : candidates.length === 2
      ? [1, 0]
      : [0];

  return (
    <Stack direction="row" alignItems="flex-end" justifyContent="center" spacing={2} sx={{ py: 2 }}>
      {order.map((candidate, displayIdx) => {
        if (!candidate) return null;
        const rankIdx = orderMap[displayIdx]; // 0=1st, 1=2nd, 2=3rd
        const votes = getVotes(candidate.id);
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const podiumColor = PODIUM_COLORS[rankIdx];
        const podiumHeight = heights[rankIdx];

        return (
          <Stack
            key={candidate.id}
            alignItems="center"
            spacing={1}
            sx={{ minWidth: 120, maxWidth: 160 }}
          >
            {/* Avatar + name above podium block */}
            <Stack alignItems="center" spacing={0.75}>
              <Avatar
                src={candidate.avatar_url}
                alt={candidate.name}
                sx={{
                  width: rankIdx === 0 ? 72 : 56,
                  height: rankIdx === 0 ? 72 : 56,
                  fontSize: rankIdx === 0 ? '1.4rem' : '1.1rem',
                  border: `3px solid ${podiumColor.border}`,
                  boxShadow: `0 0 0 4px ${alpha(podiumColor.border, 0.2)}`,
                }}
              >
                {candidate.name?.charAt(0)}
              </Avatar>
              <Typography variant={rankIdx === 0 ? 'subtitle1' : 'body2'} fontWeight={700} textAlign="center" sx={{ px: 0.5 }}>
                {candidate.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {votes} voto{votes !== 1 ? 's' : ''} · {pct}%
              </Typography>
            </Stack>

            {/* Podium block */}
            <Box
              sx={{
                width: '100%',
                height: podiumHeight,
                borderRadius: '8px 8px 0 0',
                background: (t) =>
                  `linear-gradient(180deg, ${alpha(podiumColor.border, 0.18)} 0%, ${alpha(podiumColor.border, 0.08)} 100%)`,
                border: `2px solid ${alpha(podiumColor.border, 0.4)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant={rankIdx === 0 ? 'h4' : 'h5'} sx={{ color: podiumColor.border, fontWeight: 800 }}>
                {podiumColor.label}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function AttendanceRow({ icon, label, pct }) {
  const color = pct >= 80 ? 'success.main' : pct >= 50 ? 'warning.main' : 'error.main';
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Iconify icon={icon} width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', width: 90, flexShrink: 0 }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1,
          height: 5,
          borderRadius: 1,
          bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
          '& .MuiLinearProgress-bar': { bgcolor: color },
        }}
      />
      <Typography variant="caption" fontWeight={700} sx={{ color, width: 34, textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </Typography>
    </Stack>
  );
}

function StatChip({ icon, label, value, color = 'text.secondary' }) {
  return (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 40 }}>
      <Iconify icon={icon} width={16} sx={{ color }} />
      <Typography variant="caption" fontWeight={700} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', lineHeight: 1 }}>
        {label}
      </Typography>
    </Stack>
  );
}

function CandidateCard({ candidate, votes, voteBarWidth, isWinner, isMyVote, isClosed, isOpen, isAdmin, myVote, onVote, voters }) {
  const matchPct = candidate.match_pct ?? 0;
  const mvpCount = candidate.mvp ?? 0;

  return (
    <Card
      sx={{
        p: 2.5,
        border: (t) =>
          `1.5px solid ${
            isWinner
              ? t.palette.warning.main
              : isMyVote
                ? t.palette.primary.main
                : alpha(t.palette.grey[500], 0.12)
          }`,
        boxShadow: isWinner ? (t) => `0 0 0 4px ${alpha(t.palette.warning.main, 0.08)}` : 'none',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      {isWinner && (
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Label color="warning">Ganador</Label>
        </Box>
      )}
      {isMyVote && !isWinner && (
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Label color="primary">Tu voto</Label>
        </Box>
      )}

      <Stack spacing={1.75}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={candidate.avatar_url}
            alt={candidate.name}
            sx={{ width: 44, height: 44, fontSize: '1rem', flexShrink: 0 }}
          >
            {candidate.name?.charAt(0)}
          </Avatar>
          <Typography variant="subtitle1" noWrap fontWeight={700} sx={{ pr: isWinner || isMyVote ? 5 : 0 }}>
            {candidate.name}
          </Typography>
        </Stack>

        {/* Attendance rows */}
        <Stack spacing={0.6}>
          <AttendanceRow icon="solar:dumbbell-bold" label="Entrenamientos" pct={candidate.training_pct} />
          <AttendanceRow icon="solar:running-round-bold" label="Partidos" pct={matchPct} />
        </Stack>

        {/* Performance stats */}
        <Stack direction="row" spacing={1.5} sx={{ pt: 0.25 }}>
          <StatChip icon="solar:football-bold" label="Goles" value={candidate.goals || 0} />
          <StatChip icon="mdi:shoe-cleat" label="Asist." value={candidate.assists || 0} />
          {mvpCount > 0 && (
            <StatChip
              icon="solar:medal-ribbons-star-bold"
              label="MVP"
              value={mvpCount}
              color="warning.main"
            />
          )}
        </Stack>

        <Divider />

        {/* Vote bar (closed always; open only for admins) */}
        {(isClosed || (isOpen && isAdmin)) && (
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Votos
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {votes}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={voteBarWidth}
              color={isWinner ? 'warning' : 'primary'}
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
              }}
            />
            {isAdmin && <VoterChips voters={voters} />}
          </Box>
        )}

        {/* Vote button (open only) */}
        {isOpen && (
          <Button
            variant={isMyVote ? 'contained' : 'outlined'}
            color={isMyVote ? 'success' : 'primary'}
            size="small"
            fullWidth
            disabled={isMyVote}
            onClick={() => onVote(candidate.id)}
            startIcon={
              isMyVote ? (
                <Iconify icon="eva:checkmark-fill" />
              ) : (
                <Iconify icon="solar:cup-star-bold" />
              )
            }
          >
            {isMyVote ? 'Votado' : 'Votar'}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function TieBanner({ votation, candidates, getVotes, isAdmin, onCreateTiebreaker, onViewTiebreaker }) {
  const votes = candidates.length > 0 ? getVotes(candidates[0].id) : 0;
  const hasTiebreaker = !!votation.tiebreaker_votation_id;

  return (
    <Card
      sx={{
        mb: 4,
        p: 3,
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.08)} 0%, ${alpha(t.palette.warning.light, 0.04)} 100%)`,
        border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.24)}`,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="solar:danger-triangle-bold" width={36} sx={{ color: 'warning.main', flexShrink: 0 }} />
          <Box>
            <Typography variant="overline" sx={{ color: 'warning.main', letterSpacing: 1.5, lineHeight: 1 }}>
              Empate — Desempate necesario
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              {candidates.map((c) => (
                <Stack key={c.id} direction="row" alignItems="center" spacing={0.75}>
                  <Avatar
                    src={c.avatar_url}
                    alt={c.name}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.8rem',
                      border: (t) => `2px solid ${t.palette.warning.main}`,
                    }}
                  >
                    {c.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {votes} {votes === 1 ? 'voto' : 'votos'}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>

        {hasTiebreaker ? (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            onClick={onViewTiebreaker}
            sx={{ flexShrink: 0 }}
          >
            Ver desempate
          </Button>
        ) : isAdmin && (
          <Button
            variant="contained"
            color="warning"
            size="small"
            startIcon={<Iconify icon="solar:cup-star-bold" />}
            onClick={onCreateTiebreaker}
            sx={{ flexShrink: 0 }}
          >
            Iniciar desempate
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function VoterChips({ voters }) {
  if (!voters?.length) return null;
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
      {voters.map((voter) => (
        <Tooltip key={voter.id} title={voter.name}>
          <Chip
            avatar={<Avatar src={voter.avatarUrl}>{voter.name?.charAt(0)}</Avatar>}
            label={voter.name}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.68rem' }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function WinnerBanner({ winner, votes, totalVotes }) {
  if (!winner) return null;

  return (
    <Card
      sx={{
        mb: 4,
        p: 3,
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.08)} 0%, ${alpha(t.palette.warning.light, 0.04)} 100%)`,
        border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.24)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2.5}>
        <Iconify icon="solar:cup-star-bold" width={40} sx={{ color: 'warning.main', flexShrink: 0 }} />

        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          <Avatar
            src={winner.avatar_url}
            alt={winner.name}
            sx={{
              width: 56,
              height: 56,
              fontSize: '1.3rem',
              flexShrink: 0,
              border: (t) => `2px solid ${t.palette.warning.main}`,
            }}
          >
            {winner.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="overline" sx={{ color: 'warning.main', letterSpacing: 1.5, lineHeight: 1 }}>
              Jugador del mes
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {winner.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {votes} de {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} ·{' '}
              {winner.training_pct}% asistencia
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}
