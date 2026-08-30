import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import {
  computeCompromisoStats,
  useGetEngagementLineupsForMatches,
} from 'src/actions/engagement';

// ----------------------------------------------------------------------

export function CompromisoTable({ roster, matches }) {
  const matchIds = useMemo(() => matches.map((m) => m.id), [matches]);
  const { lineupsByMatch } = useGetEngagementLineupsForMatches(matchIds);

  const stats = useMemo(() => computeCompromisoStats(roster, lineupsByMatch), [roster, lineupsByMatch]);
  const partidosRegistrados = stats[0]?.partidosRegistrados || 0;

  const bajoCompromiso = useMemo(
    () => (partidosRegistrados > 0 ? [...stats].sort((a, b) => a.compromiso - b.compromiso).slice(0, 5) : []),
    [stats, partidosRegistrados]
  );

  if (roster.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
        Armá primero la plantilla de este torneo.
      </Typography>
    );
  }

  if (partidosRegistrados === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
        Todavía no hay convocatorias guardadas — cargalas desde la pestaña &quot;Partidos&quot;.
      </Typography>
    );
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Compromiso — {partidosRegistrados} partido{partidosRegistrados === 1 ? '' : 's'} registrado
          {partidosRegistrados === 1 ? '' : 's'}
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Jugador</TableCell>
              <TableCell align="center">Convocado</TableCell>
              <TableCell align="center">% Compromiso</TableCell>
              <TableCell align="center">PJ</TableCell>
              <TableCell align="center">Titular</TableCell>
              <TableCell align="center">Suplente</TableCell>
              <TableCell align="center">Min. totales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats
              .slice()
              .sort((a, b) => b.compromiso - a.compromiso)
              .map((s) => (
                <TableRow key={s.player.id}>
                  <TableCell>
                    {s.player.number ? `#${s.player.number} ` : ''}
                    {s.player.name}
                  </TableCell>
                  <TableCell align="center">{s.vecesConvocado}</TableCell>
                  <TableCell align="center">{Math.round(s.compromiso * 100)}%</TableCell>
                  <TableCell align="center">{s.pj}</TableCell>
                  <TableCell align="center">{s.titulares}</TableCell>
                  <TableCell align="center">{s.suplentes}</TableCell>
                  <TableCell align="center">{s.minutos}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        </TableContainer>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.dark' }}>
          ⚠ Bajo compromiso
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Jugador</TableCell>
              <TableCell align="center">% Compromiso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bajoCompromiso.map((s, i) => (
              <TableRow key={s.player.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{s.player.name}</TableCell>
                <TableCell align="center">{Math.round(s.compromiso * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
