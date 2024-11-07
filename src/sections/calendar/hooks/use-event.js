import dayjs from 'dayjs';
import { useMemo } from 'react';

import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';

// ----------------------------------------------------------------------

export function useEvent(events, selectEventId, selectedRange, openForm) {
  const currentEvent = events.find((event) => event.id === selectEventId);

  const defaultValues = useMemo(
    () => ({
      id: '',
      title: '',
      location: '',
      description: '',
      color: CALENDAR_COLOR_OPTIONS[1],
      allDay: false,
      createTour: false,
      start: selectedRange ? selectedRange.start : dayjs(new Date()).format(),
      end: selectedRange ? selectedRange.end : dayjs(new Date()).format(),
      category: '',
      group: '',
    }),
    [selectedRange]
  );

  if (!openForm) {
    return { undefined };
  }

  if (currentEvent || selectedRange) {
    return { ...defaultValues, ...currentEvent };
  }

  return defaultValues;
}
