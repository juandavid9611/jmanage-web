import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import {
  createMatch,
  useGetBracket,
  advanceWinner,
  generateBracket,
  updateBracketSlot,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const ROUND_ORDER = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals', 'final'];

const ROUND_LABELS = {
  roundOf32: 'Dieciseisavos',
  roundOf16: 'Octavos',
  quarterFinals: 'Cuartos',
  semiFinals: 'Semifinal',
  final: 'Final',
};

export function BracketView({ tournamentId, teams, tournament }) {
  const navigate = useNavigate();
  const { bracket, bracketLoading } = useGetBracket(tournamentId);

  const [generateDialog, setGenerateDialog] = useState({ open: false, source: null });
  const [isGenerating, setIsGenerating] = useState(false);

  const isHybrid = tournament?.type === 'hybrid';
  const hasGroups = tournament?.groups?.length > 0;
  const canGenerate =
    tournament?.status === 'active' && (tournament?.type === 'knockout' || isHybrid);

  // Derive round entries from bracket object
  const roundEntries = [];
  if (bracket && typeof bracket === 'object') {
    const knownKeys = ROUND_ORDER.filter((k) => bracket[k]);
    const unknownKeys = Object.keys(bracket).filter(
      (k) => !ROUND_ORDER.includes(k) && Array.isArray(bracket[k])
    );
    [...knownKeys, ...unknownKeys].forEach((key) => {
      if (Array.isArray(bracket[key])) {
        roundEntries.push({ key, label: ROUND_LABELS[key] || key, matchups: bracket[key] });
      }
    });
  }

  const hasRounds = roundEntries.length > 0;

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

  const handleCreateMatchFromSlot = useCallback(
    async (roundKey, matchIdx, matchup) => {
      try {
        const match = await createMatch(tournamentId, {
          home_team_id: matchup.team1_id,
          away_team_id: matchup.team2_id,
          date: new Date().toISOString(),
          round: roundKey,
        });
        await updateBracketSlot(tournamentId, {
          round: roundKey,
          match_index: matchIdx,
          team1_id: matchup.team1_id,
          team2_id: matchup.team2_id,
          match_id: match.id,
        });
        toast.success('Partido creado');
        navigate(paths.dashboard.tournament.matchDetail(tournamentId, match.id));
      } catch (error) {
        toast.error(error.message || 'Error al crear partido');
      }
    },
    [tournamentId, navigate]
  );

  const handleAdvanceWinner = useCallback(
    async (matchId, winnerId, winnerName) => {
      try {
        await advanceWinner(tournamentId, matchId, winnerId);
        toast.success(`${winnerName} avanzado a la siguiente ronda`);
      } catch (error) {
        toast.error(error.message || 'Error al avanzar ganador');
      }
    },
    [tournamentId]
  );

  if (bracketLoading) return null;

  // Empty state — Dialog must be rendered here too since this path early-returns
  if (!hasRounds) {
    return (
      <>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Iconify icon="mdi:tournament" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sin cuadro de eliminación
          </Typography>
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

  return (
    <Box>
      {/* Bracket actions toolbar */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2 }}>
        {canGenerate && (
          <>
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
          </>
        )}
      </Stack>

      {/* Bracket grid — rounds as columns */}
      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <Stack direction="row" spacing={4} sx={{ minWidth: roundEntries.length * 260, py: 2 }}>
          {roundEntries.map((round, roundIdx) => (
            <Stack key={round.key} spacing={2} sx={{ minWidth: 220 }}>
              <Typography
                variant="subtitle2"
                sx={{ textAlign: 'center', textTransform: 'uppercase', color: 'text.secondary' }}
              >
                {round.label}
              </Typography>

              <Stack
                spacing={roundIdx === 0 ? 2 : 4}
                justifyContent="space-around"
                sx={{ flex: 1 }}
              >
                {round.matchups.map((matchup, matchIdx) => {
                  const team1 = teams.find((t) => t.id === matchup.team1_id);
                  const team2 = teams.find((t) => t.id === matchup.team2_id);
                  const isWinner1 = matchup.winner_team_id === matchup.team1_id;
                  const isWinner2 = matchup.winner_team_id === matchup.team2_id;
                  const hasMatch = !!matchup.match_id;
                  const isFinished = !!matchup.winner_team_id;
                  const canCreateMatch = matchup.team1_id && matchup.team2_id && !hasMatch;

                  const winnerTeam = isWinner1 ? team1 : isWinner2 ? team2 : null;

                  const matchupCard = (
                    <Card
                      key={matchIdx}
                      sx={{
                        border: '1px solid',
                        borderColor: isFinished
                          ? 'success.main'
                          : hasMatch
                            ? 'info.main'
                            : 'divider',
                      }}
                    >
                      {/* Teams */}
                      {hasMatch ? (
                        <CardActionArea
                          onClick={() =>
                            navigate(
                              paths.dashboard.tournament.matchDetail(
                                tournamentId,
                                matchup.match_id
                              )
                            )
                          }
                        >
                          <TeamSlotContent
                            team1={team1}
                            team2={team2}
                            matchup={matchup}
                            isWinner1={isWinner1}
                            isWinner2={isWinner2}
                            isFinished={isFinished}
                            hasMatch={hasMatch}
                          />
                        </CardActionArea>
                      ) : (
                        <TeamSlotContent
                          team1={team1}
                          team2={team2}
                          matchup={matchup}
                          isWinner1={isWinner1}
                          isWinner2={isWinner2}
                          isFinished={isFinished}
                          hasMatch={hasMatch}
                        />
                      )}

                      {/* Create match button */}
                      {canCreateMatch && (
                        <Stack sx={{ px: 1.5, pb: 1 }}>
                          <Button
                            size="small"
                            variant="soft"
                            startIcon={<Iconify icon="mdi:plus" width={16} />}
                            onClick={() =>
                              handleCreateMatchFromSlot(round.key, matchIdx, matchup)
                            }
                          >
                            Crear Partido
                          </Button>
                        </Stack>
                      )}

                      {/* Advance winner buttons — shown when match exists but winner not yet picked */}
                      {hasMatch && !isFinished && team1 && team2 && (
                        <Stack sx={{ px: 1.5, pb: 1 }} spacing={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                            ¿Quién avanza?
                          </Typography>
                          {[
                            { id: matchup.team1_id, team: team1 },
                            { id: matchup.team2_id, team: team2 },
                          ].map(({ id, team }) => (
                            <Button
                              key={id}
                              size="small"
                              variant="soft"
                              color="success"
                              startIcon={<Iconify icon="mdi:trophy" width={16} />}
                              onClick={() =>
                                handleAdvanceWinner(
                                  matchup.match_id,
                                  id,
                                  team.short_name || team.name
                                )
                              }
                            >
                              {team.short_name || team.name}
                            </Button>
                          ))}
                        </Stack>
                      )}

                      {/* Winner chip — shown once winner is set, with re-advance action */}
                      {isFinished && winnerTeam && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{ px: 1.5, pb: 1 }}
                        >
                          <Chip
                            icon={<Iconify icon="mdi:trophy" width={14} />}
                            label={`Avanza: ${winnerTeam.short_name || winnerTeam.name}`}
                            size="small"
                            color="success"
                            variant="soft"
                            sx={{ flex: 1 }}
                          />
                          <Tooltip title="Re-avanzar al siguiente ronda">
                            <Button
                              size="small"
                              variant="soft"
                              color="success"
                              sx={{ minWidth: 0, px: 0.75 }}
                              onClick={() =>
                                handleAdvanceWinner(
                                  matchup.match_id,
                                  matchup.winner_team_id,
                                  winnerTeam.short_name || winnerTeam.name
                                )
                              }
                            >
                              <Iconify icon="mdi:refresh" width={16} />
                            </Button>
                          </Tooltip>
                        </Stack>
                      )}
                    </Card>
                  );

                  return matchupCard;
                })}
              </Stack>
            </Stack>
          ))}
        </Stack>
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
    </Box>
  );
}

// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------

function TeamSlotContent({ team1, team2, matchup, isWinner1, isWinner2, isFinished, hasMatch }) {
  return (
    <Stack spacing={0.5} sx={{ p: 1.5 }}>
      {/* Team 1 row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {isWinner1 && (
            <Iconify icon="mdi:check-circle" width={16} sx={{ color: 'success.main' }} />
          )}
          <Typography
            variant="body2"
            sx={{
              fontWeight: isWinner1 ? 700 : 400,
              color: isWinner1 ? 'success.main' : team1 ? 'text.primary' : 'text.disabled',
            }}
          >
            {team1?.short_name || team1?.name || 'Por definir'}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {matchup.score?.team1 ?? '-'}
        </Typography>
      </Stack>

      <Divider />

      {/* Team 2 row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {isWinner2 && (
            <Iconify icon="mdi:check-circle" width={16} sx={{ color: 'success.main' }} />
          )}
          <Typography
            variant="body2"
            sx={{
              fontWeight: isWinner2 ? 700 : 400,
              color: isWinner2 ? 'success.main' : team2 ? 'text.primary' : 'text.disabled',
            }}
          >
            {team2?.short_name || team2?.name || 'Por definir'}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {matchup.score?.team2 ?? '-'}
        </Typography>
      </Stack>

      {/* Status chips */}
      <Stack direction="row" spacing={0.5} sx={{ pt: 0.5 }}>
        {isFinished && (
          <Chip label="Finalizado" size="small" color="success" variant="soft" />
        )}
        {hasMatch && !isFinished && (
          <Chip label="En juego" size="small" color="info" variant="soft" />
        )}
        {!hasMatch && !isFinished && (
          <Chip label="Pendiente" size="small" variant="soft" />
        )}
      </Stack>
    </Stack>
  );
}
