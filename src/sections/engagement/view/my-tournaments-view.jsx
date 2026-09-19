import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetEngagementMatches,
  useGetEngagementLineupsForMatches,
  useGetEngagementTournamentsForUser,
} from 'src/actions/engagement';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

function StatTile({ label, value }) {
  return (
    <Grid xs={6} sm={3} md>
      <Card sx={{ p: 2, textAlign: 'center', boxShadow: 'none', bgcolor: (t) => t.palette.background.neutral }}>
        <Typography variant="h5">{value}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Card>
    </Grid>
  );
}

function matchStatusLabel(lineup, rosterEntryId) {
  if (!lineup) return { text: 'Sin convocatoria cargada', color: 'default' };
  const entry = lineup.entries?.find((e) => e.roster_entry_id === rosterEntryId);
  if (!entry?.called_up) return { text: 'No convocado', color: 'default' };
  if (entry.status === 'titular') return { text: 'Titular', color: 'success' };
  if (entry.status === 'suplente') return { text: 'Suplente', color: 'info' };
  return { text: 'Convocado', color: 'success' };
}

function MyTournamentDetail({ rosterEntryId, tournament, workspaceId }) {
  const { matches } = useGetEngagementMatches(tournament.id, workspaceId);
  const matchIds = useMemo(() => matches.map((m) => m.id), [matches]);
  const { lineupsByMatch } = useGetEngagementLineupsForMatches(matchIds, workspaceId);

  const stats = useMemo(() => {
    const registeredMatchIds = Object.keys(lineupsByMatch);
    let called = 0;
    let titular = 0;
    let suplente = 0;
    let minutos = 0;

    registeredMatchIds.forEach((matchId) => {
      const entry = lineupsByMatch[matchId]?.entries?.find((e) => e.roster_entry_id === rosterEntryId);
      if (!entry?.called_up) return;
      called += 1;
      if (entry.status === 'titular') titular += 1;
      if (entry.status === 'suplente') suplente += 1;
      minutos += Number(entry.minutes) || 0;
    });

    const partidosRegistrados = registeredMatchIds.length;
    const compromiso = partidosRegistrados > 0 ? called / partidosRegistrados : 0;

    return { called, titular, suplente, minutos, partidosRegistrados, compromiso };
  }, [lineupsByMatch, rosterEntryId]);

  return (
    <Card sx={{ p: 3, boxShadow: 'none', border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h6">{tournament.name}</Typography>
        {tournament.category && <Chip size="small" label={tournament.category} />}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <StatTile label="% Compromiso" value={`${Math.round(stats.compromiso * 100)}%`} />
        <StatTile label="Convocatorias" value={stats.called} />
        <StatTile label="Titular" value={stats.titular} />
        <StatTile label="Suplente" value={stats.suplente} />
        <StatTile label="Minutos" value={stats.minutos} />
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Partidos
      </Typography>
      {matches.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
          Todavía no hay partidos cargados para este torneo.
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Rival</TableCell>
                <TableCell align="center">Mi estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((m) => {
                const status = matchStatusLabel(lineupsByMatch[m.id], rosterEntryId);
                return (
                  <TableRow key={m.id}>
                    <TableCell>{fDate(m.date)}</TableCell>
                    <TableCell>{m.rival}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" variant="soft" color={status.color} label={status.text} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

export function MyTournamentsView() {
  const { user } = useAuthContext();
  const { selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id;

  const { entries, entriesLoading } = useGetEngagementTournamentsForUser(user?.id, workspaceId);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!selectedId && entries.length) setSelectedId(entries[0].tournament.id);
  }, [entries, selectedId]);

  const selected = entries.find((e) => e.tournament.id === selectedId);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mis Torneos
      </Typography>

      {!entries.length && !entriesLoading && (
        <EmptyContent
          filled
          title="Todavía no estás anotado en ningún torneo"
          description="Cuando tu club te agregue a la plantilla de un torneo, lo vas a ver acá con tus convocatorias y estadísticas."
          sx={{ py: 10 }}
        />
      )}

      {!!entries.length && (
        <Grid container spacing={3}>
          <Grid xs={12} md={3}>
            <Stack spacing={1}>
              {entries.map(({ tournament }) => (
                <Card
                  key={tournament.id}
                  onClick={() => setSelectedId(tournament.id)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    border: (th) =>
                      `1.5px solid ${tournament.id === selectedId ? th.palette.primary.main : alpha(th.palette.grey[500], 0.12)}`,
                    bgcolor:
                      tournament.id === selectedId ? (th) => alpha(th.palette.primary.main, 0.04) : 'transparent',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:medal-star-bold" width={18} sx={{ color: 'text.disabled' }} />
                    <Box>
                      <Typography variant="subtitle2" noWrap>
                        {tournament.name}
                      </Typography>
                      {tournament.category && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {tournament.category}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid xs={12} md={9}>
            {selected && (
              <MyTournamentDetail
                rosterEntryId={selected.rosterEntryId}
                tournament={selected.tournament}
                workspaceId={workspaceId}
              />
            )}
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
