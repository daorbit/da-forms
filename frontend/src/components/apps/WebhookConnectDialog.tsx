import { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Badge,
  Center,
  ThemeIcon,
  Skeleton,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  IconPlugConnected,
  IconPlugConnectedX,
} from '@tabler/icons-react';
import type { WebhookSettings } from '@/types';
import { getWebhookApp } from '@/lib/api';
import { AppLogo } from './AppLogos';
// The same shell `AppConnectDialog` uses, so a per-form connection reads as
// one more app in the same grid rather than a bespoke dialog of its own.
import classes from '../builder/PaymentsModal.module.css';

interface Props {
  opened: boolean;
  workspaceId: string;
  formName: string;
  webhook: WebhookSettings;
  onChange: (patch: Partial<WebhookSettings>) => void;
  onClose: () => void;
  onOpenIntegrations: () => void;
}

const SAMPLE_PAYLOAD = `{
  "formId": "…",
  "submissionId": "…",
  "submittedAt": "2026-09-12T10:15:00.000Z",
  "data": { "Name": "Ada Lovelace", "Email": "ada@example.com" }
}`;

 
export function WebhookConnectDialog({
  opened,
  workspaceId,
  formName,
  webhook,
  onChange,
  onClose,
  onOpenIntegrations,
}: Props) {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  // `null` while loading, so the gate doesn't flash "off" before the real
  // answer arrives — a form that IS wired up shouldn't look disconnected for
  // a moment every time this opens.
  const [appEnabled, setAppEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (opened) {
      setUrl(webhook.url ?? '');
      setSecret('');
      setAppEnabled(null);
      getWebhookApp(workspaceId)
        .then((res) => setAppEnabled(res.enabled))
        .catch(() => setAppEnabled(false));
    }
  }, [opened, webhook.url, workspaceId]);

  const dirty = url !== (webhook.url ?? '') || secret.trim() !== '';

  function save(enable: boolean) {
    onChange({
      enabled: enable,
      url,
      ...(secret.trim() ? { secret: secret.trim() } : {}),
    });
    setSecret('');
  }

  const checklist: { label: string; done: boolean }[] = [
    { label: 'URL saved', done: Boolean(webhook.url) },
    { label: 'Turned on', done: Boolean(webhook.enabled) },
  ];

  return (
    <Modal
      opened={opened}
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
      {!opened ? (
        <Center h="100%">
          <Skeleton height={200} width={320} radius="md" />
        </Center>
      ) : (
        <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
          {/* ---- Left panel: identity + status ---- */}
          <Box className={classes.panel}>
            <Group px={20} wrap="nowrap" className={classes.panelHeader} align="center">
              <AppLogo appId="webhook" height={26} />
              <Text fw={600}>Webhook</Text>
            </Group>

            <Box className={classes.panelBody}>
              <Group justify="space-between" mb="md">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  automation app
                </Text>
                {webhook.enabled ? (
                  <Badge color="teal" variant="light" radius="sm">
                    Connected
                  </Badge>
                ) : webhook.url ? (
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

              {webhook.lastAttemptAt && (
                <Group gap={6} wrap="nowrap" mt="md">
                  {webhook.lastStatus === 'ok' ? (
                    <IconCircleCheck size={14} color="var(--mantine-color-teal-6)" />
                  ) : (
                    <IconCircleX size={14} color="var(--mantine-color-red-6)" />
                  )}
                  <Text size="xs" c="dimmed">
                    Last delivery {webhook.lastStatus === 'ok' ? 'succeeded' : 'failed'} ·{' '}
                    {new Date(webhook.lastAttemptAt).toLocaleString()}
                  </Text>
                </Group>
              )}
            </Box>

            <Group px={20} py="md" className={classes.actionBar} justify="space-between">
              <span />
              <Button variant="default" size="compact-sm" onClick={onClose}>
                Close
              </Button>
            </Group>
          </Box>

          {/* ---- Right pane: the form ---- */}
          <Box className={classes.pane}>
            <Group px={28} className={classes.paneHeader} align="center" justify="space-between">
              <Text fw={600}>Connect webhook — {formName}</Text>
            </Group>

            <Box className={classes.paneBody}>
              <Box className={classes.paneInner}>
                <Stack gap="md" maw={560}>
                  <Text size="sm" c="dimmed">
                    Sends one POST per submission on this form. Point it at a Zapier or Make
                    webhook trigger to reach Slack, Sheets, Airtable or a CRM, or at your own
                    server.
                  </Text>

                  {appEnabled === false && (
                    <Alert
                      variant="light"
                      color="orange"
                      icon={<IconPlugConnectedX size={16} />}
                      title="Webhooks are off for this workspace"
                    >
                      <Stack gap="sm">
                        <Text size="sm">
                          Turn on the Webhook app in Integrations first — a URL and secret saved
                          here will not deliver anything until it is on.
                        </Text>
                        <Button
                          variant="default"
                          size="compact-sm"
                          onClick={onOpenIntegrations}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Open Integrations
                        </Button>
                      </Stack>
                    </Alert>
                  )}

                  <Group gap="xs" wrap="nowrap">
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: webhook.enabled
                          ? 'var(--mantine-color-teal-6)'
                          : webhook.url
                            ? 'var(--mantine-color-orange-6)'
                            : 'var(--mantine-color-dimmed)',
                      }}
                    />
                    <Text size="xs" c={webhook.enabled ? undefined : 'dimmed'}>
                      {webhook.enabled
                        ? 'Live — every submission on this form is sent'
                        : webhook.url
                          ? 'Saved but off — nothing sent yet'
                          : 'Not connected — nothing sent yet'}
                    </Text>
                  </Group>

                  <Stack gap="sm">
                    <TextInput
                      label="Webhook URL"
                      placeholder="https://hooks.zapier.com/hooks/catch/…"
                      value={url}
                      onChange={(e) => setUrl(e.currentTarget.value)}
                      disabled={appEnabled === false}
                    />
                    <PasswordInput
                      label="Signing secret"
                      description={
                        webhook.hasSecret
                          ? 'Saved. Leave blank to keep it, or enter a new one to replace it.'
                          : 'Optional — signs the X-Da-Forms-Signature header so your endpoint can verify a delivery.'
                      }
                      placeholder={webhook.hasSecret ? '••••••••' : 'A random string only you and the receiver know'}
                      value={secret}
                      onChange={(e) => setSecret(e.currentTarget.value)}
                      disabled={appEnabled === false}
                    />
                  </Stack>

                  <Group justify="flex-end" gap="sm" mt="xs">
                    {webhook.url && !webhook.enabled && (
                      <Button
                        variant="default"
                        onClick={() => save(false)}
                        disabled={(!dirty && !url) || appEnabled === false}
                      >
                        Save
                      </Button>
                    )}
                    <Button
                      leftSection={<IconPlugConnected size={16} />}
                      onClick={() => save(true)}
                      disabled={!url.trim() || appEnabled === false}
                    >
                      {webhook.enabled ? 'Save changes' : 'Connect'}
                    </Button>
                  </Group>

                  <Alert variant="light" color="gray" icon={<IconAlertTriangle size={16} />}>
                    Delivery is fire-and-forget — it never blocks a respondent&apos;s submit, and
                    there is no retry queue behind it. The status above reflects only the most
                    recent attempt.
                  </Alert>

                  <Text size="xs" c="dimmed" component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {SAMPLE_PAYLOAD}
                  </Text>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Group>
      )}
    </Modal>
  );
}
