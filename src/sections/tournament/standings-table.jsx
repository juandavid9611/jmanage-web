import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useGetStandings } from 'src/actions/tournament';

// ----------------------------------------------------------------------

export function StandingsTable({ tournamentId, groups, teams }) {
  const [selectedGroup, setSelectedGroup] = useState('');

  const { standings, standingsLoading } = useGetStandings(
    tournamentId,
    selectedGroup || undefined
  );

  const rows = standings?.items || [];

  return (
    <Stack spacing={2}>
      {groups?.length > 0 && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={selectedGroup}
          onChange={(_, v) => { if (v !== null) setSelectedGroup(v); }}
        >
          <ToggleButton value="">General</ToggleButton>
          {groups.map((g) => (
            <ToggleButton key={g.id} value={g.id}>
              {g.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Equipo</TableCell>
                <TableCell align="center">PJ</TableCell>
                <TableCell align="center">PG</TableCell>
                <TableCell align="center">PE</TableCell>
                <TableCell align="center">PP</TableCell>
                <TableCell align="center">GF</TableCell>
                <TableCell align="center">GC</TableCell>
                <TableCell align="center">DG</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Pts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.team_id}
                  sx={{
                    ...(idx < 2 && { bgcolor: 'success.lighter' }),
                  }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {teams?.find((t) => t.id === row.team_id)?.name || row.team_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{row.played}</TableCell>
                  <TableCell align="center">{row.won}</TableCell>
                  <TableCell align="center">{row.drawn}</TableCell>
                  <TableCell align="center">{row.lost}</TableCell>
                  <TableCell align="center">{row.goals_for}</TableCell>
                  <TableCell align="center">{row.goals_against}</TableCell>
                  <TableCell align="center">{row.goal_difference}</TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" color="primary">
                      {row.points}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !standingsLoading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay partidos finalizados aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}
