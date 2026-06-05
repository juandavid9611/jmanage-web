import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useGetTeamCards, useGetTeamDiscipline } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const CARD_META = {
  yellow_card: { color: 'warning', short: 'A' },
  second_yellow: { color: 'warning', short: '2A' },
  red_card: { color: 'error', short: 'R' },
};

export function TeamDisciplineTable({ tournamentId, onNavigateToMatch }) {
  const { teamDiscipline, teamDisciplineLoading } = useGetTeamDiscipline(tournamentId);

  if (teamDisciplineLoading) {
    return (
      <Stack spacing={1}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Stack>
    );
  }

  if (!teamDiscipline?.length) {
    return <EmptyContent title="Sin tarjetas todavía" sx={{ py: 6 }} />;
  }

  return (
    <Stack spacing={0.75}>
      {teamDiscipline.map((team) => (
        <TeamRow
          key={team.team_id}
          team={team}
          tournamentId={tournamentId}
          onNavigateToMatch={onNavigateToMatch}
        />
      ))}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function TeamRow({ team, tournamentId, onNavigateToMatch }) {
  const [open, setOpen] = useState(false);
  const hasAny = (team.players || []).length > 0;

  // Lazy drill-down: fetch the per-card list only when the row is expanded
  const { teamCards, teamCardsLoading } = useGetTeamCards(
    open ? tournamentId : null,
    open ? team.team_id : null
  );
  const cardsByPlayer = (teamCards || []).reduce((acc, row) => {
    acc[row.player_id] = row.cards || [];
    return acc;
  }, {});

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => hasAny && setOpen((v) => !v)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto 32px',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.25,
          cursor: hasAny ? 'pointer' : 'default',
          '&:hover': hasAny ? { bgcolor: (t) => alpha(t.palette.grey[500], 0.03) } : {},
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          {team.logo_url ? (
            <Avatar src={team.logo_url} variant="rounded" sx={{ width: 28, height: 28 }} />
          ) : (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
              }}
            />
          )}
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {team.name}
            </Typography>
            {team.short_name && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {team.short_name}
              </Typography>
            )}
          </Stack>
        </Stack>

        <CardCountChip count={team.yellow_cards} kind="yellow_card" />
        <CardCountChip count={team.red_cards} kind="red_card" />

        <Typography variant="subtitle2" sx={{ minWidth: 28, textAlign: 'right', fontWeight: 700 }}>
          {team.total_cards}
        </Typography>

        <IconButton
          size="small"
          disabled={!hasAny}
          sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
        >
          <Iconify
            icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
            width={18}
          />
        </IconButton>
      </Box>

      <Collapse in={open && hasAny} unmountOnExit>
        <Box
          sx={{
            borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.02),
            px: 1.5,
            py: 1,
          }}
        >
          <Stack spacing={0.5}>
            {(team.players || []).map((p) => (
              <PlayerRow
                key={p.player_id}
                player={p}
                cards={cardsByPlayer[p.player_id] || []}
                cardsLoading={teamCardsLoading}
                tournamentId={tournamentId}
                onNavigateToMatch={onNavigateToMatch}
              />
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

// ----------------------------------------------------------------------

function PlayerRow({ player, cards, cardsLoading, tournamentId, onNavigateToMatch }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 1.5,
        alignItems: 'center',
        px: 1,
        py: 0.75,
        borderRadius: 0.75,
        '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.04) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" sx={{ minWidth: 28, color: 'text.disabled' }}>
          {player.number != null ? `#${player.number}` : ''}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {player.name}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {cardsLoading && cards.length === 0 ? (
          <Skeleton variant="rounded" height={22} width={100} />
        ) : (
          cards.map((card, idx) => (
            <CardChip
              key={card.event_id || `${card.match_id}-${idx}`}
              card={card}
              tournamentId={tournamentId}
              onNavigateToMatch={onNavigateToMatch}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function CardCountChip({ count, kind }) {
  const meta = CARD_META[kind] || CARD_META.yellow_card;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 36 }}>
      <Iconify icon="mdi:card" width={14} sx={{ color: `${meta.color}.main` }} />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: count > 0 ? `${meta.color}.main` : 'text.disabled',
        }}
      >
        {count}
      </Typography>
    </Stack>
  );
}

function CardChip({ card, tournamentId, onNavigateToMatch }) {
  const navigate = useNavigate();
  const meta = CARD_META[card.type] || CARD_META.yellow_card;
  const mwLabel = card.matchweek != null ? `J${card.matchweek}` : null;
  const vsLabel = card.opponent_name ? `vs ${card.opponent_name}` : '';
  const title = [mwLabel, card.match_label, vsLabel].filter(Boolean).join(' · ');

  const handleClick = () => {
    if (onNavigateToMatch) {
      onNavigateToMatch(card.match_id);
      return;
    }
    navigate(paths.dashboard.tournament.matchDetail(tournamentId, card.match_id));
  };

  return (
    <Tooltip title={title}>
      <Chip
        size="small"
        clickable
        onClick={handleClick}
        icon={<Iconify icon="mdi:card" width={14} />}
        label={
          <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
            {mwLabel ? `${mwLabel} · ` : ''}
            {card.minute}&#39;
            {vsLabel ? ` · ${vsLabel}` : ''}
          </Box>
        }
        color={meta.color}
        variant="soft"
        sx={{ height: 22 }}
      />
    </Tooltip>
  );
}
