import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { Checkbox } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Pagination from '@mui/material/Pagination';
import ListItemText from '@mui/material/ListItemText';

import { patchBooker } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Iconify } from 'src/components/iconify';

import { IncrementerButton } from './components/incrementer-button';

// ----------------------------------------------------------------------

export function TourDetailsBookers({ tourId, bookers: initialBookers }) {
  const [bookers, setBookers] = useState(initialBookers);
  const { selectedWorkspace } = useWorkspace();

  const handleClick = useCallback(
    async (booker, field, newValue) => {
      try {
        const bookerData = {
          name: field,
          value: String(newValue),
        };
        await patchBooker(tourId, booker.id, bookerData, selectedWorkspace?.id);
      } catch (error) {
        toast.error('Error setting booker data');
        console.error(error);
      }
      setBookers((prevBookers) =>
        prevBookers.map((bookerItem) =>
          bookerItem.id === booker.id ? { ...bookerItem, [field]: newValue } : bookerItem
        )
      );
    },
    [tourId, selectedWorkspace?.id]
  );

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      >
        {bookers.map((booker) => (
          <BookerItem
            key={booker.id}
            booker={booker}
            selected={booker.approved}
            onSelected={(field, newValue) => handleClick(booker, field, newValue)}
          />
        ))}
      </Box>

      <Pagination count={10} sx={{ mt: { xs: 5, md: 8 }, mx: 'auto' }} />
    </>
  );
}

function BookerItem({ booker, onSelected }) {
  return (
    <Card key={booker.id} sx={{ p: 2, gap: 2, display: 'flex' }}>
      <Stack spacing={2} direction="column">
        <Avatar alt={booker.name} src={booker.avatarUrl} sx={{ width: 48, height: 48 }} />
        <Checkbox
          color="warning"
          icon={<Iconify icon="solar:star-outline" />}
          checkedIcon={<Iconify icon="solar:star-bold" />}
          inputProps={{ id: 'mvp-checkbox', 'aria-label': 'Mvp checkbox' }}
          checked={booker.mvp}
          onClick={() => onSelected('mvp', !booker.mvp)}
        />
      </Stack>

      <Stack spacing={2} flexGrow={1}>
        <ListItemText
          primary={booker.name}
          secondary={
            <Button
              size="small"
              variant={booker.approved ? 'text' : 'outlined'}
              color={booker.approved ? 'success' : 'inherit'}
              startIcon={
                booker.approved ? (
                  <Iconify width={18} icon="eva:checkmark-fill" sx={{ mr: -0.75 }} />
                ) : null
              }
              onClick={() => onSelected('approved', !booker.approved)}
            >
              {booker.approved ? 'Approved' : 'Approve'}
            </Button>
          }
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
            color: 'text.disabled',
          }}
        />

        <Stack spacing={1} direction="row">
          <ListItemText
            primary="Goals"
            secondary={
              <IncrementerButton
                name="booker.goals"
                quantity={booker.goals}
                disabledDecrease={booker.goals <= 0}
                disabledIncrease={booker.goals >= 20}
                onIncrease={() => onSelected('goals', booker.goals + 1)}
                onDecrease={() => onSelected('goals', booker.goals - 1)}
              />
            }
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
              color: 'text.disabled',
            }}
          />
          <ListItemText
            primary="Assists"
            secondary={
              <IncrementerButton
                name="booker.assists"
                quantity={booker.assists}
                disabledDecrease={booker.assists <= 0}
                disabledIncrease={booker.assists >= 20}
                onIncrease={() => onSelected('assists', booker.assists + 1)}
                onDecrease={() => onSelected('assists', booker.assists - 1)}
              />
            }
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
              color: 'text.disabled',
            }}
          />
        </Stack>
      </Stack>

      <Stack spacing={1} direction="column" flexGrow={1}>
        <Checkbox
          color="info"
          icon={<Iconify icon="mdi:clock-alert-outline" />}
          checkedIcon={<Iconify icon="mdi:clock-alert" />}
          inputProps={{ id: 'late-checkbox', 'aria-label': 'Late checkbox' }}
          checked={booker.late}
          onClick={() => onSelected('late', !booker.late)}
        />
        <Checkbox
          color="warning"
          icon={<Iconify icon="mdi:card-outline" />}
          checkedIcon={<Iconify icon="mdi:card" />}
          inputProps={{ id: 'yellow-card-checkbox', 'aria-label': 'Yellow card checkbox' }}
          checked={booker.yellowCard}
          onClick={() => onSelected('yellowCard', !booker.yellowCard)}
        />
        <Checkbox
          color="error"
          icon={<Iconify icon="mdi:card-remove-outline" />}
          checkedIcon={<Iconify icon="mdi:card-remove" />}
          inputProps={{ id: 'red-card-checkbox', 'aria-label': 'Red card checkbox' }}
          checked={booker.redCard}
          onClick={() => onSelected('redCard', !booker.redCard)}
        />
      </Stack>
    </Card>
  );
}
