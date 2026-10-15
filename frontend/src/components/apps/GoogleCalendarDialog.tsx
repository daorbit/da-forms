import { Anchor, Badge, Button, Group, Modal, Text } from '@mantine/core';
import { CalendarIcon, CheckIcon, KeyIcon } from 'lucide-react';
import type { CalendarStatus } from '@/types';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS, GOOGLE_DATA_POLICY_URL } from '@/lib/docs';
import { GoogleCalendarLogo } from './AppLogos';
import classes from './GoogleCalendarDialog.module.css';

interface Props {
  opened: boolean;
  status: CalendarStatus | null;
  busy: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const USES = [
  'Hides times you are already busy on booking fields',
  'Adds every booking to the calendar you pick',
  'Creates a Google Meet link and emails the invite',
];

const PERMISSIONS = [
  { name: 'See your email address', why: 'Shows which Google account is connected.' },
  { name: 'See the list of your calendars', why: 'Lets you pick where bookings go and which calendars to check.' },
  { name: 'See availability on your calendars', why: 'Free and busy times only, never event titles or details.' },
  {
    name: 'View and edit events on your calendars',
    why: 'Adds each booking with its Meet link, and cancels it when you delete the entry. Quantalog only changes events it created.',
  },
];

export function GoogleCalendarDialog({ opened, status, busy, onClose, onConnect, onDisconnect }: Props) {
  const connected = Boolean(status?.connected);
  const expired = !connected && status?.status === 'revoked';
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
            {connected ? (
              <Badge color="teal" variant="light" radius="sm" size="sm">
                Connected
              </Badge>
            ) : expired ? (
              <Badge color="orange" variant="light" radius="sm" size="sm">
                Access expired
              </Badge>
            ) : null}
          </Group>
          <Text size="sm" c="dimmed" truncate>
            {connected || expired ? status?.email || 'Google account' : 'Optional, for booking fields'}
          </Text>
        </div>
      </div>

      <div className={classes.body}>
        {expired && (
          <Text size="sm" c="dimmed" mb="md">
            Google no longer accepts this connection, usually because access was removed from the Google account.
            Bookings still work, but busy times are not checked and no events are added until you reconnect.
          </Text>
        )}

        <div className={classes.label}>Used for</div>
        <ul className={classes.uses}>
          {USES.map((use) => (
            <li key={use}>
              <CheckIcon size={14} className={classes.check} />
              {use}
            </li>
          ))}
        </ul>

        {connected ? (
          <>
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
          </>
        ) : (
          <>
            <div className={classes.label}>Google will ask you to allow</div>
            <ul className={classes.permissions}>
              {PERMISSIONS.map((permission) => (
                <li key={permission.name}>
                  <KeyIcon size={14} className={classes.permissionIcon} />
                  <div>
                    <div className={classes.permissionName}>{permission.name}</div>
                    <div className={classes.permissionWhy}>{permission.why}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <Text size="xs" c="dimmed" className={classes.note}>
          Google tokens are encrypted and stay on Quantalog’s servers. Disconnect here at any time, or remove access
          from your Google Account’s security settings.
        </Text>
        <Group gap="md" className={classes.links}>
          <Anchor href={GOOGLE_DATA_POLICY_URL} target="_blank" rel="noopener noreferrer" size="xs">
            How we handle Google data
          </Anchor>
          <DocsLink path={DOCS.bookingGoogleAccess} />
        </Group>
      </div>

      <Group justify="space-between" className={classes.foot}>
        {connected ? (
          <Button variant="subtle" color="red" onClick={onDisconnect} loading={busy}>
            Disconnect
          </Button>
        ) : expired ? (
          <Button variant="subtle" color="red" onClick={onDisconnect} loading={busy}>
            Remove
          </Button>
        ) : (
          <span />
        )}
        <Group gap="xs">
          {connected ? (
            <>
              <Button variant="default" onClick={onConnect} disabled={busy}>
                Switch account
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onConnect} loading={busy}>
                Continue to Google
              </Button>
            </>
          )}
        </Group>
      </Group>
    </Modal>
  );
}
