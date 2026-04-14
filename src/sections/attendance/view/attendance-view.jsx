import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { orderBy } from 'src/utils/helper';
import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { patchBooker, useGetTours } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const YEAR = 2026;
const PLAYER_COL_WIDTH = 160;
const SESSION_COL_WIDTH = 52;
const GROUP_ROW_HEIGHT = 28;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS = { ASISTIO: 'asistio', AVISO: 'aviso', AUSENTE: 'ausente' };

const STATUS_CONFIG = {
  [STATUS.ASISTIO]: { icon: 'solar:check-circle-bold',  color: 'success.main', label: 'Asistio'    },
  [STATUS.AVISO]:   { icon: 'solar:danger-circle-bold', color: 'warning.main', label: 'Aviso'      },
  [STATUS.AUSENTE]: { icon: 'solar:close-circle-bold',  color: 'error.main',   label: 'No asistio' },
};

const SORT_OPTIONS = [
  { value: 'name',     icon: 'solar:sort-by-alphabet-bold',         tooltip: 'Ordenar A→Z'      },
  { value: 'pct_desc', icon: 'solar:sort-from-top-to-bottom-bold',  tooltip: 'Mayor % primero'  },
  { value: 'pct_asc',  icon: 'solar:sort-from-bottom-to-top-bold',  tooltip: 'Menor % primero'  },
];

function getDateParts(startDate) {
  if (!startDate) return null;
  try {
    const d = new Date(startDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  } catch {
    return null;
  }
}

function getStatus(bookers, playerId) {
  const entry = bookers?.[playerId];
  if (!entry) return STATUS.AUSENTE;
  return entry.approved ? STATUS.ASISTIO : STATUS.AVISO;
}

function CornerCell({ children, topOffset = 0, sx }) {
  return (
    <Box
      sx={{
        width: PLAYER_COL_WIDTH,
        minWidth: PLAYER_COL_WIDTH,
        position: 'sticky',
        left: 0,
        top: topOffset,
        zIndex: 5,
        bgcolor: 'background.paper',
        borderRight: (t) => `1px solid ${t.palette.divider}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function AttendanceView() {
  const navigate = useNavigate();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const { user } = useAuthContext();
  const { tours, toursLoading } = useGetTours(selectedWorkspace?.id, 'training');
  const isAdminOrCoach = workspaceRole === 'admin' || workspaceRole === 'coach';

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [search, setSearch]               = useState('');
  const [sortBy, setSortBy]               = useState('name');
  const [localSessions, setLocalSessions] = useState(null);

  const sourceTours = localSessions ?? tours;

  const allSessions = orderBy(
    sourceTours.filter((t) => getDateParts(t.available?.startDate)?.year === YEAR),
    ['available.startDate'],
    ['asc']
  );

  const sessions =
    selectedMonth === null
      ? allSessions
      : allSessions.filter((t) => getDateParts(t.available?.startDate)?.month === selectedMonth);

  const monthCounts = {};
  allSessions.forEach((t) => {
    const m = getDateParts(t.available?.startDate)?.month;
    if (m != null) monthCounts[m] = (monthCounts[m] || 0) + 1;
  });
  const availableMonths = Object.keys(monthCounts).map(Number).sort((a, b) => a - b);

  const monthGroups = [];
  sessions.forEach((s) => {
    const m = getDateParts(s.available?.startDate)?.month;
    if (monthGroups.length === 0 || monthGroups[monthGroups.length - 1].month !== m) {
      monthGroups.push({ month: m, count: 1 });
    } else {
      monthGroups[monthGroups.length - 1].count += 1;
    }
  });
  const showGroupRow = selectedMonth === null && monthGroups.length > 1;
  const dateRowTop   = showGroupRow ? GROUP_ROW_HEIGHT : 0;

  const playerMap = {};
  allSessions.forEach((session) => {
    Object.values(session.bookers || {}).forEach((booker) => {
      if (!playerMap[booker.id]) {
        playerMap[booker.id] = { id: booker.id, name: booker.name, avatarUrl: booker.avatarUrl };
      }
    });
  });

  const playersWithStats = Object.values(playerMap).map((player) => {
    const attended = sessions.filter(
      (s) => getStatus(s.bookers, player.id) === STATUS.ASISTIO
    ).length;
    const pct = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0;
    return { ...player, attended, pct };
  });

  const visiblePlayers = isAdminOrCoach
    ? playersWithStats
    : playersWithStats.filter((p) => p.id === user?.sub);

  const searchLower = search.toLowerCase();
  const filtered = searchLower
    ? visiblePlayers.filter((p) => p.name?.toLowerCase().includes(searchLower))
    : visiblePlayers;

  const players = [...filtered].sort((a, b) => {
    if (sortBy === 'pct_desc') return b.pct - a.pct;
    if (sortBy === 'pct_asc')  return a.pct - b.pct;
    return (a.name || '').localeCompare(b.name || '');
  });

  const isEmpty      = !toursLoading && allSessions.length === 0;
  const sortConfig   = SORT_OPTIONS.find((o) => o.value === sortBy);
  const nextSort     = SORT_OPTIONS[(SORT_OPTIONS.findIndex((o) => o.value === sortBy) + 1) % SORT_OPTIONS.length];

  const handleToggle = useCallback(
    async (session, playerId) => {
      const entry = session.bookers?.[playerId];
      if (!entry) return;

      const newApproved = !entry.approved;
      const base = localSessions ?? tours;

      setLocalSessions(
        base.map((s) =>
          s.id !== session.id
            ? s
            : { ...s, bookers: { ...s.bookers, [playerId]: { ...entry, approved: newApproved } } }
        )
      );

      try {
        await patchBooker(
          session.id,
          playerId,
          { name: 'approved', value: String(newApproved) },
          selectedWorkspace?.id
        );
      } catch (err) {
        setLocalSessions(base);
        toast.error('Error actualizando asistencia');
      }
    },
    [localSessions, tours, selectedWorkspace?.id]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Entrenamientos"
        links={[{ name: 'Entrenamientos' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toolbar — month tabs + search + sort + legend in one prominent row */}
      <Card sx={{ mb: { xs: 3, md: 5 }, px: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          sx={{ minHeight: 56 }}
        >
          {/* Month tabs */}
          {availableMonths.length > 0 && (
            <Tabs
              value={selectedMonth ?? false}
              onChange={(_, val) => setSelectedMonth(val === selectedMonth ? null : val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flex: 1, minWidth: 0 }}
            >
              {availableMonths.map((month) => (
                <Tab
                  key={month}
                  value={month}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <span>{MONTH_NAMES[month]}</span>
                      <Chip
                        label={monthCounts[month]}
                        size="small"
                        variant={selectedMonth === month ? 'filled' : 'soft'}
                        color={selectedMonth === month ? 'primary' : 'default'}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, pointerEvents: 'none' }}
                      />
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          )}

          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

          {/* Legend */}
          <Stack direction="row" spacing={1.5} sx={{ px: 1 }}>
            {Object.values(STATUS_CONFIG).map(({ icon, color, label }) => (
              <Tooltip key={label} title={label}>
                <Iconify icon={icon} width={20} sx={{ color, cursor: 'default' }} />
              </Tooltip>
            ))}
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

          {/* Search */}
          <TextField
            size="small"
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200, my: 1 }}
          />

          {/* Sort */}
          <Tooltip title={nextSort.tooltip}>
            <IconButton size="small" onClick={() => setSortBy(nextSort.value)} sx={{ mr: 0.5 }}>
              <Iconify icon={sortConfig.icon} width={20} />
            </IconButton>
          </Tooltip>

          {/* Nueva Votación — admin only */}
          {isAdminOrCoach && (
            <>
              <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:cup-star-bold" />}
                onClick={() =>
                  navigate(paths.dashboard.votaciones.new, {
                    state: { tours: sourceTours },
                  })
                }
                sx={{ flexShrink: 0, mr: 0.5 }}
              >
                Nueva Votación
              </Button>
            </>
          )}
        </Stack>
      </Card>

      {isEmpty && (
        <EmptyContent title={`Sin sesiones de entrenamiento en ${YEAR}`} sx={{ py: 8 }} />
      )}

      {!isEmpty && sessions.length > 0 && (
        <Card>
          <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <Box sx={{ minWidth: PLAYER_COL_WIDTH + sessions.length * SESSION_COL_WIDTH }}>

              {/* Month group header row */}
              {showGroupRow && (
                <Box
                  sx={{
                    display: 'flex',
                    height: GROUP_ROW_HEIGHT,
                    position: 'sticky',
                    top: 0,
                    zIndex: 4,
                    bgcolor: 'background.paper',
                    borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.6)}`,
                  }}
                >
                  <CornerCell topOffset={0} sx={{ height: GROUP_ROW_HEIGHT }} />
                  {monthGroups.map((group, i) => (
                    <Box
                      key={group.month}
                      sx={{
                        width: group.count * SESSION_COL_WIDTH,
                        minWidth: group.count * SESSION_COL_WIDTH,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: i < monthGroups.length - 1
                          ? (t) => `2px solid ${t.palette.divider}`
                          : 'none',
                        bgcolor: i % 2 === 0
                          ? (t) => alpha(t.palette.primary.main, 0.04)
                          : 'transparent',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                        {MONTH_NAMES[group.month].toUpperCase()}
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ flex: 1 }} />
                </Box>
              )}

              {/* Date header row */}
              <Box
                sx={{
                  display: 'flex',
                  position: 'sticky',
                  top: dateRowTop,
                  zIndex: 4,
                  bgcolor: 'background.paper',
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <CornerCell topOffset={dateRowTop} sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.4 }}>
                    JUGADOR
                  </Typography>
                  <Tooltip title={nextSort.tooltip}>
                    <IconButton size="small" onClick={() => setSortBy(nextSort.value)} sx={{ ml: 'auto', p: 0.25 }}>
                      <Iconify icon={sortConfig.icon} width={14} sx={{ color: 'text.disabled' }} />
                    </IconButton>
                  </Tooltip>
                </CornerCell>

                {sessions.map((session, i) => {
                  const month    = getDateParts(session.available?.startDate)?.month;
                  const prevMonth = i > 0 ? getDateParts(sessions[i - 1].available?.startDate)?.month : month;
                  return (
                    <Tooltip key={session.id} title={session.name} placement="top">
                      <Box
                        sx={{
                          width: SESSION_COL_WIDTH,
                          minWidth: SESSION_COL_WIDTH,
                          px: 0.5,
                          py: 1,
                          textAlign: 'center',
                          borderLeft: month !== prevMonth && !showGroupRow
                            ? (t) => `2px solid ${t.palette.divider}`
                            : 'none',
                          borderRight: (t) => `1px solid ${alpha(t.palette.divider, 0.5)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2 }}>
                          {fDate(session.available?.startDate, 'DD/MM')}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
                <Box sx={{ flex: 1 }} />
              </Box>

              {/* Player rows */}
              <Stack divider={<Divider />}>
                {players.map((player) => (
                  <Box
                    key={player.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.04) },
                    }}
                  >
                    {/* Sticky name column */}
                    <Box
                      sx={{
                        width: PLAYER_COL_WIDTH,
                        minWidth: PLAYER_COL_WIDTH,
                        px: 1.5,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        borderRight: (t) => `1px solid ${t.palette.divider}`,
                      }}
                    >
                      <Avatar src={player.avatarUrl} alt={player.name} sx={{ width: 28, height: 28, flexShrink: 0, fontSize: '0.75rem' }}>
                        {player.name?.charAt(0)}
                      </Avatar>
                      <Stack sx={{ minWidth: 0 }}>
                        <Tooltip title={player.name} placement="right">
                          <Typography variant="caption" fontWeight={600} noWrap>
                            {player.name}
                          </Typography>
                        </Tooltip>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            lineHeight: 1,
                            color: player.pct >= 80 ? 'success.main' : player.pct >= 50 ? 'warning.main' : 'error.main',
                          }}
                        >
                          {player.pct}%
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Session cells */}
                    {sessions.map((session, i) => {
                      const month     = getDateParts(session.available?.startDate)?.month;
                      const prevMonth = i > 0 ? getDateParts(sessions[i - 1].available?.startDate)?.month : month;
                      const status    = getStatus(session.bookers, player.id);
                      const { icon, color, label } = STATUS_CONFIG[status];
                      const isInteractive = isAdminOrCoach && status !== STATUS.AUSENTE;

                      return (
                        <Tooltip key={session.id} title={isInteractive ? `${label} — clic para cambiar` : label} placement="top">
                          <Box
                            onClick={isInteractive ? () => handleToggle(session, player.id) : undefined}
                            sx={{
                              width: SESSION_COL_WIDTH,
                              minWidth: SESSION_COL_WIDTH,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              py: 1.25,
                              cursor: isInteractive ? 'pointer' : 'default',
                              borderLeft: month !== prevMonth && !showGroupRow
                                ? (t) => `2px solid ${t.palette.divider}`
                                : 'none',
                              borderRight: (t) => `1px solid ${alpha(t.palette.divider, 0.5)}`,
                              '&:hover': isInteractive
                                ? { bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }
                                : {},
                            }}
                          >
                            <Iconify icon={icon} width={20} sx={{ color }} />
                          </Box>
                        </Tooltip>
                      );
                    })}
                    <Box sx={{ flex: 1 }} />
                  </Box>
                ))}
              </Stack>

              {/* Summary row */}
              {players.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderTop: (t) => `2px solid ${t.palette.divider}`,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                  }}
                >
                  <Box
                    sx={{
                      width: PLAYER_COL_WIDTH,
                      minWidth: PLAYER_COL_WIDTH,
                      px: 1.5,
                      py: 1,
                      position: 'sticky',
                      left: 0,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.06),
                      zIndex: 2,
                      borderRight: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.4 }}>
                      TOTAL
                    </Typography>
                  </Box>

                  {sessions.map((session) => {
                    const attended = players.filter((p) => getStatus(session.bookers, p.id) === STATUS.ASISTIO).length;
                    const pct = Math.round((attended / players.length) * 100);
                    return (
                      <Box
                        key={session.id}
                        sx={{
                          width: SESSION_COL_WIDTH,
                          minWidth: SESSION_COL_WIDTH,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 0.75,
                          borderRight: (t) => `1px solid ${alpha(t.palette.divider, 0.5)}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6rem',
                            lineHeight: 1.2,
                            color: pct >= 80 ? 'success.main' : pct >= 50 ? 'warning.main' : 'error.main',
                          }}
                        >
                          {attended}/{players.length}
                        </Typography>
                      </Box>
                    );
                  })}
                  <Box sx={{ flex: 1 }} />
                </Box>
              )}

            </Box>
          </Box>
        </Card>
      )}

    </DashboardContent>
  );
}
