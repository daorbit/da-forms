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
  Center,
  Skeleton,
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
import type { PaymentSettings, RazorpayMode, PaymentProvider } from '@/types';
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
  { id: 'keys', label: 'API keys', hint: 'Connect your gateway account', icon: IconKey },
  { id: 'webhook', label: 'Webhook', hint: 'So payments get confirmed', icon: IconWebhook },
  { id: 'golive', label: 'Go live', hint: 'Switch on and start charging', icon: IconRocket },
];

 
const PROVIDER_COPY: Record<
  PaymentProvider,
  {
    keyIdLabel: string;
    secretLabel: string;
    keyIdPlaceholder: (mode: RazorpayMode) => string;
    keyIdHint: (mode: RazorpayMode) => string;
    dashboardUrl: string;
    dashboardName: string;
    keysPath: string;
    webhookEvents: string;
    webhookPath: string;
  }
> = {
  razorpay: {
    keyIdLabel: 'Key ID',
    secretLabel: 'Key Secret',
    keyIdPlaceholder: (mode) => `rzp_${mode}_...`,
    keyIdHint: (mode) => `${mode === 'live' ? 'Live' : 'Test'} keys start with rzp_${mode}_`,
    dashboardUrl: 'https://dashboard.razorpay.com',
    dashboardName: 'Razorpay dashboard',
    keysPath: 'Settings → API Keys',
    webhookEvents: 'payment.captured and payment.failed',
    webhookPath: 'Settings → Webhooks',
  },
  cashfree: {
    keyIdLabel: 'App ID',
    secretLabel: 'Secret Key',
    keyIdPlaceholder: () => 'Your App ID',
    keyIdHint: (mode) =>
      `From the ${mode === 'live' ? 'production' : 'sandbox'} environment. Cashfree keys look alike in both, so test the connection after saving.`,
    dashboardUrl: 'https://merchant.cashfree.com',
    dashboardName: 'Cashfree merchant dashboard',
    keysPath: 'Developers → API Keys',
    webhookEvents: 'PAYMENT_SUCCESS_WEBHOOK and PAYMENT_FAILED_WEBHOOK',
    webhookPath: 'Developers → Webhooks',
  },
};

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
  /** Why this session cannot manage payments, when it cannot. */
  const [denied, setDenied] = useState<string | null>(null);

  /** Which gateway is being set up. Both can be connected at once. */
  const [provider, setProvider] = useState<PaymentProvider>('razorpay');
  /** Which key set is being edited — not necessarily the one being charged through. */
  const [tab, setTab] = useState<RazorpayMode>('test');
  const [keyId, setKeyId] = useState('');
  // Kept blank on load, not filled with the mask: an untouched field means
  // "leave the stored secret alone", so the mask must never be submittable as
  // if it were a real value.
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const current = settings?.providers?.[provider];
  const copy = PROVIDER_COPY[provider];
  const pair = current ? current[tab] : undefined;
  const providerWebhookUrl = `${webhookUrl}/${provider}`;
  const done = (id: PaymentSettings['checklist'][number]['id']) =>
    Boolean(current?.checklist.find((c) => c.id === id)?.done);

  const stepDone: Record<StepId, boolean> = {
    keys: done('keys') && done('verified'),
    webhook: done('webhook'),
    golive: done('enabled'),
  };

  function loadTab(next: PaymentSettings, which: RazorpayMode) {
    // Left blank rather than prefilled: the server returns a masked id, and
    // putting that in the input would save the mask over the real key on the
    // next submit. The mask is shown as the field's description instead.
    setKeyId('');
    setKeySecret('');
    setWebhookSecret('');
  }

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    getPaymentSettings(workspaceId)
      .then((s) => {
        setSettings(s);
        // Opens on whichever gateway the workspace charges through by default,
        // which is the one most likely to need attention.
        const active = s.defaultProvider ?? 'razorpay';
        setProvider(active);
        const view = s.providers?.[active];
        setTab(view?.mode ?? s.mode);
        loadTab(s, view?.mode ?? s.mode);
        // Opens on the first thing still outstanding, so someone returning to
        // finish setup lands where they left off.
        const first = (view?.checklist ?? s.checklist).find((c) => !c.done);
        setStep(
          first?.id === 'webhook' ? 'webhook' : first?.id === 'enabled' ? 'golive' : 'keys'
        );
      })
      .catch((e) => {
        // No token means this session cannot act for the workspace — a viewer,
        // or a tab left open past the token's hour. Worth saying plainly
        // rather than as a generic failure, since the fix differs.
        const code = e instanceof ApiError ? e.code : undefined;
        setDenied(
          code === 'workspace_token_expired'
            ? 'This session has expired. Reload the page to manage payments.'
            : code === 'workspace_token_required' || code === 'workspace_token_invalid'
              ? 'Open lead capture from your Quantalog workspace to manage payments. Editors only.'
              : null
        );
        if (!code?.startsWith('workspace_token')) {
          notifications.show({ message: 'Could not load payment settings.', color: 'red' });
        }
      })
      .finally(() => setLoading(false));
  }, [opened, workspaceId]);

  function switchTab(next: RazorpayMode) {
    setTab(next);
    if (settings) loadTab(settings, next);
  }

  function switchProvider(next: PaymentProvider) {
    setProvider(next);
    const view = settings?.providers?.[next];
    const nextMode = view?.mode ?? 'test';
    setTab(nextMode);
    // Every input is cleared: a secret typed for one gateway must never be
    // submitted against the other's credentials.
    if (settings) loadTab(settings, nextMode);
    const first = view?.checklist.find((c) => !c.done);
    setStep(first?.id === 'webhook' ? 'webhook' : first?.id === 'enabled' ? 'golive' : 'keys');
  }

  async function save(patch: Partial<Parameters<typeof savePaymentSettings>[0]> = {}) {
    setSaving(true);
    try {
      const saved = await savePaymentSettings(
        {
          provider,
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
      const result = await testPaymentConnection(tab, workspaceId, provider);
      setSettings(result.settings);
      notifications.show({
        message: result.ok
          ? `${tab === 'live' ? 'Live' : 'Test'} keys work.`
          : (result.message ?? `${current?.label ?? 'The gateway'} rejected these keys.`),
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
      const saved = await disconnectPayments(tab, workspaceId, provider);
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
      {loading ? (
        // Shaped like the two columns it stands in for, so the layout does not
        // jump when the settings arrive.
        <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
          <Box className={classes.panel} p="md">
            <Stack gap="sm">
              <Skeleton height={44} radius="md" />
              <Skeleton height={58} radius="md" mt="sm" />
              <Skeleton height={58} radius="md" />
              <Skeleton height={58} radius="md" />
            </Stack>
          </Box>
          <Box className={classes.pane} p="xl">
            <Stack gap="md" maw={620}>
              <Skeleton height={28} width="40%" radius="md" />
              <Skeleton height={16} width="80%" radius="md" />
              <Skeleton height={200} radius="md" mt="md" />
            </Stack>
          </Box>
        </Group>
      ) : denied || !settings ? (
        <Center h="100%" px="xl">
          <Stack align="center" gap="sm" maw={420}>
            <ThemeIcon variant="light" color="gray" size={52} radius="md">
              <IconCreditCard size={24} />
            </ThemeIcon>
            <Text fw={600}>Payments unavailable</Text>
            <Text size="sm" c="dimmed" ta="center">
              {denied ?? 'Could not load payment settings.'}
            </Text>
            <Button variant="default" onClick={onClose} mt="xs">
              Close
            </Button>
          </Stack>
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
                  For this whole workspace
                </Text>
              </Box>
            </Group>

            <Box className={classes.panelBody}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">
                Gateway
              </Text>
              <SegmentedControl
                fullWidth
                mb="md"
                value={provider}
                onChange={(v) => switchProvider(v as PaymentProvider)}
                data={Object.values(settings.providers).map((p) => ({
                  value: p.provider,
                  label: p.label,
                }))}
              />
              {settings.defaultProvider === provider ? (
                <Text size="xs" c="dimmed" mb="md">
                  Forms that do not pick a gateway use this one.
                </Text>
              ) : (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  mb="md"
                  onClick={() => save({ defaultProvider: provider })}
                  disabled={saving || !current?.enabled}
                >
                  Make default for new forms
                </Button>
              )}

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
                {(current?.checklist ?? []).map((item) => (
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
                {(current?.mode ?? "test") === 'live' ? (
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
                      Payments are charged straight into your own {current?.label} account —
                      nothing routes through us. Find these under {copy.keysPath} in the{' '}
                      <Anchor href={copy.dashboardUrl} target="_blank" rel="noreferrer" size="sm">
                        {copy.dashboardName}
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
                          {(current?.mode ?? "test") === tab && (
                            <Badge size="sm" variant="filled" color="emerald">
                              Currently in use
                            </Badge>
                          )}
                        </Group>

                        <TextInput
                          label={copy.keyIdLabel}
                          placeholder={
                            pair?.hasKeyId ? '••••••••' : copy.keyIdPlaceholder(tab)
                          }
                          description={
                            pair?.hasKeyId
                              ? `Saved: ${pair.keyId}. Leave blank to keep it.`
                              : copy.keyIdHint(tab)
                          }
                          value={keyId}
                          onChange={(e) => setKeyId(e.target.value)}
                        />

                        <PasswordInput
                          label={copy.secretLabel}
                          description={
                            pair?.keySecretMask
                              ? `Saved: ${pair.keySecretMask}. Leave blank to keep it.`
                              : 'Stored encrypted. Never shown again once saved.'
                          }
                          placeholder={
                            pair?.keySecretMask ? '••••••••' : `Your ${copy.secretLabel.toLowerCase()}`
                          }
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
                            disabled={!pair?.hasKeyId}
                          >
                            Test connection
                          </Button>
                          {pair?.hasKeyId && (
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
                      {current?.label} tells us a payment succeeded through this URL. Without it,
                      a response sits unconfirmed forever and no confirmation email goes out —
                      even though the respondent was charged.
                    </Text>

                    <Box className={classes.keyCard}>
                      <Stack gap="md">
                        <Box>
                          <Group justify="space-between" mb={6}>
                            <Text size="sm" fw={600}>
                              Webhook URL
                            </Text>
                            <CopyButton value={providerWebhookUrl}>
                              {({ copied, copy: doCopy }) => (
                                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                  <ActionIcon variant="subtle" onClick={doCopy}>
                                    {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          </Group>
                          <Code block>{providerWebhookUrl}</Code>
                          <Text size="xs" c="dimmed" mt={6}>
                            Add this <strong>once</strong> in {current?.label} under{' '}
                            {copy.webhookPath}. It covers every paid form in this workspace — you
                            do not add one per form. Subscribe it to{' '}
                            <Code>{copy.webhookEvents}</Code>. Each gateway needs its own URL.
                          </Text>
                        </Box>

                        <Divider />

                        <PasswordInput
                          label="Webhook Secret"
                          description={
                            pair?.webhookSecretMask
                              ? `Saved: ${pair.webhookSecretMask}. Leave blank to keep it.`
                              : `The secret you set when creating the webhook in ${current?.label}.`
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
                      color={(current?.mode ?? "test") === 'live' ? 'emerald' : 'gray'}
                      icon={
                        (current?.mode ?? "test") === 'live' ? (
                          <IconCircleCheck size={16} />
                        ) : (
                          <IconFlask size={16} />
                        )
                      }
                      title={(current?.mode ?? "test") === 'live' ? 'Charging for real' : 'Test mode'}
                    >
                      <Text size="xs">
                        {(current?.mode ?? 'test') === 'test'
                          ? `No real money moves. Use ${current?.label}’s test cards to try the whole flow end to end.`
                          : 'Every submission charges the respondent for real, using your live keys.'}
                      </Text>
                    </Alert>

                    <SegmentedControl
                      fullWidth
                      value={(current?.mode ?? "test")}
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
                        label={`Accept ${current?.label} payments`}
                        description={`Turn off to stop every form charging through ${current?.label}.`}
                        checked={Boolean(current?.enabled)}
                        onChange={(e) =>
                          save({ enabled: e.currentTarget.checked, target: undefined })
                        }
                      />
                    </Box>

                    {/* The remaining gaps, spelled out — someone on this step
                        is about to take money and should see what is missing. */}
                    {(current?.checklist ?? []).some((c) => !c.done) && (
                      <Alert
                        variant="light"
                        color="gray"
                        radius="md"
                        icon={<IconAlertTriangle size={16} />}
                        title="Still to do"
                      >
                        <Stack gap={4}>
                          {(current?.checklist ?? [])
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

                    {current?.lastChargeAt && (
                      <Group gap={6}>
                        <IconCircleCheck size={15} color="var(--mantine-color-teal-6)" />
                        <Text size="xs" c="dimmed">
                          Last payment received {new Date(current?.lastChargeAt).toLocaleString()}
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
