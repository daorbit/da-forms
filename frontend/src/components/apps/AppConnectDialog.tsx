import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  NumberInput,
  Switch,
  Button,
  Alert,
  ActionIcon,
  Tooltip,
  Divider,
  Badge,
  Center,
  ThemeIcon,
  Skeleton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconExternalLink,
  IconPlugConnected,
  IconMail,
  IconFlask,
} from '@tabler/icons-react';
import type { AppCard, AppField } from '@/types';
import { saveApp, testApp, disconnectApp, ApiError } from '@/lib/api';
import { AppLogo } from './AppLogos';
// Deliberately the payments modal's own stylesheet: the two dialogs are meant
// to be visually identical, so they share the shell rather than keeping two
// copies of it in step by hand.
import classes from '../builder/PaymentsModal.module.css';

interface Props {
  app: AppCard | null;
  workspaceId: string;
  /** A guess at the address to send a test to — the workspace owner's email. */
  testEmailHint?: string;
  onClose: () => void;
  /** Given the fresh card after any save/test. */
  onSaved: (card: AppCard) => void;
  /** Given the full list after a disconnect. */
  onDisconnected: (cards: AppCard[]) => void;
}

type FieldValues = Record<string, string | number | boolean>;

/** Seed the form: stored config for plain fields, blank for secrets. */
function initialValues(app: AppCard): FieldValues {
  const out: FieldValues = {};
  for (const f of app.fields) {
    if (f.secret) {
      out[f.key] = '';
    } else if (f.type === 'boolean') {
      out[f.key] =
        app.config[f.key] === true || (app.config[f.key] === undefined && f.default === true);
    } else if (f.type === 'number') {
      const stored = app.config[f.key];
      out[f.key] = typeof stored === 'number' ? stored : Number(f.default ?? 0);
    } else {
      out[f.key] = String(app.config[f.key] ?? f.default ?? '');
    }
  }
  return out;
}

export function AppConnectDialog({
  app,
  workspaceId,
  testEmailHint,
  onClose,
  onSaved,
  onDisconnected,
}: Props) {
  const [values, setValues] = useState<FieldValues>({});
  const [busy, setBusy] = useState<null | 'save' | 'verify' | 'send' | 'disconnect'>(null);
  const [error, setError] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    if (app) {
      setValues(initialValues(app));
      setError(null);
      setTestTo(testEmailHint ?? '');
    }
  }, [app, testEmailHint]);

  const dirty = useMemo(() => {
    if (!app) return false;
    return app.fields.some((f) => {
      const v = values[f.key];
      if (f.secret) return typeof v === 'string' && v.trim() !== '';
      if (f.type === 'boolean') return Boolean(v) !== Boolean(app.config[f.key] ?? f.default);
      if (f.type === 'number') return Number(v) !== Number(app.config[f.key] ?? f.default ?? 0);
      return String(v ?? '') !== String(app.config[f.key] ?? f.default ?? '');
    });
  }, [app, values]);

  const set = (key: string, v: string | number | boolean) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  /** Only send what changed: every plain field, and secrets the user typed into. */
  function payloadValues(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!app) return out;
    for (const f of app.fields) {
      const v = values[f.key];
      if (f.secret) {
        if (typeof v === 'string' && v.trim() !== '') out[f.key] = v.trim();
      } else {
        out[f.key] = v;
      }
    }
    return out;
  }

  async function handleSave(enable: boolean) {
    if (!app) return;
    setBusy('save');
    setError(null);
    try {
      const card = await saveApp(app.id, { values: payloadValues(), enabled: enable }, workspaceId);
      onSaved(card);
      notifications.show({
        color: 'teal',
        title: enable ? `${app.name} connected` : `${app.name} saved`,
        message: enable
          ? 'Notification emails will go out through it.'
          : 'Turn it on when you are ready.',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the connection.');
    } finally {
      setBusy(null);
    }
  }

  /** `withEmail` sends a real message to `testTo`; otherwise a credentials-only check. */
  async function handleTest(withEmail: boolean) {
    if (!app) return;
    setBusy(withEmail ? 'send' : 'verify');
    setError(null);
    try {
      const res = await testApp(app.id, withEmail ? testTo.trim() : undefined, workspaceId);
      onSaved(res.app);
      notifications.show({
        color: res.ok ? 'teal' : 'red',
        title: res.ok ? 'Test succeeded' : 'Test failed',
        message: res.message,
      });
      if (!res.ok) setError(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The test could not run.');
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    if (!app) return;
    setBusy('disconnect');
    setError(null);
    try {
      const cards = await disconnectApp(app.id, workspaceId);
      onDisconnected(cards);
      notifications.show({ color: 'gray', title: `${app.name} disconnected`, message: '' });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect.');
    } finally {
      setBusy(null);
    }
  }

  const savedSecret = (f: AppField) => app?.secrets[f.key];

  function renderField(f: AppField) {
    if (f.type === 'boolean') {
      return (
        <Switch
          key={f.key}
          label={f.label}
          description={f.help}
          checked={Boolean(values[f.key])}
          onChange={(e) => set(f.key, e.currentTarget.checked)}
        />
      );
    }
    if (f.type === 'number') {
      return (
        <NumberInput
          key={f.key}
          label={f.label}
          description={f.help}
          placeholder={f.placeholder}
          required={f.required}
          value={values[f.key] as number}
          onChange={(v) => set(f.key, typeof v === 'number' ? v : Number(v) || 0)}
        />
      );
    }
    if (f.secret) {
      return (
        <PasswordInput
          key={f.key}
          label={f.label}
          description={f.help}
          required={f.required && !savedSecret(f)}
          placeholder={savedSecret(f) ? `Saved · ${savedSecret(f)}` : f.placeholder}
          value={values[f.key] as string}
          onChange={(e) => set(f.key, e.currentTarget.value)}
        />
      );
    }
    return (
      <TextInput
        key={f.key}
        label={f.label}
        description={f.help}
        placeholder={f.placeholder}
        required={f.required}
        type={f.type === 'email' ? 'email' : 'text'}
        value={values[f.key] as string}
        onChange={(e) => set(f.key, e.currentTarget.value)}
      />
    );
  }

  const checklist: { label: string; done: boolean }[] = app
    ? [
        { label: 'Details saved', done: app.connected },
        { label: `Verified with ${app.name}`, done: Boolean(app.verifiedAt) && !dirty },
        { label: 'Turned on', done: app.enabled },
      ]
    : [];

  return (
    <Modal
      opened={!!app}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{
        body: { height: '100%', padding: 0 },
        content: { display: 'flex', flexDirection: 'column' },
      }}
    >
      {!app ? (
        <Center h="100%">
          <Skeleton height={200} width={320} radius="md" />
        </Center>
      ) : (
        <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
          {/* ---- Left panel: identity + status ---- */}
          <Box className={classes.panel}>
            <Group px={20} wrap="nowrap" className={classes.panelHeader} align="center">
              <AppLogo appId={app.id} height={26} />
            </Group>

            <Box className={classes.panelBody}>
              <Group justify="space-between" mb="md">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  {app.category} app
                </Text>
                {app.enabled ? (
                  <Badge color="teal" variant="light" radius="sm">
                    Connected
                  </Badge>
                ) : app.connected ? (
                  <Badge color="gray" variant="light" radius="sm">
                    Saved, off
                  </Badge>
                ) : (
                  <Badge color="gray" variant="outline" radius="sm">
                    Not connected
                  </Badge>
                )}
              </Group>

              <Stack gap="sm">
                {checklist.map((c) => (
                  <Group key={c.label} gap="sm" wrap="nowrap">
                    {c.done ? (
                      <ThemeIcon color="teal" size="sm" radius="xl" variant="light">
                        <IconCircleCheck size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
                        <IconCircleDashed size={14} />
                      </ThemeIcon>
                    )}
                    <Text size="sm" c={c.done ? undefined : 'dimmed'}>
                      {c.label}
                    </Text>
                  </Group>
                ))}
              </Stack>

              {app.verifiedAt && !dirty && (
                <Text size="xs" c="dimmed" mt="md">
                  Last verified {new Date(app.verifiedAt).toLocaleString()}
                </Text>
              )}
            </Box>

            <Group px={20} py="md" className={classes.actionBar} justify="space-between">
              {app.connected ? (
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-sm"
                  loading={busy === 'disconnect'}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              ) : (
                <span />
              )}
              <Button variant="default" size="compact-sm" onClick={onClose} disabled={busy !== null}>
                Close
              </Button>
            </Group>
          </Box>

          {/* ---- Right pane: the form ---- */}
          <Box className={classes.pane}>
            <Group px={28} className={classes.paneHeader} align="center" justify="space-between">
              <Text fw={600}>Connect {app.name}</Text>
              {app.docsUrl && (
                <Tooltip label="Where to find these" withArrow position="left">
                  <ActionIcon
                    component="a"
                    href={app.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="subtle"
                    color="gray"
                    aria-label="Where to find these"
                  >
                    <IconExternalLink size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>

            <Box className={classes.paneBody}>
              <Box className={classes.paneInner}>
                <Stack gap="md" maw={560}>
                  <Text size="sm" c="dimmed">
                    {app.description}
                  </Text>

                  {/* The connection's state, in the shape the payments modal
                      uses. Email has no test vs live mode, so this is a plain
                      status line rather than a mode toggle. */}
                  <Group gap="xs" wrap="nowrap">
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: app.enabled
                          ? 'var(--mantine-color-teal-6)'
                          : app.connected
                            ? 'var(--mantine-color-orange-6)'
                            : 'var(--mantine-color-dimmed)',
                      }}
                    />
                    <Text size="xs" c={app.enabled ? undefined : 'dimmed'}>
                      {app.enabled
                        ? `Live — notification emails send through ${app.name}`
                        : app.connected
                          ? 'Saved but off — no emails sent through it yet'
                          : `Not connected — ${app.name} is not sending anything`}
                    </Text>
                  </Group>

                  {error && (
                    <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
                      {error}
                    </Alert>
                  )}

                  <Stack gap="sm">{app.fields.map(renderField)}</Stack>

                  <Group justify="flex-end" gap="sm" mt="xs">
                    {app.connected && !app.enabled && (
                      <Button
                        variant="default"
                        loading={busy === 'save'}
                        onClick={() => handleSave(false)}
                      >
                        Save
                      </Button>
                    )}
                    <Button
                      leftSection={<IconPlugConnected size={16} />}
                      loading={busy === 'save'}
                      onClick={() => handleSave(true)}
                    >
                      {app.enabled ? 'Save changes' : 'Connect'}
                    </Button>
                  </Group>

                  {app.testable && app.connected && (
                    <>
                      <Divider label="Test connection" labelPosition="left" mt="md" />

                      <Group gap="sm" wrap="nowrap">
                        <Button
                          variant="default"
                          leftSection={<IconPlugConnected size={16} />}
                          loading={busy === 'verify'}
                          disabled={dirty || busy !== null}
                          onClick={() => handleTest(false)}
                        >
                          Verify credentials
                        </Button>
                        <Text size="xs" c="dimmed">
                          Checks the login without sending anything.
                        </Text>
                      </Group>

                      <Group align="flex-end" gap="sm" wrap="nowrap" mt="xs">
                        <TextInput
                          label="Or send a real test email to"
                          placeholder="you@example.com"
                          type="email"
                          leftSection={<IconMail size={15} />}
                          value={testTo}
                          onChange={(e) => setTestTo(e.currentTarget.value)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          variant="default"
                          leftSection={<IconFlask size={16} />}
                          loading={busy === 'send'}
                          disabled={!testTo.trim() || dirty || busy !== null}
                          onClick={() => handleTest(true)}
                        >
                          Send test
                        </Button>
                      </Group>

                      {dirty && (
                        <Text size="xs" c="dimmed">
                          Save your changes before testing.
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Group>
      )}
    </Modal>
  );
}
