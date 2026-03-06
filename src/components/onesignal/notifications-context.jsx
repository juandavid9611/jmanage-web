import useSWR from 'swr';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const NotificationsContext = createContext(undefined);

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used inside NotificationsProvider');
  return ctx;
}

// ----------------------------------------------------------------------

export function NotificationsProvider({ children }) {
  const [foreground, setForeground] = useState([]);

  const { data: apiData, mutate } = useSWR(
    endpoints.notifications,
    (url) =>
      axiosInstance.get(url).then((r) =>
        r.data.notifications.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }))
      ),
    { revalidateOnFocus: false }
  );

  // Once SWR data arrives (after the 3s revalidation triggered by addNotification),
  // clear foreground items — the server response is now authoritative.
  useEffect(() => {
    if (apiData) setForeground([]);
  }, [apiData]);

  const notifications = useMemo(() => {
    const apiItems = apiData ?? [];
    const apiIds = new Set(apiItems.map((n) => n.id));
    const newFg = foreground.filter((n) => !apiIds.has(n.id));
    return [...newFg, ...apiItems];
  }, [foreground, apiData]);

  const addNotification = useCallback(
    (notification) => {
      setForeground((prev) => [notification, ...prev]);
      setTimeout(() => mutate(), 3000);
    },
    [mutate]
  );

  const markAsRead = useCallback(
    async (id) => {
      await axiosInstance.post(`${endpoints.notifications}/${id}/read`);
      mutate();
    },
    [mutate]
  );

  const markAllAsRead = useCallback(async () => {
    await axiosInstance.post(`${endpoints.notifications}/read`);
    mutate();
  }, [mutate]);

  const value = useMemo(
    () => ({ notifications, addNotification, markAllAsRead, markAsRead }),
    [notifications, addNotification, markAllAsRead, markAsRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
