import OneSignal from 'react-onesignal';
import { useRef, useEffect } from 'react';

import { CONFIG } from 'src/config-global';

import { useSettingsContext } from 'src/components/settings';

import { useAuthContext } from 'src/auth/hooks';

import { useNotificationsContext } from './notifications-context';

// Module-level guard — survives component remounts
let initialized = false;

// OneSignal may throw the error as a plain object, a string, or an Error whose
// message contains the JSON — check all forms.
function isOnesignalAliasClaimed(e) {
  if (!e) return false;
  if (e?.errors?.some?.((err) => err.code === 'user-2')) return true;
  const str = String(e?.message ?? e);
  return str.includes('user-2');
}

export function OneSignalProvider() {
  const { user } = useAuthContext();
  const { notificationsEnabled } = useSettingsContext();
  const { addNotification } = useNotificationsContext();
  const loggedIn = useRef(false);

  // Init once per app lifetime and register foreground notification listener
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    OneSignal.init({
      appId: CONFIG.onesignalAppId,
      safariWebId: CONFIG.onesignalSafariWebId,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/onesignal/' },
      notifyButton: { enable: true, displayPredicate: () => false },
    }).catch((e) => console.error('OneSignal init failed', e));
  }, []);

  // Listen for foreground notifications and add them to the UI list
  useEffect(() => {
    const handleForeground = (event) => {
      const { notification } = event;
      addNotification({
        id: notification.notificationId ?? String(Date.now()),
        title: notification.title ?? '',
        body: notification.body ?? '',
        isUnRead: true,
        createdAt: new Date(),
        type: 'onesignal',
      });
      // Let the notification display as a native browser notification too
      event.preventDefault();
    };

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', handleForeground);
    return () => {
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', handleForeground);
    };
  }, [addNotification]);

  // Manage push subscription when user or notifications setting changes
  useEffect(() => {
    if (!user?.email) return undefined;

    if (!notificationsEnabled) {
      // Opt out without logging out — logout() creates a new anonymous identity
      // which then conflicts (user-2) when login() is called again on re-enable.
      OneSignal.User.PushSubscription.optOut?.();
      return undefined;
    }

    let cancelled = false;

    OneSignal.login(user.email)
      .then(() => {
        if (cancelled) return;
        loggedIn.current = true;

        if (Notification.permission === 'granted') {
          // Permission already granted (e.g. re-enable after opt-out) — just opt back in
          OneSignal.User.PushSubscription.optIn?.();
          return;
        }

        if (Notification.permission === 'denied') return;

        // Ask for permission only once per browser
        const alreadyAsked = localStorage.getItem('onesignal-asked');
        if (alreadyAsked) return;

        localStorage.setItem('onesignal-asked', '1');
        OneSignal.Notifications.requestPermission().catch(() => {});
      })
      .catch((e) => {
        if (isOnesignalAliasClaimed(e)) return;
        console.error('OneSignal login failed', e);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email, notificationsEnabled]);

  return null;
}
