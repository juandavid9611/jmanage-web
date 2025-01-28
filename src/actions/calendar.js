import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const enableServer = true;

const CALENDAR_ENDPOINT = endpoints.calendar;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

export function useGetEvents(selectedWorkspace) {
  // Assuming you send the workspaceId as a query parameter
  const workspaceId = selectedWorkspace?.id;

  // Update the SWR fetcher to include the workspaceId as a query parameter
  const { data, isLoading, error, isValidating } = useSWR(
    workspaceId ? `${CALENDAR_ENDPOINT}?workspace_id=${workspaceId}` : null, // Construct the URL with the workspaceId
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const events = data?.map((event) => ({
      ...event,
      textColor: event.color,
    }));

    const sortedEvents = events?.sort((a, b) => new Date(a.start) - new Date(b.start));

    return {
      events: sortedEvents || [],
      eventsLoading: isLoading,
      eventsError: error,
      eventsValidating: isValidating,
      eventsEmpty: !isLoading && !data?.length,
    };
  }, [data, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createEvent(eventData) {
  const res = await axios.post(CALENDAR_ENDPOINT, eventData);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
  return res;
}

// ----------------------------------------------------------------------

export async function updateEvent(eventData) {
  const res = await axios.put(CALENDAR_ENDPOINT, eventData);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
  return res;
}

// ----------------------------------------------------------------------

export async function deleteEvent(eventId) {
  const data = { eventId };
  await axios.delete(`${CALENDAR_ENDPOINT}/${eventId}`, data);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
}

export async function participateEvent(eventId, value) {
  const data = { value };
  await axios.post(`${CALENDAR_ENDPOINT}/${eventId}/participate`, data);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
}
