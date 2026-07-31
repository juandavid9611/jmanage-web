import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useDebounce } from 'src/hooks/use-debounce';

import { Iconify } from 'src/components/iconify';

import { MatchList } from './match-row';

// ----------------------------------------------------------------------

export function PlayerSearchBox({ players, teams, matches, tournamentId, onMatchClick }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return players.filter((player) => player.name?.toLowerCase().includes(q));
  }, [players, debouncedQuery]);

  const teamNameFor = (teamId) => teams?.find((team) => team.id === teamId)?.name || '';

  const teamMatches = useMemo(() => {
    if (!selectedPlayer) return [];
    return matches.filter(
      (m) => m.home_team_id === selectedPlayer.team_id || m.away_team_id === selectedPlayer.team_id
    );
  }, [matches, selectedPlayer]);

  return (
    <Box>
      <Autocomplete
        sx={{ width: { xs: 1, sm: 320 } }}
        options={results}
        autoHighlight
        popupIcon={null}
        inputValue={query}
        value={selectedPlayer}
        onInputChange={(event, newValue) => setQuery(newValue)}
        onChange={(event, newValue) => setSelectedPlayer(newValue)}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={t('label_no_players_found')}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={t('label_search_player_placeholder')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, player) => (
          <Box component="li" {...props} key={player.id}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {player.name}
              </Typography>
              {player.number != null && (
                <Chip
                  label={`#${player.number}`}
                  size="small"
                  variant="soft"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {teamNameFor(player.team_id)}
              </Typography>
            </Stack>
          </Box>
        )}
      />

      {selectedPlayer && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
            border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="subtitle2">
              {selectedPlayer.name} · {teamNameFor(selectedPlayer.team_id)}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedPlayer(null)}>
              <Iconify icon="eva:close-fill" width={18} />
            </IconButton>
          </Stack>

          {teamMatches.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}
            >
              {t('label_no_matches_scheduled_yet')}
            </Typography>
          ) : (
            <MatchList
              matches={teamMatches}
              teams={teams}
              players={players}
              tournamentId={tournamentId}
              onMatchClick={onMatchClick}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
