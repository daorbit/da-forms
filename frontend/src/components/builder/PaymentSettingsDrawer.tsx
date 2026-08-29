import { useEffect, useState } from 'react';
import {
  Drawer,
  Stack,
  TextInput,
  PasswordInput,
  Switch,
  Button,
  Text,
  Group,
  Alert,
  Anchor,
  Code,
  Loader,
  Center,
  SegmentedControl,
  Badge,
  Divider,
  CopyButton,
  ActionIcon,
  Tooltip,
  List,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCopy,
  IconCheck,
  IconPlugConnected,
} from '@tabler/icons-react';
import type { PaymentSettings, RazorpayMode } from '@/types';
import {
  getPaymentSettings,
  savePaymentSettings,
  testPaymentConnection,
  disconnectPayments,
  ApiError,
} from '@/lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  /** Shown as the webhook URL to paste into the Razorpay dashboard. */
  webhookUrl?: string;
}

/**
 * Where a workspace connects its Razorpay account.
 *
 * Workspace-level rather than per-form: the money lands in one account, and
 * copying the same secret onto every form would mean rotating a key touched
 * every document the workspace owns.
 *
 * Test and live keys are edited separately, because the two are different
 * accounts and an owner testing a form should not have to re-paste their live
 * credentials afterwards.
 */
export function PaymentSettingsDrawer({ opened, onClose, workspaceId, webhookUrl }: Props) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  /** Which key set is being edited — not necessarily the one being charged through. */
  const [tab, setTab] = useState<RazorpayMode>('test');
  const [keyId, setKeyId] = useState('');
  // Kept blank on load, not filled with the mask: an untouched field means
  // "leave the stored secret alone", so the mask must never be submittable as
  // if it were a real value.
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const pair = settings ? settings[tab] : undefined;

  /** Reset the editable fields to whatever the given tab has stored. */
  function loadTab(next: PaymentSettings, which: RazorpayMode) {
    setKeyId(next[which].keyId ?? '');
    setKeySecret('');
    setWebhookSecret('');
  }

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    getPaymentSettings(workspaceId)
      .then((s) => {
        setSettings(s);
        setTab(s.mode);
        loadTab(s, s.mode);
      })
      .catch(() => notifications.show({ message: 'Could not load payment settings.', color: 'red' }))
      .finally(() => setLoading(false));
  }, [opened, workspaceId]);

  function switchTab(next: RazorpayMode) {
    setTab(next);
    if (settings) loadTab(settings, next);
  }

  async function handleSave(patch: Partial<Parameters<typeof savePaymentSettings>[0]> = {}) {
    setSaving(true);
    try {
      const saved = await savePaymentSettings(
        {
          target: tab,
          keyId: keyId.trim() || undefined,
          // Omitted when blank, so saving without retyping keeps what is stored.
          keySecret: keySecret.trim() || undefined,
          webhookSecret: webhookSecret.trim() || undefined,
          ...patch,
        },
        workspaceId
      );
      setSettings(saved);
      setKeySecret('');
      setWebhookSecret('');
      notifications.show({ message: 'Saved.', color: 'teal' });
    } catch (e) {
      notifications.show({
        message: e instanceof ApiError ? e.message : 'Could not save payment settings.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testPaymentConnection(tab, workspaceId);
      setSettings(result.settings);
      notifications.show({
        message: result.ok
          ? `${tab === 'live' ? 'Live' : 'Test'} keys work.`
          : (result.message ?? 'Razorpay rejected these keys.'),
        color: result.ok ? 'teal' : 'red',
      });
    } catch {
      notifications.show({ message: 'Could not reach the server.', color: 'red' });
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    try {
      const saved = await disconnectPayments(tab, workspaceId);
      setSettings(saved);
      loadTab(saved, tab);
      notifications.show({ message: `${tab === 'live' ? 'Live' : 'Test'} keys removed.` });
    } catch {
      notifications.show({ message: 'Could not disconnect.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size="md" title="Payments">
      {loading || !settings ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="md">
          {!settings.configurable && (
            <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
              The server has no encryption key configured, so payment credentials cannot be
              stored. Set <Code>ENCRYPTION_KEY</Code> and restart it.
            </Alert>
          )}

          {/* Which mode the workspace actually charges through — deliberately
              separate from the tab being edited, so nobody goes live just by
              looking at their live keys. */}
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Charging in
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.mode}
              onChange={(mode) => handleSave({ mode: mode as RazorpayMode, target: undefined })}
              data={[
                { value: 'test', label: 'Test mode' },
                { value: 'live', label: 'Live mode' },
              ]}
            />
            <Text size="xs" c="dimmed">
              {settings.mode === 'test'
                ? 'No real money moves. Use Razorpay’s test cards to try the flow.'
                : 'Real payments. Every submission charges the respondent for real.'}
            </Text>
          </Stack>

          <Switch
            label="Accept payments"
            description="Turn off to stop every paid form in this workspace from charging."
            checked={settings.enabled}
            onChange={(e) => handleSave({ enabled: e.currentTarget.checked, target: undefined })}
          />

          <Divider />

          {/* Setup checklist — every one of these fails silently otherwise:
              unverified keys look identical to working ones, and a missing
              webhook shows up only as responses stuck on pending. */}
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Setup
            </Text>
            <List spacing={6} size="sm" center>
              {settings.checklist.map((item) => (
                <List.Item
                  key={item.id}
                  icon={
                    <ThemeIcon
                      size={18}
                      radius="xl"
                      color={item.done ? 'teal' : 'gray'}
                      variant={item.done ? 'filled' : 'light'}
                    >
                      {item.done ? <IconCircleCheck size={12} /> : <IconCircleDashed size={12} />}
                    </ThemeIcon>
                  }
                >
                  <Text size="sm" c={item.done ? undefined : 'dimmed'}>
                    {item.label}
                  </Text>
                  {!item.done && item.hint && (
                    <Text size="xs" c="dimmed">
                      {item.hint}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Stack>

          <Divider />

          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Credentials
            </Text>
            {settings.mode === tab && <Badge size="sm" variant="light">In use</Badge>}
          </Group>

          <SegmentedControl
            fullWidth
            size="xs"
            value={tab}
            onChange={(v) => switchTab(v as RazorpayMode)}
            data={[
              { value: 'test', label: 'Test keys' },
              { value: 'live', label: 'Live keys' },
            ]}
          />

          <Text size="xs" c="dimmed">
            From Settings → API Keys in the{' '}
            <Anchor href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" size="xs">
              Razorpay dashboard
            </Anchor>
            . {tab === 'live' ? 'Live' : 'Test'} keys start with{' '}
            <Code>rzp_{tab}_</Code>.
          </Text>

          <TextInput
            label="Key ID"
            placeholder={`rzp_${tab}_...`}
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
          />

          <PasswordInput
            label="Key Secret"
            description={
              pair?.keySecretMask
                ? `Saved: ${pair.keySecretMask}. Leave blank to keep it.`
                : 'Stored encrypted. Never shown again once saved.'
            }
            placeholder={pair?.keySecretMask ? '••••••••' : 'Your key secret'}
            value={keySecret}
            onChange={(e) => setKeySecret(e.target.value)}
          />

          <PasswordInput
            label="Webhook Secret"
            description={
              pair?.webhookSecretMask
                ? `Saved: ${pair.webhookSecretMask}. Leave blank to keep it.`
                : 'Required — payments are only confirmed through the webhook.'
            }
            placeholder={pair?.webhookSecretMask ? '••••••••' : 'Your webhook secret'}
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
          />

          {pair?.verifiedAt && (
            <Group gap={6}>
              <IconCircleCheck size={15} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="dimmed">
                Verified {new Date(pair.verifiedAt).toLocaleString()}
                {pair.businessName ? ` · ${pair.businessName}` : ''}
              </Text>
            </Group>
          )}

          <Group>
            <Button
              variant="light"
              leftSection={<IconPlugConnected size={16} />}
              onClick={handleTest}
              loading={testing}
              disabled={!pair?.keyId}
            >
              Test connection
            </Button>
            <Button onClick={() => handleSave()} loading={saving} disabled={!settings.configurable}>
              Save
            </Button>
          </Group>

          {webhookUrl && (
            <>
              <Divider />
              <Stack gap={4}>
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Webhook URL
                  </Text>
                  <CopyButton value={webhookUrl}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'}>
                        <ActionIcon variant="subtle" onClick={copy}>
                          {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Code block>{webhookUrl}</Code>
                <Text size="xs" c="dimmed">
                  Add this once in Razorpay under Settings → Webhooks, subscribed to{' '}
                  <Code>payment.captured</Code> and <Code>payment.failed</Code>. It covers
                  every paid form in this workspace — you do not add a new one per form.
                  Without it, payments are never confirmed and responses stay pending.
                </Text>
              </Stack>
            </>
          )}

          {pair?.keyId && (
            <>
              <Divider />
              <Group justify="flex-end">
                <Button variant="subtle" color="red" onClick={handleDisconnect} disabled={saving}>
                  Remove {tab} keys
                </Button>
              </Group>
            </>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
