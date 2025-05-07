import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import { Avatar, CardHeader, LinearProgress, linearProgressClasses } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { fPercent } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function CourseWidgetSummary({ title, subheader, list, ...other }) {
  const theme = useTheme();

  const router = useRouter();

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Box sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {list.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  const percent = (item.current / item.total) * 100;

  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} {...other}>
      <Avatar
        alt={item.title}
        src={item.coverUrl}
        variant="rounded"
        sx={{ width: 56, height: 56 }}
      />

      <Box sx={{ minWidth: 0, display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
        <Box sx={{ mb: 0.5, typography: 'subtitle2' }}>{item.title}</Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            typography: 'caption',
            color: 'text.secondary',
          }}
        >
          <Box component="span">
            Conteo: {item.current}/{item.total}
          </Box>
          <Box component="span">Llegadas Tarde: {item.late_arrives}</Box>
        </Box>

        <Box sx={{ width: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            color="warning"
            variant="determinate"
            value={percent}
            sx={{
              width: 1,
              height: 6,
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
              [` .${linearProgressClasses.bar}`]: { opacity: 0.8 },
            }}
          />
          <Box
            component="span"
            sx={{
              width: 40,
              typography: 'caption',
              color: 'text.secondary',
              fontWeight: 'fontWeightMedium',
            }}
          >
            {fPercent(percent)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
