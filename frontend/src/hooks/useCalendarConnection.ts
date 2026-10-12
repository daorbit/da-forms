import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarStatus } from '@/types';
import { ApiError, disconnectCalendar, getCalendarConnectUrl, getCalendarStatus } from '@/lib/api';
import { notify } from '@/lib/notify';

const POPUP_FEATURES = 'width=520,height=680,menubar=no,toolbar=no';

export function useCalendarConnection(workspaceId: string, enabled = true) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const watcher = useRef<number | undefined>(undefined);

  const refresh = useCallback(
    () =>
      getCalendarStatus(workspaceId)
        .then(setStatus)
        .catch(() => setStatus({ configured: false, connected: false, calendars: [] })),
    [workspaceId]
  );

  useEffect(() => {
    if (enabled) void refresh();
    return () => window.clearInterval(watcher.current);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    function onMessage(event: MessageEvent) {
      if (event.data?.source !== 'forms-google-calendar') return;
      if (event.data.status === 'connected') notify.success('Google Calendar connected.');
      void refresh();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [enabled, refresh]);

  async function connect() {
    const popup = window.open('', 'forms-google-calendar', POPUP_FEATURES);
    if (!popup) {
      notify.warn('Allow pop-ups for this page to connect Google Calendar.');
      return;
    }
    setBusy(true);
    try {
      const { url } = await getCalendarConnectUrl(workspaceId);
      popup.location.href = url;
      window.clearInterval(watcher.current);
      watcher.current = window.setInterval(() => {
        if (!popup.closed) return;
        window.clearInterval(watcher.current);
        setBusy(false);
        void refresh();
      }, 600);
    } catch (e) {
      popup.close();
      setBusy(false);
      notify.error(e instanceof ApiError ? e.message : 'Could not start the Google connection.');
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      setStatus(await disconnectCalendar(workspaceId));
      notify.success('Google Calendar disconnected.');
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : 'Could not disconnect Google Calendar.');
    } finally {
      setBusy(false);
    }
  }

  return { status, busy, connect, disconnect, refresh };
}
