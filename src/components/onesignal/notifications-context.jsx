import useSWR from 'swr';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const NotificationsContext = createContext(undefined);

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used inside NotificationsProvider');
  return ctx;
}

// ----------------------------------------------------------------------

export function NotificationsProvider({ children }) {
  const { authenticated } = useAuthContext();
  const [foreground, setForeground] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const { data: apiData, mutate } = useSWR(
    authenticated ? endpoints.notifications : null,
    (url) =>
      axiosInstance.get(url).then((r) =>
        (r.data.notifications ?? []).map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }))
      ),
    { revalidateOnFocus: false, onError: () => {} }
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
      try {
        await axiosInstance.post(`${endpoints.notifications}/${id}/read`);
        mutate();
      } catch (_) {
        // network errors are non-fatal; the UI dot will clear on next revalidation
      }
    },
    [mutate]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.post(`${endpoints.notifications}/read`);
      mutate();
    } catch (_) {
      // non-fatal
    }
  }, [mutate]);

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      markAllAsRead,
      markAsRead,
      notificationsLoading,
      setNotificationsLoading,
      permissionGranted,
      setPermissionGranted,
    }),
    [notifications, addNotification, markAllAsRead, markAsRead, notificationsLoading, permissionGranted]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
