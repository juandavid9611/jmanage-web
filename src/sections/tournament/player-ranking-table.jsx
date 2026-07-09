import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import {
  useGetTeams,
  useGetPlayers,
  useGetPublicTeams,
  useGetPublicPlayers,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// title/label values below are i18n keys, resolved via t() at render time.
const METRICS = {
  goals: {
    title: 'label_top_scorers',
    icon: 'mdi:soccer',
    iconColor: 'warning.main',
    emptyText: 'label_no_goals_recorded_yet',
    sortKey: (s) => s.goals || 0,
    isVisible: (s) => (s.goals || 0) > 0 || (s.penalties || 0) > 0,
    columns: [
      { label: 'word_goals', icon: 'mdi:soccer', key: 'goals', primary: true },
      { label: 'label_penalties', icon: 'mdi:target', key: 'penalties' },
    ],
  },
  assists: {
    title: 'label_assists',
    icon: 'mdi:shoe-cleat',
    iconColor: 'info.main',
    emptyText: 'label_no_assists_recorded_yet',
    sortKey: (s) => s.assists || 0,
    isVisible: (s) => (s.assists || 0) > 0,
    columns: [{ label: 'label_assists', icon: 'mdi:shoe-cleat', key: 'assists', primary: true }],
  },
  cards: {
    title: 'label_disciplinary_record',
    icon: 'mdi:card',
    iconColor: 'warning.main',
    emptyText: 'label_no_cards_recorded_yet',
    // Sort by red first (heavier), then yellow
    sortKey: (s) => (s.red_cards || 0) * 100 + (s.yellow_cards || 0),
    isVisible: (s) => (s.yellow_cards || 0) > 0 || (s.red_cards || 0) > 0,
    columns: [
      {
        label: 'label_yellow_cards_plural_short',
        icon: 'mdi:card',
        iconColor: 'warning.main',
        key: 'yellow_cards',
      },
      {
        label: 'label_red_cards_plural_short',
        icon: 'mdi:card',
        iconColor: 'error.main',
        key: 'red_cards',
      },
      {
        label: 'label_total',
        key: '_total',
        derive: (s) => (s.yellow_cards || 0) + (s.red_cards || 0),
        primary: true,
      },
    ],
  },
};

// ----------------------------------------------------------------------

export function PlayerRankingTable({
  tournamentId,
  metric = 'goals',
  limit = 50,
  publicMode = false,
}) {
  const { t } = useTranslation();
  const meta = METRICS[metric] || METRICS.goals;

  const authPlayers = useGetPlayers(publicMode ? null : tournamentId);
  const pubPlayers = useGetPublicPlayers(publicMode ? tournamentId : null);
  const { players, playersLoading } = publicMode ? pubPlayers : authPlayers;

  const authTeams = useGetTeams(publicMode ? null : tournamentId);
  const pubTeams = useGetPublicTeams(publicMode ? tournamentId : null);
  const { teams } = publicMode ? pubTeams : authTeams;

  const rows = useMemo(() => {
    const teamLookup = new Map((teams || []).map((team) => [team.id, team]));
    return (players || [])
      .map((p) => ({
        player_id: p.id,
        player_name: p.name,
        player_number: p.number,
        team_id: p.team_id,
        team_name: teamLookup.get(p.team_id)?.name || '',
        team_short_name: teamLookup.get(p.team_id)?.short_name || '',
        stats: p.stats || {},
      }))
      .filter((r) => meta.isVisible(r.stats))
      .sort((a, b) => meta.sortKey(b.stats) - meta.sortKey(a.stats))
      .slice(0, limit)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [players, teams, meta, limit]);

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>{t('label_player_singular')}</TableCell>
              <TableCell>{t('team')}</TableCell>
              {meta.columns.map((col) => (
                <TableCell key={col.label} align="center">
                  <Tooltip title={t(col.label)}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      {col.icon && (
                        <Iconify
                          icon={col.icon}
                          width={16}
                          sx={{
                            color:
                              col.iconColor || (col.muted ? 'text.disabled' : 'text.secondary'),
                          }}
                        />
                      )}
                      <Typography variant="caption">{t(col.label)}</Typography>
                    </Stack>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {playersLoading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {[...Array(3 + meta.columns.length)].map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!playersLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3 + meta.columns.length} sx={{ py: 0, border: 0 }}>
                  <Stack alignItems="center" spacing={1} sx={{ py: 5 }}>
                    <Iconify icon={meta.icon} width={32} sx={{ color: 'text.disabled' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t(meta.emptyText)}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {rows.map((r) => (
              <TableRow
                key={r.player_id}
                sx={{
                  ...(r.rank === 1 && { bgcolor: 'warning.lighter' }),
                  ...(r.rank > 1 && r.rank < 4 && { bgcolor: 'success.lighter' }),
                }}
              >
                <TableCell>
                  <Typography variant="subtitle2">
                    {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">
                    {r.player_number ? `#${r.player_number} ` : ''}
                    {r.player_name || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={r.team_short_name || r.team_name || '—'}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                {meta.columns.map((col) => {
                  const raw = col.derive ? col.derive(r.stats) : r.stats[col.key];
                  const value = raw == null ? 0 : raw;
                  return (
                    <TableCell key={col.label} align="center">
                      {col.primary ? (
                        <Typography variant="subtitle1" color="primary">
                          {value}
                        </Typography>
                      ) : value > 0 ? (
                        <Typography
                          variant="body2"
                          sx={{ color: col.muted ? 'error.main' : 'text.primary' }}
                        >
                          {value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
