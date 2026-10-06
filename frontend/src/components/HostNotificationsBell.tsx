import { ActionIcon, Tooltip } from '@mantine/core';
import { Bell } from 'lucide-react';
import { requestOpenNotifications } from '@/lib/planLimit';
import { useHostUnreadCount } from '@/hooks/useHostUnreadCount';
import { useHostPhone } from '@/hooks/useHostPhone';
import classes from './HostNotificationsBell.module.css';

interface Props {
  variant?: 'default' | 'subtle';
  iconSize?: number;
}

export function HostNotificationsBell({ variant = 'default', iconSize = 17 }: Props) {
  const count = useHostUnreadCount();
  const hostPhone = useHostPhone();
  if (hostPhone) return null;
  const badge = count > 99 ? '99+' : String(count);
  const label = count > 0 ? `Notifications · ${badge} unread` : 'Notifications';

  return (
    <Tooltip label={label} withArrow>
      <span className={classes.bell}>
        <ActionIcon
          variant={variant}
          color={variant === 'subtle' ? 'gray' : undefined}
          size="lg"
          radius="md"
          aria-label={label}
          onClick={requestOpenNotifications}
        >
          <Bell size={iconSize} />
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
