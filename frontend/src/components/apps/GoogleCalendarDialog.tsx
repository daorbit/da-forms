import { Badge, Button, Group, Modal, Text } from '@mantine/core';
import { CalendarIcon, CheckIcon } from 'lucide-react';
import type { CalendarStatus } from '@/types';
import { GoogleCalendarLogo } from './AppLogos';
import classes from './GoogleCalendarDialog.module.css';

interface Props {
  opened: boolean;
  status: CalendarStatus | null;
  busy: boolean;
  onClose: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
}

const USES = [
  'Hides times you are already busy on booking fields',
  'Adds every booking to the calendar you pick',
  'Creates a Google Meet link and emails the invite',
];

export function GoogleCalendarDialog({ opened, status, busy, onClose, onReconnect, onDisconnect }: Props) {
  const calendars = status?.calendars ?? [];

  return (
    <Modal opened={opened} onClose={onClose} centered radius="lg" size={460} withCloseButton={false} padding={0}>
      <div className={classes.head}>
        <span className={classes.mark}>
          <GoogleCalendarLogo height={26} />
        </span>
        <div className={classes.headText}>
          <Group gap={8}>
            <Text fw={650}>Google Calendar</Text>
            <Badge color="teal" variant="light" radius="sm" size="sm">
              Connected
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" truncate>
            {status?.email || 'Google account'}
          </Text>
        </div>
      </div>

      <div className={classes.body}>
        <div className={classes.label}>Used for</div>
        <ul className={classes.uses}>
          {USES.map((use) => (
            <li key={use}>
              <CheckIcon size={14} className={classes.check} />
              {use}
            </li>
          ))}
        </ul>

        <div className={classes.label}>Calendars on this account</div>
        <div className={classes.calendars}>
          {calendars.length === 0 && <div className={classes.empty}>No calendars found.</div>}
          {calendars.map((calendar) => (
            <div key={calendar.id} className={classes.calendar}>
              <CalendarIcon size={15} className={classes.calendarIcon} />
              <span className={classes.calendarName}>{calendar.summary}</span>
              {calendar.primary ? (
                <Badge variant="light" color="blue" size="xs" radius="sm">
                  Primary
                </Badge>
              ) : (
                !calendar.canWrite && <span className={classes.readOnly}>Read only</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Group justify="space-between" className={classes.foot}>
        <Button variant="subtle" color="red" onClick={onDisconnect} loading={busy}>
          Disconnect
        </Button>
        <Group gap="xs">
          <Button variant="default" onClick={onReconnect} disabled={busy}>
            Switch account
          </Button>
          <Button onClick={onClose}>Done</Button>
        </Group>
      </Group>
    </Modal>
  );
}
