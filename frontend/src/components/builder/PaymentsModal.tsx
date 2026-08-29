import { useEffect, useState } from 'react';
import {
  Modal,
  Group,
  Box,
  Stack,
  Text,
  Title,
  Button,
  ActionIcon,
  TextInput,
  PasswordInput,
  Switch,
  Alert,
  Anchor,
  Code,
  Loader,
  Center,
  SegmentedControl,
  Badge,
  Divider,
  CopyButton,
  Tooltip,
  ThemeIcon,
  List,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCopy,
  IconCheck,
  IconPlugConnected,
  IconCreditCard,
  IconKey,
  IconWebhook,
  IconRocket,
  IconFlask,
} from '@tabler/icons-react';
import type { PaymentSettings, RazorpayMode } from '@/types';
import {
  getPaymentSettings,
  savePaymentSettings,
  testPaymentConnection,
  disconnectPayments,
  ApiError,
} from '@/lib/api';
import classes from './PaymentsModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  /** Registered once in Razorpay; covers every paid form in the workspace. */
  webhookUrl: string;
}

type StepId = 'keys' | 'webhook' | 'golive';

const STEPS: { id: StepId; label: string; hint: string; icon: typeof IconKey }[] = [
  { id: 'keys', label: 'API keys', hint: 'Connect your Razorpay account', icon: IconKey },
  { id: 'webhook', label: 'Webhook', hint: 'So payments get confirmed', icon: IconWebhook },
  { id: 'golive', label: 'Go live', hint: 'Switch on and start charging', icon: IconRocket },
];

/**
 * Where a workspace connects its Razorpay account.
 *
 * Workspace-level rather than per-form: the money lands in one account, and
 * copying the same secret onto every form would mean rotating a key touched
 * every document the workspace owns.
 *
 * Laid out as three steps because all three are needed and none of them fails
 * loudly on its own — keys that were never verified look identical to working
 * ones, and a missing webhook shows up only as responses stuck on pending.
 */
export function PaymentsModal({ opened, onClose, workspaceId, webhookUrl }: Props) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState<StepId>('keys');

  /** Which key set is being edited — not necessarily the one being charged through. */
  const [tab, setTab] = useState<RazorpayMode>('test');
  const [keyId, setKeyId] = useState('');
  // Kept blank on load, not filled with the mask: an untouched field means
  // "leave the stored secret alone", so the mask must never be submittable as
  // if it were a real value.
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const pair = settings ? settings[tab] : undefined;
  const done = (id: PaymentSettings['checklist'][number]['id']) =>
    Boolean(settings?.checklist.find((c) => c.id === id)?.done);

  const stepDone: Record<StepId, boolean> = {
    keys: done('keys') && done('verified'),
    webhook: done('webhook'),
    golive: done('enabled'),
  };

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
        // Opens on the first thing still outstanding, so someone returning to
        // finish setup lands where they left off.
        const first = s.checklist.find((c) => !c.done);
        setStep(
          first?.id === 'webhook' ? 'webhook' : first?.id === 'enabled' ? 'golive' : 'keys'
        );
      })
      .catch(() => notifications.show({ message: 'Could not load payment settings.', color: 'red' }))
      .finally(() => setLoading(false));
  }, [opened, workspaceId]);

  function switchTab(next: RazorpayMode) {
    setTab(next);
    if (settings) loadTab(settings, next);
  }

  async function save(patch: Partial<Parameters<typeof savePaymentSettings>[0]> = {}) {
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
      {loading || !settings ? (
        <Center h="100%">
          <Loader size="sm" />
        </Center>
      ) : (
        <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
          {/* ---- Left: steps and status ---- */}
          <Box className={classes.panel}>
            <Group gap="sm" px={20} wrap="nowrap" className={classes.panelHeader}>
              <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                <IconCreditCard size={18} />
              </ThemeIcon>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600}>Payments</Text>
                <Text size="xs" c="dimmed">
                  Razorpay, for this whole workspace
                </Text>
              </Box>
            </Group>

            <Box className={classes.panelBody}>
              <Stack gap="xs">
                {STEPS.map((s, index) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${classes.step} ${step === s.id ? classes.stepActive : ''}`}
                    onClick={() => setStep(s.id)}
                  >
                    <Box
                      className={classes.stepIndex}
                      style={{
                        backgroundColor: stepDone[s.id]
                          ? 'var(--mantine-color-teal-6)'
                          : 'var(--mantine-color-default-hover)',
                        color: stepDone[s.id] ? '#fff' : 'var(--mantine-color-dimmed)',
                      }}
                    >
                      {stepDone[s.id] ? <IconCheck size={13} /> : index + 1}
                    </Box>
                    <Box className={classes.stepText}>
                      <Text size="sm" fw={500}>
                        {s.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {s.hint}
                      </Text>
                    </Box>
                  </button>
                ))}
              </Stack>

              <Divider my="lg" />

              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">
                Status
              </Text>
              <List spacing={8} size="sm" center>
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
                  </List.Item>
                ))}
              </List>
            </Box>

            <Group justify="flex-end" px={20} py="md" className={classes.actionBar}>
              <Button variant="default" onClick={onClose}>
                Close
              </Button>
            </Group>
          </Box>

          {/* ---- Right: the step being worked on ---- */}
          <Box className={classes.pane}>
            <Group justify="space-between" px={28} className={classes.paneHeader}>
              <Group gap="sm">
                <Title order={4}>{STEPS.find((s) => s.id === step)?.label}</Title>
                {settings.mode === 'live' ? (
                  <Badge color="emerald" variant="filled">
                    Live mode
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light">
                    Test mode
                  </Badge>
                )}
              </Group>
              <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
                <IconX size={18} />
              </ActionIcon>
            </Group>

            <Box className={classes.paneBody}>
              <Box className={classes.paneInner}>
                {!settings.configurable && (
                  <Alert
                    variant="light"
                    color="orange"
                    radius="md"
                    icon={<IconAlertTriangle size={16} />}
                    mb="lg"
                  >
                    The server has no encryption key configured, so payment credentials cannot
                    be stored. Set <Code>ENCRYPTION_KEY</Code> and restart it.
                  </Alert>
                )}

                {step === 'keys' && (
                  <Stack gap="lg">
                    <Text size="sm" c="dimmed">
                      Payments are charged straight into your own Razorpay account — nothing
                      routes through us. Find these under Settings → API Keys in the{' '}
                      <Anchor
                        href="https://dashboard.razorpay.com"
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                      >
                        Razorpay dashboard
                      </Anchor>
                      .
                    </Text>

                    <SegmentedControl
                      fullWidth
                      value={tab}
                      onChange={(v) => switchTab(v as RazorpayMode)}
                      data={[
                        { value: 'test', label: 'Test keys' },
                        { value: 'live', label: 'Live keys' },
                      ]}
                    />

                    <Box className={classes.keyCard}>
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Text size="sm" fw={600}>
                            {tab === 'live' ? 'Live' : 'Test'} credentials
                          </Text>
                          {settings.mode === tab && (
                            <Badge size="sm" variant="filled" color="emerald">
                              Currently in use
                            </Badge>
                          )}
                        </Group>

                        <TextInput
                          label="Key ID"
                          placeholder={`rzp_${tab}_...`}
                          description={`${tab === 'live' ? 'Live' : 'Test'} keys start with rzp_${tab}_`}
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
                            onClick={() => save()}
                            loading={saving}
                            disabled={!settings.configurable}
                          >
                            Save keys
                          </Button>
                          <Button
                            variant="light"
                            leftSection={<IconPlugConnected size={16} />}
                            onClick={handleTest}
                            loading={testing}
                            disabled={!pair?.keyId}
                          >
                            Test connection
                          </Button>
                          {pair?.keyId && (
                            <Button
                              variant="subtle"
                              color="red"
                              onClick={handleDisconnect}
                              disabled={saving}
                            >
                              Remove
                            </Button>
                          )}
                        </Group>
                      </Stack>
                    </Box>

                    {stepDone.keys && (
                      <Group justify="flex-end">
                        <Button variant="light" onClick={() => setStep('webhook')}>
                          Next: webhook
                        </Button>
                      </Group>
                    )}
                  </Stack>
                )}

                {step === 'webhook' && (
                  <Stack gap="lg">
                    <Text size="sm" c="dimmed">
                      Razorpay tells us a payment succeeded through this URL. Without it, a
                      response sits unconfirmed forever and no confirmation email goes out —
                      even though the respondent was charged.
                    </Text>

                    <Box className={classes.keyCard}>
                      <Stack gap="md">
                        <Box>
                          <Group justify="space-between" mb={6}>
                            <Text size="sm" fw={600}>
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
                          <Text size="xs" c="dimmed" mt={6}>
                            Add this <strong>once</strong> in Razorpay under Settings → Webhooks.
                            It covers every paid form in this workspace — you do not add one per
                            form. Subscribe it to <Code>payment.captured</Code> and{' '}
                            <Code>payment.failed</Code>.
                          </Text>
                        </Box>

                        <Divider />

                        <PasswordInput
                          label="Webhook Secret"
                          description={
                            pair?.webhookSecretMask
                              ? `Saved: ${pair.webhookSecretMask}. Leave blank to keep it.`
                              : 'The secret you set when creating the webhook in Razorpay.'
                          }
                          placeholder={pair?.webhookSecretMask ? '••••••••' : 'Your webhook secret'}
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                        />

                        <Group>
                          <Button
                            onClick={() => save()}
                            loading={saving}
                            disabled={!settings.configurable}
                          >
                            Save webhook secret
                          </Button>
                        </Group>
                      </Stack>
                    </Box>

                    {stepDone.webhook && (
                      <Group justify="flex-end">
                        <Button variant="light" onClick={() => setStep('golive')}>
                          Next: go live
                        </Button>
                      </Group>
                    )}
                  </Stack>
                )}

                {step === 'golive' && (
                  <Stack gap="lg">
                    <Alert
                      variant="light"
                      radius="md"
                      color={settings.mode === 'live' ? 'emerald' : 'gray'}
                      icon={
                        settings.mode === 'live' ? (
                          <IconCircleCheck size={16} />
                        ) : (
                          <IconFlask size={16} />
                        )
                      }
                      title={settings.mode === 'live' ? 'Charging for real' : 'Test mode'}
                    >
                      <Text size="xs">
                        {settings.mode === 'test'
                          ? 'No real money moves. Use Razorpay’s test cards to try the whole flow end to end.'
                          : 'Every submission charges the respondent for real, using your live keys.'}
                      </Text>
                    </Alert>

                    <SegmentedControl
                      fullWidth
                      value={settings.mode}
                      onChange={(mode) =>
                        save({ mode: mode as RazorpayMode, target: undefined })
                      }
                      data={[
                        { value: 'test', label: 'Test mode' },
                        { value: 'live', label: 'Live mode' },
                      ]}
                    />

                    <Box className={classes.keyCard}>
                      <Switch
                        label="Accept payments"
                        description="Turn off to stop every paid form in this workspace from charging."
                        checked={settings.enabled}
                        onChange={(e) =>
                          save({ enabled: e.currentTarget.checked, target: undefined })
                        }
                      />
                    </Box>

                    {/* The remaining gaps, spelled out — someone on this step
                        is about to take money and should see what is missing. */}
                    {settings.checklist.some((c) => !c.done) && (
                      <Alert
                        variant="light"
                        color="gray"
                        radius="md"
                        icon={<IconAlertTriangle size={16} />}
                        title="Still to do"
                      >
                        <Stack gap={4}>
                          {settings.checklist
                            .filter((c) => !c.done)
                            .map((c) => (
                              <Text size="sm" key={c.id}>
                                <strong>{c.label}</strong>
                                {c.hint ? ` — ${c.hint}` : ''}
                              </Text>
                            ))}
                        </Stack>
                      </Alert>
                    )}

                    {settings.lastChargeAt && (
                      <Group gap={6}>
                        <IconCircleCheck size={15} color="var(--mantine-color-teal-6)" />
                        <Text size="xs" c="dimmed">
                          Last payment received {new Date(settings.lastChargeAt).toLocaleString()}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </Group>
      )}
    </Modal>
  );
}
