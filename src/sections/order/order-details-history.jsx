import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const EVENT_DOT_COLOR = {
  order_created: 'primary',
  payment_created: 'info',
  payment_approval_pending: 'warning',
  payment_paid: 'success',
  payment_overdue: 'error',
  payment_canceled: 'default',
  payment_pending: 'grey',
  order_status_changed: 'secondary',
  provider_check_on: 'success',
  provider_check_off: 'warning',
  delivery_check_on: 'success',
  delivery_check_off: 'warning',
};

export function OrderDetailsHistory({ history }) {
  const events = history || [];

  return (
    <Card>
      <CardHeader title="Historial" />
      <Scrollbar sx={{ maxHeight: 420, p: 3 }}>
        <Timeline
          sx={{ p: 0, m: 0, [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}
        >
          {events.map((item, index) => {
            const isLast = index === events.length - 1;
            return (
              <TimelineItem key={`${item.type}-${item.time}-${index}`}>
                <TimelineSeparator>
                  <TimelineDot color={EVENT_DOT_COLOR[item.type] || 'grey'} />
                  {isLast ? null : <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2">{item.title}</Typography>
                  {item.time && (
                    <Box sx={{ color: 'text.disabled', typography: 'caption', mt: 0.5 }}>
                      {fDateTime(item.time)}
                    </Box>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </Scrollbar>
    </Card>
  );
}
