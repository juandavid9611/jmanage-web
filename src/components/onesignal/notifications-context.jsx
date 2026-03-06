import { useMemo, useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------

const NotificationsContext = createContext(undefined);

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used inside NotificationsProvider');
  return ctx;
}

// ----------------------------------------------------------------------

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnRead: false })));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isUnRead: false } : n)));
  }, []);

  const value = useMemo(
    () => ({ notifications, addNotification, markAllAsRead, markAsRead }),
    [notifications, addNotification, markAllAsRead, markAsRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
