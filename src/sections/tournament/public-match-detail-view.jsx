import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import {
  useGetPublicTeams,
  useGetPublicMatch,
  useGetPublicPlayers,
  useGetPublicTournament,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { LandingNav } from 'src/sections/landing/landing-nav';

import { MatchEventTimeline } from './match-event-timeline';

// ----------------------------------------------------------------------

const STATUS_BADGE = {
  finished: { label: 'Final', color: 'success' },
  live: { label: 'En vivo', color: 'error' },
  scheduled: { label: 'Pendiente', color: 'warning' },
  postponed: { label: 'Aplazado', color: 'warning' },
};

// ----------------------------------------------------------------------

export function PublicMatchDetailView({ tournamentId, matchId }) {
  const navigate = useNavigate();
  const { tournament } = useGetPublicTournament(tournamentId);
  const { teams } = useGetPublicTeams(tournamentId);
  const { match, matchLoading } = useGetPublicMatch(tournamentId, matchId);

  const homeTeam = teams?.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams?.find((t) => t.id === match?.away_team_id);

  const { players: homePlayers } = useGetPublicPlayers(
    match ? tournamentId : null,
    match?.home_team_id
  );
  const { players: awayPlayers } = useGetPublicPlayers(
    match ? tournamentId : null,
    match?.away_team_id
  );

  const allPlayers = useMemo(
    () => [...(homePlayers || []), ...(awayPlayers || [])],
    [homePlayers, awayPlayers]
  );

  const badge = match ? STATUS_BADGE[match.status] || STATUS_BADGE.scheduled : null;
  const hasScore = match && (match.status === 'finished' || match.status === 'live');

  return (
    <>
      <LandingNav basePath="/" />
      <Container maxWidth="md" sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 5, md: 8 } }}>
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate(paths.publicTournaments.detail(tournamentId))}
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          {tournament?.name || 'Torneo'}
        </Button>

        {matchLoading && !match ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={240} />
          </Stack>
        ) : !match ? (
          <EmptyContent title="Partido no disponible" sx={{ py: 8 }} />
        ) : (
          <Stack spacing={3}>
            <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                  <Chip label={badge.label} color={badge.color} size="small" variant="soft" />
                  {match.matchweek != null && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Jornada {match.matchweek}
                    </Typography>
                  )}
                  {match.round && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {match.round}
                    </Typography>
                  )}
                  {match.date && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {new Date(match.date).toLocaleString()}
                    </Typography>
                  )}
                  {match.venue && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      · {match.venue}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <TeamHeader team={homeTeam} align="right" />
                  {hasScore ? (
                    <Box
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                        minWidth: 120,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                        {match.score_home ?? 0} – {match.score_away ?? 0}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h5" sx={{ color: 'text.disabled' }}>
                      vs
                    </Typography>
                  )}
                  <TeamHeader team={awayTeam} align="left" />
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Eventos
              </Typography>
              <MatchEventTimeline
                events={match.events || []}
                players={allPlayers}
                teams={teams}
              />
            </Card>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <LineupCard team={homeTeam} players={homePlayers} />
              <LineupCard team={awayTeam} players={awayPlayers} />
            </Stack>
          </Stack>
        )}
      </Container>
    </>
  );
}

// ----------------------------------------------------------------------

function TeamHeader({ team, align }) {
  return (
    <Stack
      direction={align === 'right' ? 'row' : 'row-reverse'}
      alignItems="center"
      spacing={1.5}
      flex={1}
      justifyContent={align === 'right' ? 'flex-end' : 'flex-end'}
    >
      <Typography
        variant="h6"
        sx={{ textAlign: align, fontWeight: 600 }}
      >
        {team?.name || 'TBD'}
      </Typography>
      {team?.logo_url ? (
        <Avatar src={team.logo_url} variant="rounded" sx={{ width: 48, height: 48 }} />
      ) : (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="mdi:shield-half-full" width={26} sx={{ color: 'text.disabled' }} />
        </Box>
      )}
    </Stack>
  );
}

function LineupCard({ team, players }) {
  const grouped = useMemo(() => {
    const buckets = { Goalkeeper: [], Defender: [], Midfielder: [], Forward: [] };
    (players || []).forEach((p) => {
      const pos = p.position || 'Other';
      if (!buckets[pos]) buckets[pos] = [];
      buckets[pos].push(p);
    });
    Object.values(buckets).forEach((b) =>
      b.sort((a, b2) => (a.number ?? 999) - (b2.number ?? 999))
    );
    return buckets;
  }, [players]);

  return (
    <Card sx={{ flex: 1, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        {team?.logo_url && (
          <Avatar src={team.logo_url} variant="rounded" sx={{ width: 28, height: 28 }} />
        )}
        <Typography variant="subtitle1">{team?.name || 'Equipo'}</Typography>
      </Stack>
      {!players?.length ? (
        <Typography variant="body2" color="text.disabled" sx={{ py: 1.5 }}>
          Plantilla no disponible
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {Object.entries(grouped).map(([pos, list]) =>
            list.length > 0 ? (
              <Box key={pos}>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                  {POSITION_LABEL[pos] || pos}
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                  {list.map((p) => (
                    <Stack
                      key={p.id}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ py: 0.25 }}
                    >
                      <Typography variant="body2" sx={{ minWidth: 28, color: 'text.disabled' }}>
                        {p.number != null ? `#${p.number}` : ''}
                      </Typography>
                      <Typography variant="body2">{p.name}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ) : null
          )}
        </Stack>
      )}
    </Card>
  );
}

const POSITION_LABEL = {
  Goalkeeper: 'Porteros',
  Defender: 'Defensas',
  Midfielder: 'Mediocampistas',
  Forward: 'Delanteros',
};
