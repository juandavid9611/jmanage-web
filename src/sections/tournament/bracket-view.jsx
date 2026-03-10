import { useNavigate } from 'react-router-dom';
import { useMemo, Fragment, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import {
  createMatch,
  useGetBracket,
  generateBracket,
  updateBracketSlot,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ── Layout constants ──────────────────────────────────────────────────

const CARD_H   = 122;   // match card height px
const CARD_GAP = 20;    // gap between cards in same round
const COL_W    = 252;   // column width px
const COL_GAP  = 56;    // gap between columns (connector SVG width)
const HEADER_H = 48;    // round header row height

// ── Static maps ───────────────────────────────────────────────────────

const ROUND_ORDER = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals', 'final'];

const ROUND_LABELS = {
  roundOf32:    'Dieciseisavos',
  roundOf16:    'Octavos',
  quarterFinals:'Cuartos',
  semiFinals:   'Semifinales',
  final:        'Gran Final',
};

const ROUND_SHORT = {
  roundOf32:    '32',
  roundOf16:    '16',
  quarterFinals:'QF',
  semiFinals:   'SF',
  final:        'GF',
};

const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ── BracketView ───────────────────────────────────────────────────────

export function BracketView({ tournamentId, teams, tournament, allMatches = [] }) {
  const navigate  = useNavigate();
  const { bracket, bracketLoading } = useGetBracket(tournamentId);

  const [generateDialog, setGenerateDialog] = useState({ open: false, source: null });
  const [isGenerating, setIsGenerating] = useState(false);

  const isHybrid  = tournament?.type === 'hybrid';
  const hasGroups = tournament?.groups?.length > 0;
  const canGenerate =
    tournament?.status === 'active' && (tournament?.type === 'knockout' || isHybrid);

  // Build ordered round entries from bracket object
  const roundEntries = useMemo(() => {
    if (!bracket || typeof bracket !== 'object') return [];
    const known   = ROUND_ORDER.filter((k) => bracket[k] && Array.isArray(bracket[k]));
    const unknown = Object.keys(bracket).filter(
      (k) => !ROUND_ORDER.includes(k) && Array.isArray(bracket[k])
    );
    return [...known, ...unknown].map((key) => ({
      key,
      label:    ROUND_LABELS[key] || key,
      matchups: bracket[key],
    }));
  }, [bracket]);

  const hasRounds = roundEntries.length > 0;

  // Fast match lookup by id
  const matchMap = useMemo(
    () => Object.fromEntries(allMatches.map((m) => [m.id, m])),
    [allMatches]
  );

  // Layout geometry
  const firstCount = roundEntries[0]?.matchups.length || 1;
  const totalH = firstCount * CARD_H + (firstCount - 1) * CARD_GAP;

  // Card top position in a column with `count` cards
  const cardTop = (count, idx) => {
    const slotH = totalH / count;
    return slotH * idx + slotH / 2 - CARD_H / 2;
  };

  // Card vertical center in a column with `count` cards
  const cardCenterY = (count, idx) => {
    const slotH = totalH / count;
    return slotH * idx + slotH / 2;
  };

  // Find champion — only set once the final match has a winner
  const finalist = useMemo(() => {
    if (!hasRounds) return null;
    const lastRound   = roundEntries[roundEntries.length - 1];
    const finalMatchup = lastRound?.matchups[0];
    if (!finalMatchup?.winner_team_id) return null;
    return teams?.find((t) => t.id === finalMatchup.winner_team_id) || null;
  }, [roundEntries, hasRounds, teams]);

  // Build finalist's round-by-round path
  const champPath = useMemo(() => {
    if (!finalist) return [];
    return roundEntries.flatMap((round) => {
      const mu = round.matchups.find(
        (m) => m.team1_id === finalist.id || m.team2_id === finalist.id
      );
      if (!mu) return [];
      const isTeam1   = mu.team1_id === finalist.id;
      const opponentId = isTeam1 ? mu.team2_id : mu.team1_id;
      const opponent  = teams?.find((t) => t.id === opponentId);
      const champScore = isTeam1 ? mu.score?.team1 : mu.score?.team2;
      const opScore   = isTeam1 ? mu.score?.team2 : mu.score?.team1;
      return [{
        roundLabel: round.label,
        opponent:   opponent?.short_name || opponent?.name || '???',
        champScore,
        opScore,
        won:      mu.winner_team_id === finalist.id,
        finished: !!mu.winner_team_id,
      }];
    });
  }, [finalist, roundEntries, teams]);

  // Active bracket matches (live first, then scheduled)
  const activeBracketMatches = useMemo(() => {
    const ids = new Set(
      roundEntries.flatMap((r) => r.matchups.map((m) => m.match_id).filter(Boolean))
    );
    return allMatches
      .filter((m) => ids.has(m.id) && (m.status === 'live' || m.status === 'scheduled'))
      .sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        return new Date(a.date) - new Date(b.date);
      })
      .slice(0, 4);
  }, [allMatches, roundEntries]);

  // Round status summary (finished / live counts)
  const roundStatus = useCallback(
    (round) => {
      const total    = round.matchups.length;
      const finished = round.matchups.filter((m) => !!m.winner_team_id).length;
      const live     = round.matchups.filter((m) => {
        const match = m.match_id ? matchMap[m.match_id] : null;
        return match?.status === 'live';
      }).length;
      return { total, finished, live };
    },
    [matchMap]
  );

  const handleGenerate = useCallback(
    async (source) => {
      setIsGenerating(true);
      try {
        if (source === 'seeds') {
          const teamSeeds = teams.map((t, i) => ({ team_id: t.id, seed: t.seed || i + 1 }));
          await generateBracket(tournamentId, { source: 'seeds', teams: teamSeeds });
          toast.success('Cuadro generado desde seeds');
        } else {
          await generateBracket(tournamentId, { source: 'groups' });
          toast.success('Cuadro generado desde clasificación de grupos');
        }
        setGenerateDialog({ open: false, source: null });
      } catch (error) {
        toast.error(error.message || 'Error');
      } finally {
        setIsGenerating(false);
      }
    },
    [tournamentId, teams]
  );

  const handleCreateMatch = useCallback(
    async (roundKey, matchIdx, matchup) => {
      try {
        const match = await createMatch(tournamentId, {
          home_team_id: matchup.team1_id,
          away_team_id: matchup.team2_id,
          date:  new Date().toISOString(),
          round: roundKey,
        });
        await updateBracketSlot(tournamentId, {
          round:      roundKey,
          match_index: matchIdx,
          team1_id:   matchup.team1_id,
          team2_id:   matchup.team2_id,
          match_id:   match.id,
        });
        toast.success('Partido creado');
        navigate(paths.dashboard.tournament.matchDetail(tournamentId, match.id));
      } catch (error) {
        toast.error(error.message || 'Error al crear partido');
      }
    },
    [tournamentId, navigate]
  );

  if (bracketLoading) {
    return (
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
        {[4, 2, 1].map((count, col) => (
          <Stack key={col} spacing={2} sx={{ minWidth: 180 }}>
            {[...Array(count)].map((_, row) => (
              <Skeleton key={row} variant="rounded" height={72} />
            ))}
          </Stack>
        ))}
      </Stack>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────
  if (!hasRounds) {
    return (
      <>
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            boxShadow: 'none',
            border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          }}
        >
          <Iconify icon="mdi:tournament" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Sin cuadro de eliminación</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {canGenerate
              ? 'Genera el cuadro desde seeds o desde la clasificación de grupos'
              : 'Activa el torneo para poder generar el cuadro eliminatorio'}
          </Typography>
          {canGenerate && (
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:auto-fix" />}
                onClick={() => setGenerateDialog({ open: true, source: 'seeds' })}
                disabled={teams.length < 2}
              >
                Desde Seeds
              </Button>
              {isHybrid && hasGroups && (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:podium" />}
                  onClick={() => setGenerateDialog({ open: true, source: 'groups' })}
                >
                  Desde Clasificación
                </Button>
              )}
            </Stack>
          )}
        </Card>
        <GenerateDialog
          open={generateDialog.open}
          source={generateDialog.source}
          hasRounds={false}
          teams={teams}
          isGenerating={isGenerating}
          onClose={() => setGenerateDialog({ open: false, source: null })}
          onConfirm={() => handleGenerate(generateDialog.source)}
        />
      </>
    );
  }

  // Total canvas width
  const canvasW = roundEntries.length * (COL_W + COL_GAP) + COL_GAP + COL_W;

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <Stack
      direction="row"
      sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.01), overflow: 'hidden' }}
    >
      {/* ═══ Bracket canvas ═══ */}
      <Box sx={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', p: { xs: 2, md: 3 } }}>
        {/* Toolbar */}
        {canGenerate && (
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2.5 }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="mdi:refresh" />}
              onClick={() => setGenerateDialog({ open: true, source: 'seeds' })}
            >
              Regenerar desde Seeds
            </Button>
            {isHybrid && hasGroups && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="mdi:refresh" />}
                onClick={() => setGenerateDialog({ open: true, source: 'groups' })}
              >
                Recalcular desde Clasificación
              </Button>
            )}
          </Stack>
        )}

        {/* Bracket row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: canvasW }}>

          {roundEntries.map((round, rIdx) => {
            const count    = round.matchups.length;
            const nextRound = roundEntries[rIdx + 1];
            const { total, finished, live } = roundStatus(round);

            return (
              <Fragment key={round.key}>
                {/* ── Round column ── */}
                <Box sx={{ width: COL_W, flexShrink: 0 }}>
                  <RoundHeader
                    label={round.label}
                    finished={finished}
                    total={total}
                    live={live}
                  />

                  {/* Cards area */}
                  <Box sx={{ position: 'relative', height: totalH }}>
                    {round.matchups.map((matchup, mIdx) => {
                      const team1  = teams?.find((t) => t.id === matchup.team1_id);
                      const team2  = teams?.find((t) => t.id === matchup.team2_id);
                      const match  = matchup.match_id ? matchMap[matchup.match_id] : null;
                      const isFinished = !!matchup.winner_team_id;
                      const isLive     = match?.status === 'live';
                      const hasMatch   = !!matchup.match_id;
                      const canCreate  = matchup.team1_id && matchup.team2_id && !hasMatch;

                      const shortKey = ROUND_SHORT[round.key] || round.key;
                      const matchLabel =
                        round.key === 'final'
                          ? 'Gran Final'
                          : `${shortKey} · ${round.key === 'semiFinals' ? ALPHA[mIdx] : mIdx + 1}`;

                      return (
                        <MatchCard
                          key={mIdx}
                          topPx={cardTop(count, mIdx)}
                          matchLabel={matchLabel}
                          team1={team1}
                          team2={team2}
                          matchup={matchup}
                          match={match}
                          isFinished={isFinished}
                          isLive={isLive}
                          hasMatch={hasMatch}
                          canCreate={canCreate}
                          onNavigate={() =>
                            navigate(
                              paths.dashboard.tournament.matchDetail(tournamentId, matchup.match_id)
                            )
                          }
                          onCreate={() => handleCreateMatch(round.key, mIdx, matchup)}
                        />
                      );
                    })}
                  </Box>
                </Box>

                {/* ── Bezier connectors to next round ── */}
                {nextRound && (
                  <Box sx={{ pt: `${HEADER_H}px`, flexShrink: 0 }}>
                    <BracketConnectors
                      fromCount={count}
                      toCount={nextRound.matchups.length}
                      totalH={totalH}
                    />
                  </Box>
                )}
              </Fragment>
            );
          })}

          {/* ── Straight connector → Champion ── */}
          <Box
            sx={{
              pt: `${HEADER_H}px`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              height: HEADER_H + totalH,
            }}
          >
            <StraightConnector totalH={totalH} />
          </Box>

          {/* ── Champion column ── */}
          <Box sx={{ width: COL_W, flexShrink: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ height: HEADER_H }}
            >
              <Iconify icon="mdi:trophy" width={16} sx={{ color: 'warning.main' }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 0.5 }}
              >
                CAMPEÓN
              </Typography>
            </Stack>

            <Box
              sx={{
                height: totalH,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChampionCard team={finalist} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══ Right sidebar: Ruta del Campeón ═══ */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderLeft: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          bgcolor: 'background.paper',
          overflowY: 'auto',
          p: 2,
          display: { xs: 'none', lg: 'block' },
        }}
      >
        <ChampionSidebar
          finalist={finalist}
          champPath={champPath}
          activeBracketMatches={activeBracketMatches}
          teams={teams}
        />
      </Box>

      <GenerateDialog
        open={generateDialog.open}
        source={generateDialog.source}
        hasRounds={hasRounds}
        teams={teams}
        isGenerating={isGenerating}
        onClose={() => setGenerateDialog({ open: false, source: null })}
        onConfirm={() => handleGenerate(generateDialog.source)}
      />
    </Stack>
  );
}

// ── RoundHeader ───────────────────────────────────────────────────────

function RoundHeader({ label, finished, total, live }) {
  const allDone = total > 0 && finished === total;

  let statusEl = null;
  if (live > 0) {
    statusEl = (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'error.main',
            animation: 'blink 1.4s ease-in-out infinite',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.65rem' }}>
          {live} EN VIVO
        </Typography>
      </Stack>
    );
  } else if (allDone && total > 0) {
    statusEl = (
      <Chip
        label={`${finished}/${total} ✓`}
        size="small"
        color="success"
        variant="soft"
        sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }}
      />
    );
  } else if (total > 0 && finished > 0) {
    statusEl = (
      <Chip
        label={`${finished}/${total}`}
        size="small"
        variant="soft"
        sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600 }}
      />
    );
  } else {
    statusEl = (
      <Chip
        label="Pendiente"
        size="small"
        variant="soft"
        sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, color: 'text.disabled' }}
      />
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ height: HEADER_H }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Typography>
      {statusEl}
    </Stack>
  );
}

// ── MatchCard ─────────────────────────────────────────────────────────

function MatchCard({
  topPx,
  matchLabel,
  team1,
  team2,
  matchup,
  match,
  isFinished,
  isLive,
  hasMatch,
  canCreate,
  onNavigate,
  onCreate,
}) {
  const isWinner1 = matchup.winner_team_id === matchup.team1_id;
  const isWinner2 = matchup.winner_team_id === matchup.team2_id;

  let statusEl;
  if (isFinished) {
    statusEl = (
      <Chip
        label="Final"
        size="small"
        color="success"
        variant="soft"
        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700 }}
      />
    );
  } else if (isLive) {
    statusEl = (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            bgcolor: 'error.main',
            animation: 'blink 1.4s ease-in-out infinite',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.65rem' }}>
          {match?.minute || '--'}&#39;
        </Typography>
      </Stack>
    );
  } else {
    statusEl = (
      <Chip
        label="Pendiente"
        size="small"
        variant="soft"
        sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, color: 'text.disabled' }}
      />
    );
  }

  const dateVenue = match?.date ? fDate(match.date, 'MMM d') : null;
  const venue     = match?.venue || matchup.venue;
  const footer    = [dateVenue, venue].filter(Boolean).join(' · ');

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        width: '100%',
        height: CARD_H,
        top: topPx,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.14)}`,
        borderLeft: (t) =>
          `3px solid ${
            isFinished
              ? t.palette.success.main
              : isLive
                ? t.palette.error.main
                : alpha(t.palette.grey[500], 0.2)
          }`,
        borderRadius: 1.5,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1.25, pt: 0.75, pb: 0.25, flexShrink: 0 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', fontSize: '0.6rem' }}>
          {matchLabel}
        </Typography>
        {statusEl}
      </Stack>

      {/* Team 1 */}
      <TeamRow
        seed={matchup.seed1}
        team={team1}
        score={matchup.score?.team1}
        isWinner={isWinner1}
        isLoser={!!matchup.winner_team_id && !isWinner1}
      />

      {/* Separator */}
      <Box sx={{ height: '1px', bgcolor: (t) => alpha(t.palette.grey[500], 0.08), mx: 1.25, flexShrink: 0 }} />

      {/* Team 2 */}
      <TeamRow
        seed={matchup.seed2}
        team={team2}
        score={matchup.score?.team2}
        isWinner={isWinner2}
        isLoser={!!matchup.winner_team_id && !isWinner2}
      />

      {/* Card footer */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1.25, pb: 0.75, pt: 0.25, mt: 'auto', flexShrink: 0 }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
          {footer || '—'}
        </Typography>
        {hasMatch && (
          <Button
            size="small"
            variant={isFinished ? 'soft' : 'contained'}
            color={isFinished ? 'inherit' : 'inherit'}
            sx={{
              fontSize: '0.6rem',
              py: 0.25,
              px: 1,
              minWidth: 0,
              height: 22,
              ...(isFinished
                ? { bgcolor: (t) => alpha(t.palette.grey[500], 0.1), color: 'text.secondary' }
                : { bgcolor: 'grey.900', color: 'common.white', '&:hover': { bgcolor: 'grey.800' } }),
            }}
            onClick={onNavigate}
          >
            {isFinished ? 'Editar' : 'Registrar'}
          </Button>
        )}
        {canCreate && (
          <Button
            size="small"
            variant="soft"
            sx={{ fontSize: '0.6rem', py: 0.25, px: 1, minWidth: 0, height: 22 }}
            onClick={onCreate}
          >
            Crear
          </Button>
        )}
      </Stack>
    </Box>
  );
}

// ── TeamRow ───────────────────────────────────────────────────────────

function TeamRow({ seed, team, score, isWinner, isLoser }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.25, py: 0.625, flex: 1 }}>
      {seed != null && (
        <Typography
          variant="caption"
          sx={{ fontSize: '0.6rem', fontWeight: 500, color: 'text.disabled', width: 16, flexShrink: 0 }}
        >
          {seed}
        </Typography>
      )}
      <Typography
        variant="caption"
        noWrap
        sx={{
          fontWeight: isWinner ? 700 : 500,
          fontSize: '0.82rem',
          color: isLoser ? 'text.disabled' : 'text.primary',
          flex: 1,
        }}
      >
        {team?.short_name || team?.name || (
          <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.7rem' }}>
            Por definir
          </Box>
        )}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: '0.9rem',
          color: isWinner ? 'success.main' : isLoser ? 'text.disabled' : 'text.secondary',
          minWidth: 18,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {score ?? '—'}
      </Typography>
    </Stack>
  );
}

// ── BracketConnectors (bezier SVG) ────────────────────────────────────

function BracketConnectors({ fromCount, toCount, totalH }) {
  const theme = useTheme();
  const pathDefs = [];

  for (let k = 0; k < toCount; k += 1) {
    const i1 = 2 * k;
    const i2 = 2 * k + 1;
    const y1 = (totalH * (2 * i1 + 1)) / (2 * fromCount);
    const y2 = (totalH * (2 * i2 + 1)) / (2 * fromCount);
    const yt = (totalH * (2 * k + 1))  / (2 * toCount);
    const cx = COL_GAP * 0.6;

    pathDefs.push(
      `M 0,${y1} C ${cx},${y1} ${cx},${yt} ${COL_GAP},${yt}`,
      `M 0,${y2} C ${cx},${y2} ${cx},${yt} ${COL_GAP},${yt}`
    );
  }

  return (
    <svg width={COL_GAP} height={totalH} style={{ display: 'block', overflow: 'visible' }}>
      {pathDefs.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={alpha(theme.palette.grey[500], 0.28)}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// ── StraightConnector (final → champion) ──────────────────────────────

function StraightConnector({ totalH }) {
  const theme = useTheme();
  const cy = totalH / 2;

  return (
    <svg width={COL_GAP} height={totalH} style={{ display: 'block' }}>
      <line
        x1={0}
        y1={cy}
        x2={COL_GAP}
        y2={cy}
        stroke={alpha(theme.palette.grey[500], 0.28)}
        strokeWidth={1.5}
      />
    </svg>
  );
}

// ── ChampionCard ──────────────────────────────────────────────────────

function ChampionCard({ team }) {
  const decided = !!team;

  return (
    <Box
      sx={{
        width: '80%',
        border: (t) =>
          `1.5px solid ${decided ? alpha(t.palette.warning.main, 0.35) : alpha(t.palette.grey[500], 0.14)}`,
        borderRadius: 2,
        bgcolor: (t) =>
          decided ? alpha(t.palette.warning.main, 0.04) : alpha(t.palette.grey[500], 0.02),
        p: 2.5,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: '2rem', lineHeight: 1, mb: 1 }}>🏆</Typography>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'warning.main', fontSize: '0.65rem', display: 'block', mb: 1, letterSpacing: 1 }}
      >
        CAMPEÓN
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          color: decided ? 'text.primary' : 'text.disabled',
          fontStyle: decided ? 'normal' : 'italic',
          fontSize: decided ? '1rem' : '0.85rem',
        }}
      >
        {team?.short_name || team?.name || 'Por definir'}
      </Typography>
    </Box>
  );
}

// ── ChampionSidebar ───────────────────────────────────────────────────

function ChampionSidebar({ finalist, champPath, activeBracketMatches, teams }) {
  const champName = finalist ? (finalist.short_name || finalist.name || '').toUpperCase() : '';
  const wins = champPath.filter((s) => s.won).length;
  const totalGF = champPath.reduce((acc, s) => acc + (s.champScore || 0), 0);
  const totalGC = champPath.reduce((acc, s) => acc + (s.opScore || 0), 0);

  return (
    <Stack spacing={1.75}>
      {/* Sidebar header */}
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Iconify icon="mdi:trophy" width={13} sx={{ color: 'warning.main', flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.62rem', letterSpacing: 0.5 }}
        >
          RUTA DEL CAMPEÓN{champName ? ` · ${champName}` : ''}
        </Typography>
      </Stack>

      {finalist ? (
        <>
          {/* Finalist summary card */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
              border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.18)}`,
              borderRadius: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {finalist.short_name || finalist.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
              {wins}V · {totalGF} GF · {totalGC} GC
            </Typography>
          </Box>

          {/* Round path */}
          {champPath.map((step, i) => (
            <Box key={i}>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block', mb: 0.75 }}
              >
                → {step.roundLabel}
              </Typography>
              <Box
                sx={{
                  p: 1.25,
                  border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                  borderRadius: 1.25,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  vs {step.opponent}
                </Typography>
                {step.finished ? (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: step.won ? 'success.main' : 'error.main',
                    }}
                  >
                    {step.champScore}-{step.opScore} {step.won ? '✓' : '✗'}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                    Pendiente
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Sin finalista aún
        </Typography>
      )}

      {/* Active matches */}
      {activeBracketMatches.length > 0 && (
        <>
          <Box sx={{ pt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.62rem', letterSpacing: 0.5 }}
            >
              PARTIDOS ACTIVOS
            </Typography>
          </Box>
          <Stack spacing={1}>
            {activeBracketMatches.map((match) => {
              const home   = teams?.find((t) => t.id === match.home_team_id);
              const away   = teams?.find((t) => t.id === match.away_team_id);
              const isLive = match.status === 'live';

              return (
                <Box
                  key={match.id}
                  sx={{
                    p: 1.25,
                    border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
                    borderLeft: (t) =>
                      `3px solid ${isLive ? t.palette.error.main : alpha(t.palette.grey[500], 0.2)}`,
                    borderRadius: 1.25,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {home?.short_name || '?'} vs {away?.short_name || '?'}
                    </Typography>
                    {isLive ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box
                          sx={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            animation: 'blink 1.4s ease-in-out infinite',
                            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.65rem' }}>
                          {match.minute || '--'}&#39;
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                        {match.date ? fDate(match.date, 'MMM d') : '—'}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                    {match.round ? (ROUND_LABELS[match.round] || match.round) : '—'}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// ── GenerateDialog ────────────────────────────────────────────────────

function GenerateDialog({ open, source, hasRounds, teams, isGenerating, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{hasRounds ? 'Regenerar Cuadro' : 'Generar Cuadro'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {source === 'seeds'
            ? `Se generará el cuadro usando los seeds actuales de los ${teams.length} equipos.`
            : 'Se generará el cuadro tomando los clasificados de cada grupo según las posiciones actuales.'}
          {hasRounds && ' Esto reemplazará el cuadro actual.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton
          variant="contained"
          color={hasRounds ? 'warning' : 'primary'}
          loading={isGenerating}
          onClick={onConfirm}
        >
          {hasRounds ? 'Regenerar' : 'Generar'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
