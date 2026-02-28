import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';

import { useGetTopScorers } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TopScorersTable({ tournamentId }) {
  const { scorers, scorersLoading } = useGetTopScorers(tournamentId);

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
                {' Goles'}
              </TableCell>
              <TableCell align="center">Penales</TableCell>
              <TableCell align="center">Autogoles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scorers.map((row, idx) => (
              <TableRow
                key={row.player_id}
                sx={{
                  ...(idx === 0 && { bgcolor: 'warning.lighter' }),
                  ...(idx > 0 && idx < 3 && { bgcolor: 'success.lighter' }),
                }}
              >
                <TableCell>
                  <Typography variant="subtitle2">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : row.rank}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">
                    {row.player_number ? `#${row.player_number} ` : ''}
                    {row.player_name || row.player_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.team_short_name || row.team_name || row.team_id}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle1" color="primary">
                    {row.goals}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {row.penalties > 0 ? row.penalties : '-'}
                </TableCell>
                <TableCell align="center">
                  {row.own_goals > 0 ? row.own_goals : '-'}
                </TableCell>
              </TableRow>
            ))}
            {scorers.length === 0 && !scorersLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay goles registrados aún
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
