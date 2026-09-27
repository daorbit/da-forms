import { ActionIcon, Indicator, Tooltip } from '@mantine/core';
import { Bell } from 'lucide-react';
import { requestOpenNotifications } from '@/lib/planLimit';
import { useHostUnreadCount } from '@/hooks/useHostUnreadCount';
import { useHostPhone } from '@/hooks/useHostPhone';

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
      <Indicator
        inline
        disabled={count === 0}
        label={badge}
        size={16}
        offset={6}
        color="red"
        withBorder
        styles={{ indicator: { fontSize: 10, fontWeight: 700, paddingInline: 4 } }}
      >
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
      </Indicator>
    </Tooltip>
  );
}
