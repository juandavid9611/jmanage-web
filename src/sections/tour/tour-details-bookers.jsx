import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { patchBooker } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Iconify } from 'src/components/iconify';

import { IncrementerButton } from './components/incrementer-button';

// ----------------------------------------------------------------------

export function TourDetailsBookers({ tourId, bookers: initialBookers }) {
  const [bookers, setBookers]  = useState(initialBookers);
  const { selectedWorkspace }  = useWorkspace();

  const handleClick = useCallback(
    async (booker, field, newValue) => {
      try {
        await patchBooker(tourId, booker.id, { name: field, value: String(newValue) }, selectedWorkspace?.id);
      } catch (error) {
        toast.error('Error actualizando jugador');
        console.error(error);
      }
      setBookers((prev) =>
        prev.map((b) => (b.id === booker.id ? { ...b, [field]: newValue } : b))
      );
    },
    [tourId, selectedWorkspace?.id]
  );

  const maxGoals   = Math.max(...bookers.map((b) => b.goals), 1);
  const approved   = bookers.filter((b) => b.approved).length;
  const unapproved = bookers.length - approved;

  return (
    <Card>
      {/* Header summary */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2, bgcolor: (t) => alpha(t.palette.grey[500], 0.04) }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Iconify icon="mdi:account-group" width={20} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Plantilla del Partido
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${approved} confirmados`}
            size="small"
            color="success"
            variant="soft"
            sx={{ fontWeight: 700 }}
          />
          {unapproved > 0 && (
            <Chip
              label={`${unapproved} pendientes`}
              size="small"
              color="warning"
              variant="soft"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
      </Stack>

      <Divider />

      {/* Column labels */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 90px 100px 80px 80px',
          gap: 1,
          px: 2.5,
          py: 1,
          bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.1)}`,
        }}
      >
        {['', 'Jugador', 'Contribución', 'Goles/Asist.', 'Incidencias', 'Estado'].map((h) => (
          <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: 0.4, fontSize: '0.65rem' }}>
            {h.toUpperCase()}
          </Typography>
        ))}
      </Box>

      {/* Player rows */}
      <Stack divider={<Divider sx={{ mx: 2.5 }} />}>
        {bookers.map((booker) => (
          <PlayerRow
            key={booker.id}
            booker={booker}
            maxGoals={maxGoals}
            onSelected={(field, val) => handleClick(booker, field, val)}
          />
        ))}
      </Stack>
    </Card>
  );
}

// ── PlayerRow ──────────────────────────────────────────────────────────

function PlayerRow({ booker, maxGoals, onSelected }) {
  const contribution = booker.goals + booker.assists;
  const maxContrib   = maxGoals + 3; // rough scale ceiling

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 90px 100px 80px 80px',
        gap: 1,
        alignItems: 'center',
        px: 2.5,
        py: 1.25,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.04) },
      }}
    >
      {/* Avatar */}
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={booker.avatarUrl}
          alt={booker.name}
          sx={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}
        >
          {booker.name?.charAt(0)}
        </Avatar>
        {booker.mvp && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: 'background.paper',
            }}
          >
            <Iconify icon="solar:star-bold" width={7} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>

      {/* Name + contribution bar */}
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700, lineHeight: 1 }}>
          {booker.name}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <LinearProgress
            variant="determinate"
            value={contribution > 0 ? Math.min((contribution / maxContrib) * 100, 100) : 0}
            sx={{
              width: 56,
              height: 3,
              borderRadius: 2,
              bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
              '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: booker.mvp ? 'warning.main' : 'primary.main' },
            }}
          />
          {contribution > 0 && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 700 }}>
              {contribution}pts
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Contribution bar (big) — hidden on small, colspanned visually */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {booker.goals > 0 && (
          <Chip
            icon={<Iconify icon="mdi:soccer" width={12} />}
            label={booker.goals}
            size="small"
            color="primary"
            variant="soft"
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, '& .MuiChip-icon': { ml: 0.5 } }}
          />
        )}
        {booker.assists > 0 && (
          <Chip
            icon={<Iconify icon="mdi:shoe-cleat" width={12} />}
            label={booker.assists}
            size="small"
            color="warning"
            variant="soft"
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, '& .MuiChip-icon': { ml: 0.5 } }}
          />
        )}
        {booker.goals === 0 && booker.assists === 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
        )}
      </Stack>

      {/* Goals + assists incrementers */}
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mdi:soccer" width={11} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <IncrementerButton
            name="goals"
            quantity={booker.goals}
            disabledDecrease={booker.goals <= 0}
            disabledIncrease={booker.goals >= 20}
            onIncrease={() => onSelected('goals', booker.goals + 1)}
            onDecrease={() => onSelected('goals', booker.goals - 1)}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mdi:shoe-cleat" width={11} sx={{ color: 'warning.main', flexShrink: 0 }} />
          <IncrementerButton
            name="assists"
            quantity={booker.assists}
            disabledDecrease={booker.assists <= 0}
            disabledIncrease={booker.assists >= 20}
            onIncrease={() => onSelected('assists', booker.assists + 1)}
            onDecrease={() => onSelected('assists', booker.assists - 1)}
          />
        </Stack>
      </Stack>

      {/* Incidents */}
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Tooltip title="MVP">
          <Checkbox
            size="small"
            color="warning"
            checked={booker.mvp}
            icon={<Iconify icon="solar:star-outline" width={16} />}
            checkedIcon={<Iconify icon="solar:star-bold" width={16} />}
            onClick={() => onSelected('mvp', !booker.mvp)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title="Llegada tarde">
          <Checkbox
            size="small"
            color="info"
            checked={booker.late}
            icon={<Iconify icon="mdi:clock-alert-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:clock-alert" width={16} />}
            onClick={() => onSelected('late', !booker.late)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title="Tarjeta amarilla">
          <Checkbox
            size="small"
            color="warning"
            checked={booker.yellowCard}
            icon={<Iconify icon="mdi:card-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:card" width={16} />}
            onClick={() => onSelected('yellowCard', !booker.yellowCard)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title="Tarjeta roja">
          <Checkbox
            size="small"
            color="error"
            checked={booker.redCard}
            icon={<Iconify icon="mdi:card-remove-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:card-remove" width={16} />}
            onClick={() => onSelected('redCard', !booker.redCard)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
      </Stack>

      {/* Status */}
      <Button
        size="small"
        variant={booker.approved ? 'soft' : 'outlined'}
        color={booker.approved ? 'success' : 'inherit'}
        startIcon={booker.approved ? <Iconify icon="eva:checkmark-fill" width={14} /> : null}
        onClick={() => onSelected('approved', !booker.approved)}
        sx={{ fontSize: '0.7rem', fontWeight: 700, minWidth: 0, px: 1.25, py: 0.5 }}
      >
        {booker.approved ? 'Conf.' : 'Aprobar'}
      </Button>
    </Box>
  );
}
