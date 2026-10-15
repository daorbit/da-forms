import { Anchor } from '@mantine/core';
import type { CalendarStatus } from '@/types';
import statusClasses from '../PaymentSection.module.css';

interface Props {
  status: CalendarStatus | null;
  onManage?: () => void;
}

export function CalendarConnectionCard({ status, onManage }: Props) {
  const state = !status ? 'idle' : status.connected ? 'live' : 'off';
  const label = !status
    ? 'Checking Google Calendar…'
    : !status.configured
      ? 'Google Calendar is not set up on this server'
      : status.connected
        ? `Connected as ${status.email || 'Google account'}`
        : status.status === 'revoked'
          ? 'Google sign-in expired'
          : 'Google Calendar not connected';

  return (
    <div className={statusClasses.status}>
      <span className={statusClasses.statusText} data-state={state}>
        <span className={statusClasses.dot} data-state={state} />
        {label}
      </span>
      {status?.configured && onManage && (
        <Anchor component="button" type="button" size="xs" className={statusClasses.manage} onClick={onManage}>
          {status.connected ? 'Manage' : 'Connect'}
        </Anchor>
      )}
    </div>
  );
}
