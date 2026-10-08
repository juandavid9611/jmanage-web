import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import {
  getLineupsByMatch,
  computeCompromisoStats,
} from 'src/actions/engagement';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Players under this commitment ratio (0-1) are flagged as low commitment.
const LOW_COMPROMISO_THRESHOLD = 0.5;

function compromisoColor(pct) {
  if (pct >= 66) return 'success';
  if (pct >= 33) return 'warning';
  return 'error';
}

const HIDE_BELOW_SM = { display: { xs: 'none', sm: 'table-cell' } };

export function CompromisoTable({ roster, matches }) {
  const lineupsByMatch = useMemo(() => getLineupsByMatch(matches), [matches]);

  const stats = useMemo(() => computeCompromisoStats(roster, lineupsByMatch), [roster, lineupsByMatch]);
  const partidosRegistrados = stats[0]?.partidosRegistrados || 0;

  const bajoCompromiso = useMemo(
    () =>
      partidosRegistrados > 0
        ? stats
            .filter((s) => s.compromiso < LOW_COMPROMISO_THRESHOLD)
            .sort((a, b) => a.compromiso - b.compromiso)
        : [],
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
    <Stack spacing={3}>
      {bajoCompromiso.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.32)}`,
            bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Iconify icon="solar:danger-triangle-bold" width={20} sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'warning.darker' }}>
              Bajo compromiso (menos de {Math.round(LOW_COMPROMISO_THRESHOLD * 100)}%)
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {bajoCompromiso.map((s) => {
              const pct = Math.round(s.compromiso * 100);
              return (
                <Stack key={s.player.id} direction="row" alignItems="center" spacing={1.5}>
                  <Avatar src={s.player.avatarUrl} sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {s.player.name?.[0]}
                  </Avatar>
                  <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {s.player.name}
                  </Typography>
                  <Chip size="small" variant="soft" color={compromisoColor(pct)} label={`${pct}%`} />
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Compromiso por jugador · {partidosRegistrados}{' '}
          {partidosRegistrados === 1 ? 'partido registrado' : 'partidos registrados'}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Jugador</TableCell>
                <TableCell align="center">Convocado</TableCell>
                <TableCell align="center">% Compromiso</TableCell>
                <TableCell align="center">PJ</TableCell>
                <TableCell align="center" sx={HIDE_BELOW_SM}>
                  Titular
                </TableCell>
                <TableCell align="center" sx={HIDE_BELOW_SM}>
                  Suplente
                </TableCell>
                <TableCell align="center" sx={HIDE_BELOW_SM}>
                  Min. totales
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats
                .slice()
                .sort((a, b) => b.compromiso - a.compromiso)
                .map((s) => {
                  const pct = Math.round(s.compromiso * 100);
                  return (
                    <TableRow key={s.player.id}>
                      <TableCell sx={{ maxWidth: { xs: 120, sm: 'none' } }}>
                        <Typography variant="body2" noWrap>
                          {s.player.number != null ? `#${s.player.number} ` : ''}
                          {s.player.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{s.vecesConvocado}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" variant="soft" color={compromisoColor(pct)} label={`${pct}%`} />
                      </TableCell>
                      <TableCell align="center">{s.pj}</TableCell>
                      <TableCell align="center" sx={HIDE_BELOW_SM}>
                        {s.titulares}
                      </TableCell>
                      <TableCell align="center" sx={HIDE_BELOW_SM}>
                        {s.suplentes}
                      </TableCell>
                      <TableCell align="center" sx={HIDE_BELOW_SM}>
                        {s.minutos}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
