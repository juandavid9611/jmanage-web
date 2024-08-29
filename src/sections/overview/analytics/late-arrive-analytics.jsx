import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { Typography } from '@mui/material';

import { fShortenNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function LateArriveAnalytics({ title, subheader, list, ...other }) {
  return (
    <Card {...other}>
      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {list.map((item, index) => (
          <Item key={index} item={item} index={index} />
        ))}
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  const largeItem = (
    <Box
      sx={{
        gap: 1,
        minWidth: 240,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography component="span" variant="subtitle2" noWrap>
        {item.name}
      </Typography>
    </Box>
  );

  const smallItem = (icon, system) => (
    <Box
      sx={{
        gap: 0.5,
        minWidth: 20,
        display: 'flex',
        typography: 'body2',
        alignItems: 'center',
      }}
    >
      <Iconify icon={icon} width={14} sx={{ color: 'text.secondary' }} />
      {fShortenNumber(system)}
    </Box>
  );

  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} {...other}>
      {largeItem}
      {smallItem('gala:clock', item.rating)}
    </Box>
  );
}
