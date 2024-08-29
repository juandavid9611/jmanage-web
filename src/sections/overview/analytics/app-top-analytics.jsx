import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AppTopAnalytics({ title, subheader, list, isGoal, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {list.map((item, index) => (
          <Item key={index} item={item} index={index} isGoal={isGoal} />
        ))}
      </Box>
    </Card>
  );
}

function Item({ item, index, sx, isGoal, ...other }) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      {...other}
    >
      <Avatar alt={item.name} src={item.avatarUrl} />

      <Box flexGrow={1}>
        <Box sx={{ typography: 'subtitle2' }}>{item.name}</Box>
        <Box
          sx={{
            gap: 0.5,
            mt: 0.5,
            alignItems: 'center',
            typography: 'caption',
            display: 'inline-flex',
            color: 'text.secondary',
          }}
        >
          {isGoal ? (
            <>
              <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{item.goals}</Box>
              <Iconify icon="fluent:sport-soccer-20-filled" width={14} />
            </>
          ) : (
            <>
              <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{item.assists}</Box>
              <Iconify icon="emojione-monotone:goal-net" width={14} />
            </>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          width: 40,
          height: 40,
          display: 'flex',
          borderRadius: '50%',
          alignItems: 'center',
          color: 'primary.main',
          justifyContent: 'center',
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
          ...(index === 1 && {
            color: 'info.main',
            bgcolor: (theme) => varAlpha(theme.vars.palette.info.mainChannel, 0.08),
          }),
          ...(index === 2 && {
            color: 'error.main',
            bgcolor: (theme) => varAlpha(theme.vars.palette.error.mainChannel, 0.08),
          }),
        }}
      >
        <Iconify width={24} icon="solar:cup-star-bold" />
      </Box>
    </Box>
  );
}
