import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const URL = endpoints.calendar;

const options = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetEvents() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, options);

  const memoizedValue = useMemo(() => {
    const events = data?.map((event) => ({
      ...event,
      textColor: event.color,
    }));

    return {
      events: events || [],
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
  const res = await axiosInstance.post(URL, eventData);
  mutate(URL);
  return res;
}

// ----------------------------------------------------------------------

export async function updateEvent(eventData) {
  const res = await axiosInstance.put(URL, eventData);
  mutate(URL);
  return res;

}

// ----------------------------------------------------------------------

export async function deleteEvent(eventId) {
  const data = { eventId };
  mutate(URL);
  await axiosInstance.delete(`${URL}/${eventId}`, data);
}
