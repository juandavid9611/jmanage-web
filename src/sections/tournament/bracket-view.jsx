import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';

import {
  createMatch,
  useGetBracket,
  generateBracket,
  updateBracketSlot,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const ROUND_ORDER = [
  'roundOf32',
  'roundOf16',
  'quarterFinals',
  'semiFinals',
  'final',
];

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
  const isHybrid = tournament?.type === 'hybrid';
  const hasGroups = tournament?.groups?.length > 0;

  const handleGenerateFromSeeds = async () => {
    try {
      const teamSeeds = teams.map((t, i) => ({ team_id: t.id, seed: t.seed || (i + 1) }));
      await generateBracket(tournamentId, { source: 'seeds', teams: teamSeeds });
      toast.success('Cuadro generado desde seeds');
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const handleGenerateFromStandings = async () => {
    try {
      await generateBracket(tournamentId, { source: 'groups' });
      toast.success('Cuadro generado desde clasificación de grupos');
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  };

  const handleCreateMatchFromSlot = async (roundKey, matchIdx, matchup) => {
    try {
      const match = await createMatch(tournamentId, {
        home_team_id: matchup.team1_id,
        away_team_id: matchup.team2_id,
        date: new Date().toISOString(),
        round: roundKey,
      });
      // Link match_id back to bracket slot
      await updateBracketSlot(tournamentId, {
        round: roundKey,
        match_index: matchIdx,
        team1_id: matchup.team1_id,
        team2_id: matchup.team2_id,
      });
      toast.success('Partido creado');
      navigate(paths.dashboard.tournament.matchDetail(tournamentId, match.id));
    } catch (error) {
      toast.error(error.message || 'Error al crear partido');
    }
  };

  if (bracketLoading) return null;

  if (!hasRounds) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify icon="mdi:tournament" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Sin cuadro de eliminación
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Genera el cuadro desde seeds o desde la clasificación de grupos
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:auto-fix" />}
            onClick={handleGenerateFromSeeds}
            disabled={teams.length < 2}
          >
            Desde Seeds
          </Button>
          {isHybrid && hasGroups && (
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:podium" />}
              onClick={handleGenerateFromStandings}
            >
              Desde Clasificación
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      {/* Recalculate bracket actions */}
      {isHybrid && hasGroups && (
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mdi:refresh" />}
            onClick={handleGenerateFromStandings}
          >
            Recalcular desde Clasificación
          </Button>
        </Stack>
      )}

      <Stack direction="row" spacing={4} sx={{ minWidth: roundEntries.length * 260, py: 2 }}>
        {roundEntries.map((round) => (
          <Stack key={round.key} spacing={2} sx={{ minWidth: 220 }}>
            <Typography variant="subtitle2" sx={{ textAlign: 'center', textTransform: 'uppercase' }}>
              {round.label}
            </Typography>

            <Stack spacing={2} justifyContent="space-around" sx={{ flex: 1 }}>
              {round.matchups.map((matchup, matchIdx) => {
                const team1 = teams.find((t) => t.id === matchup.team1_id);
                const team2 = teams.find((t) => t.id === matchup.team2_id);
                const isWinner1 = matchup.winner_team_id === matchup.team1_id;
                const isWinner2 = matchup.winner_team_id === matchup.team2_id;
                const hasMatch = !!matchup.match_id;
                const canCreateMatch = matchup.team1_id && matchup.team2_id && !hasMatch;

                const cardContent = (
                  <>
                    <Stack spacing={0.5} sx={{ p: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isWinner1 ? 700 : 400,
                            color: isWinner1 ? 'success.main' : 'text.primary',
                          }}
                        >
                          {team1?.short_name || team1?.name || 'TBD'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {matchup.score?.team1 ?? '-'}
                        </Typography>
                      </Stack>

                      <Divider />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isWinner2 ? 700 : 400,
                            color: isWinner2 ? 'success.main' : 'text.primary',
                          }}
                        >
                          {team2?.short_name || team2?.name || 'TBD'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {matchup.score?.team2 ?? '-'}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={0.5} sx={{ px: 1.5, pb: 1 }}>
                      {matchup.winner_team_id && (
                        <Chip label="Finalizado" size="small" color="success" variant="soft" />
                      )}
                      {hasMatch && !matchup.winner_team_id && (
                        <Chip label="En juego" size="small" color="info" variant="soft" />
                      )}
                      {!hasMatch && !matchup.winner_team_id && (
                        <Chip label="Pendiente" size="small" variant="soft" />
                      )}
                    </Stack>
                  </>
                );

                return (
                  <Card
                    key={matchIdx}
                    sx={{
                      border: '1px solid',
                      borderColor: matchup.winner_team_id
                        ? 'success.main'
                        : hasMatch
                          ? 'info.main'
                          : 'divider',
                    }}
                  >
                    {hasMatch ? (
                      <CardActionArea
                        onClick={() =>
                          navigate(paths.dashboard.tournament.matchDetail(tournamentId, matchup.match_id))
                        }
                      >
                        {cardContent}
                      </CardActionArea>
                    ) : (
                      cardContent
                    )}

                    {canCreateMatch && (
                      <Stack sx={{ px: 1.5, pb: 1 }}>
                        <Button
                          size="small"
                          variant="soft"
                          startIcon={<Iconify icon="mdi:plus" width={16} />}
                          onClick={() => handleCreateMatchFromSlot(round.key, matchIdx, matchup)}
                        >
                          Crear Partido
                        </Button>
                      </Stack>
                    )}
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
