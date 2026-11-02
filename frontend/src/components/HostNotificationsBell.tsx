import { ActionIcon, Tooltip } from '@mantine/core';
import { Bell } from 'lucide-react';
import { requestOpenNotifications } from '@/lib/planLimit';
import { useHostUnreadCount } from '@/hooks/useHostUnreadCount';
import { useHostPhone } from '@/hooks/useHostPhone';
import classes from './HostNotificationsBell.module.css';

export function HostNotificationsBell() {
  const count = useHostUnreadCount();
  const hostPhone = useHostPhone();
  if (hostPhone) return null;
  const badge = count > 99 ? '99+' : String(count);
  const label = count > 0 ? `Notifications · ${badge} unread` : 'Notifications';

  return (
    <Tooltip label={label} withArrow>
      <span className={classes.bell}>
        <ActionIcon variant="default" size="lg" radius="md" aria-label={label} onClick={requestOpenNotifications}>
          <Bell size={17} />
        </ActionIcon>
        {count > 0 && (
          <span className={classes.badge} data-wide={badge.length > 2 || undefined} aria-hidden>
            {badge}
          </span>
        )}
      </span>
    </Tooltip>
  );
}
