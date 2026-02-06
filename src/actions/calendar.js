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

export async function createEvent(eventData, workspaceId) {
  const url = workspaceId ? `${CALENDAR_ENDPOINT}?workspace_id=${workspaceId}` : CALENDAR_ENDPOINT;
  const res = await axios.post(url, eventData);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
  return res;
}

// ----------------------------------------------------------------------

export async function updateEvent(eventData, workspaceId) {
  const url = workspaceId ? `${CALENDAR_ENDPOINT}?workspace_id=${workspaceId}` : CALENDAR_ENDPOINT;
  const res = await axios.put(url, eventData);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
  return res;
}

// ----------------------------------------------------------------------

export async function deleteEvent(eventId, workspaceId) {
  const data = { eventId };
  const url = workspaceId ? `${CALENDAR_ENDPOINT}/${eventId}?workspace_id=${workspaceId}` : `${CALENDAR_ENDPOINT}/${eventId}`;
  await axios.delete(url, data);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
}

export async function participateEvent(eventId, value, workspaceId) {
  const data = { value };
  const url = workspaceId ? `${CALENDAR_ENDPOINT}/${eventId}/participate?workspace_id=${workspaceId}` : `${CALENDAR_ENDPOINT}/${eventId}/participate`;
  await axios.post(url, data);
  mutate((key) => key.startsWith(CALENDAR_ENDPOINT));
}
