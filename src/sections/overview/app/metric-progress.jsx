import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { Popover } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { InfoOutlined } from '@mui/icons-material';
import LinearProgress from '@mui/material/LinearProgress';

import { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function MetricProgress({ title, subheader, data, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Stack spacing={3} sx={{ p: 3 }}>
        {data.map((metric) => (
          <MetricLineItem key={metric.label} metric={metric} />
        ))}
      </Stack>
    </Card>
  );
}

function MetricLineItem({ metric }) {
  const clickPopover = usePopover();

  const getColor = (value) => {
    if (value >= 100) return 'success';
    if (value >= 75) return 'warning';
    return 'error';
  };

  return (
    <Stack key={metric?.label}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Box sx={{ typography: 'overline' }}>
          {metric.label}
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled' }}
            onClick={clickPopover.onOpen}
          >
            <InfoOutlined sx={{ width: 20, height: 15 }} />
          </Typography>
        </Box>
        <Typography variant="caption">{metric?.percent || 0}%</Typography>
        <Box variant="caption" sx={{ typography: 'subtitle1' }}>
          ({metric?.total || 0}%)
        </Box>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={metric?.percent || 0}
        color={getColor(metric?.percent || 0)}
        sx={{
          height: 8,
          bgcolor: (bgTheme) => alpha(bgTheme.palette.grey[500], 0.16),
        }}
      />
      <Popover
        open={Boolean(clickPopover.open)}
        anchorEl={clickPopover.open}
        onClose={clickPopover.onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 1, maxWidth: 280 }}>
          <Typography variant="body2" gutterBottom>
            {metric.helpText || 'No description'}
          </Typography>
        </Box>
      </Popover>
    </Stack>
  );
}
