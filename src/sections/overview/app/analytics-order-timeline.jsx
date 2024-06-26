import PropTypes from 'prop-types';

import { Box } from '@mui/system';
import Card from '@mui/material/Card';
import { Popover } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import { Paid, OtherHouses, EmojiEvents, SportsSoccer } from '@mui/icons-material';

import { fDateTime } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';

import { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function AnalyticsOrderTimeline({ title, subheader, list, ...other }) {
  const limit_time = new Date();
  limit_time.setHours(0, 0, 0, 0);

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Timeline
        sx={{
          m: 0,
          p: 3,
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {list.map(
          (item, index) =>
            item.start >= limit_time && (
              <OrderItem key={item.id} item={item} lastTimeline={index === list.length - 1} />
            )
        )}
      </Timeline>
    </Card>
  );
}

AnalyticsOrderTimeline.propTypes = {
  list: PropTypes.array,
  subheader: PropTypes.string,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function OrderItem({ item, lastTimeline }) {
  const { title, description, start, color, category, participants } = item;
  const clickPopover = usePopover();
  const { user } = useAuthContext();

  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            color,
          }}
          variant="outlined"
          onClick={clickPopover.onOpen}
        >
          {(() => {
            switch (category) {
              case 'training':
                return <SportsSoccer sx={{ width: 20, height: 20 }} />;
              case 'money':
                return <Paid sx={{ width: 20, height: 20 }} />;
              case 'match':
                return <EmojiEvents sx={{ width: 20, height: 20 }} />;
              default:
                return <OtherHouses sx={{ width: 20, height: 20 }} />;
            }
          })()}
        </TimelineDot>
        {lastTimeline ? null : <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent>
        <Typography variant="subtitle2">{title}</Typography> 
        <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>{description}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDateTime(start)}
        </Typography>
      </TimelineContent>
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
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Typography variant="subtitle1" gutterBottom>
            Participants
          </Typography>
          {Object.entries(participants || {}).map((entry, index) =>
            entry[0] === user?.id ? (
              <Typography key={entry[0]} variant="body2" sx={{ color: 'text.primary' }}>
                {index + 1}. {entry[1]}
              </Typography>
            ) : (
              <Typography key={entry[0]} variant="body2" sx={{ color: 'text.secondary' }}>
                {index + 1}. {entry[1]}
              </Typography>
            )
          )}
        </Box>
      </Popover>
    </TimelineItem>
  );
}

OrderItem.propTypes = {
  item: PropTypes.object,
  lastTimeline: PropTypes.bool,
};
