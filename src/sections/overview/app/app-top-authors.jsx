import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { Button, Divider } from '@mui/material';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AppTopAuthors({ title, subheader, list, ...other }) {
  const router = useRouter();
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
          <Item key={index} item={item} index={index} />
        ))}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="medium"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          onClick={() => router.push(paths.dashboard.analytics.top)}
        >
          Ver todos
        </Button>
      </Box>
    </Card>
  );
}

function Item({ item, index, sx, ...other }) {
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
          <Iconify icon="emojione-monotone:goal-net" width={14} />
          {item.goals} Goles
          <Iconify icon="fluent:sport-soccer-20-filled" width={14} />
          {item.assists} Asistencias
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
