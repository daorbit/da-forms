import { Anchor } from '@mantine/core';
import type { CalendarStatus } from '@/types';
import statusClasses from '../PaymentSection.module.css';

interface Props {
  status: CalendarStatus | null;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function CalendarConnectionCard({ status, busy, onConnect, onDisconnect }: Props) {
  const state = !status ? 'idle' : status.connected ? 'live' : 'off';
  const label = !status
    ? 'Checking Google Calendar…'
    : !status.configured
      ? 'Google Calendar is not set up on this server'
      : status.connected
        ? `Connected as ${status.email || 'Google account'}`
        : status.status === 'revoked'
          ? 'Google sign-in expired — reconnect'
          : 'Google Calendar not connected';

  return (
    <div className={statusClasses.status}>
      <span className={statusClasses.statusText} data-state={state}>
        <span className={statusClasses.dot} data-state={state} />
        {label}
      </span>
      {status?.configured && (
        <Anchor
          component="button"
          type="button"
          size="xs"
          className={statusClasses.manage}
          disabled={busy}
          onClick={status.connected ? onDisconnect : onConnect}
        >
          {busy ? 'Working…' : status.connected ? 'Disconnect' : 'Connect'}
        </Anchor>
      )}
    </div>
  );
}
