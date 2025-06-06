import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime, fDateRangeShortLabel } from 'src/utils/format-time';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function TourItem({ tour, onView, onEdit, onDelete }) {
  const popover = usePopover();
  const { user } = useAuthContext();
  const isAdmin = user.role === 'admin';
  const userAssists = Object.keys(tour?.bookers).includes(user.id);

  const renderRating = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        top: 8,
        right: 8,
        zIndex: 9,
        borderRadius: 1,
        position: 'absolute',
        p: '2px 6px 2px 4px',
        typography: 'subtitle2',
        bgcolor:
          tour.scores.home > tour.scores.away
            ? 'success.lighter'
            : tour.scores.home === tour.scores.away
              ? 'warning.lighter'
              : 'error.lighter',
        color:
          tour.scores.home > tour.scores.away
            ? 'success.dark'
            : tour.scores.home === tour.scores.away
              ? 'warning.dark'
              : 'error.dark',
      }}
    >
      <Iconify
        icon={
          tour.scores.home > tour.scores.away
            ? 'eva:star-fill'
            : tour.scores.home === tour.scores.away
              ? 'eva:minus-fill'
              : 'eva:close-fill'
        }
        sx={{
          color:
            tour.scores.home > tour.scores.away
              ? 'success.main'
              : tour.scores.home === tour.scores.away
                ? 'warning.main'
                : 'error.main',
          mr: 0.25,
        }}
      />
      {tour.scores.home > tour.scores.away
        ? 'Victory'
        : tour.scores.home === tour.scores.away
          ? 'Draw'
          : 'Lose'}
    </Stack>
  );

  const renderImages = tour?.images?.length > 0 && (
    <Box gap={0.5} display="flex" sx={{ p: 1 }}>
      <Box flexGrow={1} sx={{ position: 'relative' }}>
        {renderRating}
        <Image
          alt={tour.images[0]}
          src={tour.images[0]}
          sx={{ width: 1, height: 164, borderRadius: 1 }}
        />
      </Box>

      <Box gap={0.5} display="flex" flexDirection="column">
        <Image
          alt={tour.images[1]}
          src={tour.images[1]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80, height: 80 }}
        />
        <Image
          alt={tour.images[2]}
          src={tour.images[2]}
          ratio="1/1"
          sx={{ borderRadius: 1, width: 80, height: 80 }}
        />
      </Box>
    </Box>
  );

  const renderTexts = (
    <ListItemText
      sx={{ p: (theme) => theme.spacing(2.5, 2.5, 2, 2.5) }}
      primary={`Posted date: ${fDateTime(tour.createdAt)}`}
      secondary={
        <Link
          component={RouterLink}
          href={paths.dashboard.admin.tour.details(tour.id)}
          color="inherit"
        >
          {tour.name}
        </Link>
      }
      primaryTypographyProps={{ typography: 'caption', color: 'text.disabled' }}
      secondaryTypographyProps={{
        mt: 1,
        noWrap: true,
        component: 'span',
        color: 'text.primary',
        typography: 'subtitle1',
      }}
    />
  );

  const renderInfo = (
    <Stack
      spacing={1.5}
      sx={{ position: 'relative', p: (theme) => theme.spacing(0, 2.5, 2.5, 2.5) }}
    >
      {isAdmin && (
        <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', bottom: 20, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      )}

      {[
        {
          icon: (
            <Iconify
              icon="material-symbols:scoreboard-outline"
              sx={{
                color:
                  tour.scores.home === tour.scores.away
                    ? 'text.body2'
                    : tour.scores.home > tour.scores.away
                      ? 'success.main'
                      : 'error.main',
              }}
            />
          ),
          label: `${tour.scores?.home} - ${tour.scores?.away}`,
        },
        {
          icon: (
            <Iconify
              icon="solar:users-group-rounded-bold"
              sx={{ color: userAssists ? 'success.main' : 'gray' }}
            />
          ),
          label: `${Object.keys(tour?.bookers).length || 0} Booked${userAssists ? ' (You)' : ''}`,
        },
        {
          icon: <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main' }} />,
          label: fDateRangeShortLabel(tour.available.startDate, tour.available.endDate),
        },
        {
          icon: <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />,
          label: tour.location,
        },
      ].map((item) => (
        <Stack
          key={item.label}
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ typography: 'body2' }}
        >
          {item.icon}
          {item.label}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <>
      <Card
        sx={{
          border: 2,
          borderColor:
            tour.scores.home > tour.scores.away
              ? 'success.main'
              : tour.scores.home === tour.scores.away
                ? 'warning.main'
                : 'error.main',
        }}
      >
        {tour?.images?.length > 0 && renderImages}

        {renderTexts}

        {renderInfo}
      </Card>

      {isAdmin && (
        <CustomPopover
          open={popover.open}
          anchorEl={popover.anchorEl}
          onClose={popover.onClose}
          slotProps={{ arrow: { placement: 'right-top' } }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                popover.onClose();
                onView();
              }}
            >
              <Iconify icon="solar:eye-bold" />
              View
            </MenuItem>

            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              Edit
            </MenuItem>

            <MenuItem
              onClick={() => {
                popover.onClose();
                onDelete();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          </MenuList>
        </CustomPopover>
      )}
    </>
  );
}
