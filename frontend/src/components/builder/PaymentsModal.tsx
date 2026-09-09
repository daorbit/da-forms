import { useEffect, useState, type ReactNode } from 'react';
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
import { GatewayLogo } from './GatewayLogos';
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
    webhookEvents: string[];
    webhookPath: string;
    /** True when the gateway signs webhooks with the API secret already saved. */
    webhookSecretless?: boolean;
    /** True when the gateway refuses to open an order without a phone number. */
    needsPhone?: boolean;
    /** Where the gateway's own webhook page lives, for the "open it" link. */
    webhookConsoleUrl: string;
    /** The gateway's own documentation for this step. */
    webhookDocsUrl: string;
    keysDocsUrl: string;
    /** What to do in the gateway's dashboard, in order. */
    webhookSteps: string[];
    /** Reference rows shown under the keys step. */
    keyFacts: { label: string; body: ReactNode }[];
    /** Reference rows shown under the webhook step. */
    webhookFacts: { label: string; body: ReactNode }[];
    /** Reference rows shown under the go-live step. */
    liveFacts: { label: string; body: ReactNode }[];
  }
> = {
  razorpay: {
    keyIdLabel: 'Key ID',
    secretLabel: 'Key Secret',
    keyIdPlaceholder: (mode) => `rzp_${mode}_...`,
    keyIdHint: (mode) => `${mode === 'live' ? 'Live' : 'Test'} keys start with rzp_${mode}_`,
    dashboardUrl: 'https://dashboard.razorpay.com',
    dashboardName: 'Razorpay dashboard',
    keysPath: 'Account & Settings → API Keys',
    webhookEvents: ['payment.captured', 'payment.failed'],
    webhookPath: 'Account & Settings → Webhooks',
    webhookConsoleUrl: 'https://dashboard.razorpay.com/app/website-app-settings/webhooks',
    webhookDocsUrl: 'https://razorpay.com/docs/webhooks/setup-edit-payments/',
    keysDocsUrl: 'https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/',
    webhookSteps: [
      'Open Account & Settings → Webhooks, then click "+ Add New Webhook".',
      'Paste the URL above into the Webhook URL field.',
      'Type any secret you like into the Secret field — you invent this, Razorpay does not generate it. Copy it.',
      'Tick the two events listed below under Active Events, then click Create Webhook.',
      'Come back here and paste that same secret into the box below, then save.',
    ],
    keyFacts: [
      {
        label: 'Test keys',
        body: 'Start with rzp_test_. No real money moves and no settlement happens. Use Razorpay’s test cards — 4111 1111 1111 1111 with any future expiry and any CVV.',
      },
      {
        label: 'Live keys',
        body: 'Start with rzp_live_. Only issued once your Razorpay account has completed KYC and been activated. Every payment is real from the moment you switch modes.',
      },
      {
        label: 'The secret',
        body: 'Razorpay shows the Key Secret exactly once, when the key pair is generated. If you did not copy it, you cannot look it up — regenerate the pair and paste both halves again.',
      },
      {
        label: 'Rotating',
        body: 'Generating a new key pair does not disable the old one immediately, so save the new keys here first and only then delete the old pair in Razorpay.',
      },
    ],
    webhookFacts: [
      {
        label: 'The secret',
        body: 'You choose this value — Razorpay does not generate it. Any long random string works. It must match here exactly or every delivery is rejected as unverified.',
      },
      {
        label: 'Test vs live',
        body: 'Test and live mode keep separate webhooks. Register the URL in both if you intend to go live, or live payments will settle with nothing listening.',
      },
      {
        label: 'Localhost',
        body: 'Razorpay can only reach public URLs. A backend on localhost will never receive a delivery — expose it with a tunnel such as ngrok while testing.',
      },
      {
        label: 'If it fails',
        body: 'Razorpay retries a failed delivery for up to 24 hours. A payment that stayed pending usually means a wrong secret or an unreachable URL, not a lost payment.',
      },
    ],
    liveFacts: [
      {
        label: 'Switching',
        body: 'Changing mode here decides which saved key pair charges. It does not move money or migrate anything — test payments stay in the test dashboard.',
      },
      {
        label: 'Before you switch',
        body: 'Register the webhook in live mode, verify the live keys, and run one real low-value payment end to end. A live form with no live webhook takes money and confirms nothing.',
      },
      {
        label: 'Refunds',
        body: 'Issue refunds from the Razorpay dashboard. Refunding there does not change the response stored here — the submission stays marked paid.',
      },
    ],
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
    webhookEvents: [
      'PAYMENT_SUCCESS_WEBHOOK',
      'PAYMENT_FAILED_WEBHOOK',
      'PAYMENT_USER_DROPPED_WEBHOOK',
    ],
    webhookPath: 'Developers → Webhooks',
    needsPhone: true,
    webhookConsoleUrl: 'https://merchant.cashfree.com/merchants/pg/developers/webhooks',
    webhookDocsUrl: 'https://www.cashfree.com/docs/payments/online/webhooks/overview',
    keysDocsUrl: 'https://www.cashfree.com/docs/payments/online/resources/api-keys',
    webhookSteps: [
      'Switch the dashboard to the environment you are setting up — Sandbox or Production. The two keep separate webhooks.',
      'Open Developers → Webhooks and click "Add Webhook Endpoint".',
      'Paste the URL above into Endpoint URL.',
      'Press Test if you like, but expect a warning — the test probe is unsigned, so this endpoint refuses it on purpose. Click Continue.',
      'Select the events listed below, then save. There is no secret to copy — Cashfree signs with your Secret Key.',
    ],
    keyFacts: [
      {
        label: 'Sandbox keys',
        body: 'Generated in the Sandbox environment and only valid against Cashfree’s sandbox servers. Nothing settles and no real money moves.',
      },
      {
        label: 'Production keys',
        body: 'Issued once your Cashfree account is KYC-verified and activated. Every payment is real from the moment you switch modes.',
      },
      {
        label: 'They look alike',
        body: 'Unlike Razorpay, Cashfree keys carry no test/live prefix, so nothing can catch a sandbox key pasted into the live slot on sight. Always press "Test connection" after saving — a mismatched key fails to authenticate, and that is the only warning you get.',
      },
      {
        label: 'The secret',
        body: 'The Secret Key is shown once, when generated. It also verifies your webhooks, so keep it — losing it means regenerating the pair and re-saving both halves here.',
      },
    ],
    webhookFacts: [
      {
        label: 'No secret',
        body: 'Cashfree has no per-webhook secret. Deliveries are signed with the Secret Key you saved in the previous step, so there is nothing extra to paste. If you went looking for one and found nothing, that is why.',
      },
      {
        label: 'The test button',
        body: 'Cashfree’s Test button sends an unsigned probe. This endpoint refuses unsigned requests by design, so the warning is expected — a webhook that answered it would accept forged payment notifications from anyone. Click Continue past it.',
      },
      {
        label: 'Sandbox vs production',
        body: 'The two environments keep separate webhooks and separate Secret Keys. Because the key verifies the signature, a sandbox webhook received while this workspace is set to live mode will not verify. Keep the mode aligned with the environment you are testing.',
      },
      {
        label: 'Localhost',
        body: 'Cashfree can only reach public URLs. A backend on localhost never receives a delivery — expose it with a tunnel such as ngrok while testing.',
      },
      {
        label: 'Verifying it works',
        body: 'The only conclusive test is a real sandbox payment. If the submission stays pending afterwards, the URL or the mode is wrong — the money is not lost.',
      },
    ],
    liveFacts: [
      {
        label: 'Switching',
        body: 'Changing mode here decides which saved keys charge, and which Secret Key verifies incoming webhooks. It moves no money and migrates nothing.',
      },
      {
        label: 'Before you switch',
        body: 'Register the webhook in production, save the production keys, verify them, and run one real low-value payment. Production keys against a sandbox webhook — or the reverse — fail silently.',
      },
      {
        label: 'Phone numbers',
        body: 'Cashfree requires the payer’s mobile number on every order. Forms with a phone field use that answer; forms without one ask for it above the pay button.',
      },
      {
        label: 'Refunds',
        body: 'Issue refunds from the Cashfree dashboard. Refunding there does not change the response stored here — the submission stays marked paid.',
      },
    ],
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
/**
 * The reference block under each step.
 *
 * Payments are the one part of a form where a wrong guess costs real money and
 * the failure is usually silent, so what would otherwise be documentation
 * nobody opens sits directly under the step it belongs to.
 */
function Reference({
  title,
  facts,
  docsUrl,
  docsLabel,
}: {
  title: string;
  facts: { label: string; body: ReactNode }[];
  docsUrl?: string;
  docsLabel?: string;
}) {
  return (
    <Box mt="xl">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          {title}
        </Text>
        {docsUrl && (
          <Anchor
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            size="xs"
            style={{ flexShrink: 0 }}
          >
            {docsLabel} ↗
          </Anchor>
        )}
      </Group>
      <Box className={classes.refCard}>
        {facts.map((fact) => (
          <Box key={fact.label} className={classes.refRow}>
            <Text className={classes.refLabel}>{fact.label}</Text>
            <Text size="xs" c="dimmed" style={{ lineHeight: 1.55 }}>
              {fact.body}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

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

  // Everything live mode needs before it can take real money: keys saved and
  // proven, plus a webhook secret on the gateways that mint one.
  const liveReady = Boolean(
    current?.live.hasKeyId &&
      current.live.verifiedAt &&
      (copy.webhookSecretless || current.live.webhookSecretMask)
  );

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
              <Box className={classes.gatewayGrid}>
                {Object.values(settings.providers).map((p) => {
                  const connected = Boolean(
                    p.enabled && (p.mode === 'live' ? p.live.keyId : p.test.keyId)
                  );
                  const isDefault = settings.defaultProvider === p.provider;
                  return (
                    <button
                      key={p.provider}
                      type="button"
                      aria-pressed={provider === p.provider}
                      className={[
                        classes.gatewayCard,
                        provider === p.provider ? classes.gatewayCardActive : '',
                        connected ? '' : classes.gatewayCardIdle,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => switchProvider(p.provider)}
                    >
                      <Box className={classes.gatewayLogo}>
                        <GatewayLogo provider={p.provider} height={18} />
                      </Box>
                      <Box className={classes.gatewayStatus}>
                        <Box
                          className={classes.gatewayDot}
                          style={{
                            backgroundColor: !connected
                              ? 'var(--mantine-color-dimmed)'
                              : p.mode === 'live'
                                ? 'var(--mantine-color-emerald-6)'
                                : 'var(--mantine-color-orange-6)',
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          {!connected ? 'Not connected' : p.mode === 'live' ? 'Live' : 'Test'}
                        </Text>
                      </Box>
                      {isDefault && (
                        <Badge
                          size="xs"
                          variant="light"
                          color="gray"
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          Default
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </Box>

              {settings.defaultProvider === provider ? (
                <Text size="xs" c="dimmed" mt="xs" mb="md">
                  Forms that do not pick a gateway use this one.
                </Text>
              ) : (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  mt="xs"
                  mb="md"
                  onClick={() => save({ defaultProvider: provider })}
                  disabled={saving || !current?.enabled}
                >
                  Make {current?.label} the default
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
                      , or read{' '}
                      <Anchor href={copy.keysDocsUrl} target="_blank" rel="noreferrer" size="sm">
                        their guide to finding them ↗
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

                    <Reference
                      title={`About ${current?.label} keys`}
                      facts={copy.keyFacts}
                      docsUrl={copy.keysDocsUrl}
                      docsLabel="Their key guide"
                    />
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
                          <Code block className={classes.urlBlock}>
                            {providerWebhookUrl}
                          </Code>
                          <Text size="xs" c="dimmed" mt={6}>
                            Add this <strong>once</strong> in {current?.label}. It covers every
                            paid form in this workspace — you do not add one per form. Each
                            gateway needs its own URL, so this one is only for {current?.label}.
                          </Text>
                        </Box>

                        <Divider />

                        <Box>
                          <Group justify="space-between" mb={8} wrap="nowrap">
                            <Text size="sm" fw={600}>
                              Where to paste it
                            </Text>
                            <Anchor
                              href={copy.webhookConsoleUrl}
                              target="_blank"
                              rel="noreferrer"
                              size="xs"
                              style={{ flexShrink: 0 }}
                            >
                              Open {copy.webhookPath} ↗
                            </Anchor>
                          </Group>

                          <Stack gap={6}>
                            {copy.webhookSteps.map((instruction, index) => (
                              <Group key={index} gap={8} wrap="nowrap" align="flex-start">
                                <Box className={classes.stepNumber}>{index + 1}</Box>
                                <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
                                  {instruction}
                                </Text>
                              </Group>
                            ))}
                          </Stack>

                          <Text size="xs" fw={600} mt="md" mb={6}>
                            Events to subscribe
                          </Text>
                          <Group gap={6}>
                            {copy.webhookEvents.map((event) => (
                              <Code key={event}>{event}</Code>
                            ))}
                          </Group>

                          <Anchor
                            href={copy.webhookDocsUrl}
                            target="_blank"
                            rel="noreferrer"
                            size="xs"
                            display="block"
                            mt={10}
                          >
                            {current?.label} webhook documentation ↗
                          </Anchor>
                        </Box>

                        <Divider />

                        {copy.webhookSecretless ? (
                          <Alert variant="light" color="gray" radius="md" icon={<IconKey size={16} />}>
                            <Text size="xs">
                              <strong>No webhook secret to paste.</strong> {current?.label} signs
                              its webhooks with the <strong>{copy.secretLabel}</strong> you saved
                              in the previous step, so registering the URL above finishes this
                              step. If you did not find a secret in their dashboard, that is
                              why — there isn’t one.
                            </Text>
                          </Alert>
                        ) : (
                          <>
                            <PasswordInput
                              label="Webhook Secret"
                              description={
                                pair?.webhookSecretMask
                                  ? `Saved: ${pair.webhookSecretMask}. Leave blank to keep it.`
                                  : `The secret you set when creating the webhook in ${current?.label}.`
                              }
                              placeholder={
                                pair?.webhookSecretMask ? '••••••••' : 'Your webhook secret'
                              }
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
                          </>
                        )}
                      </Stack>
                    </Box>

                    {stepDone.webhook && (
                      <Group justify="flex-end">
                        <Button variant="light" onClick={() => setStep('golive')}>
                          Next: go live
                        </Button>
                      </Group>
                    )}

                    <Reference
                      title="About webhooks"
                      facts={copy.webhookFacts}
                      docsUrl={copy.webhookDocsUrl}
                      docsLabel="Their webhook guide"
                    />
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

                    {/* The expensive mistake: live mode switched on while the
                        live credentials are incomplete. Every respondent then
                        hits a failure at the moment they try to pay. */}
                    {(current?.mode ?? 'test') === 'live' && !liveReady && (
                      <Alert
                        variant="light"
                        color="red"
                        radius="md"
                        icon={<IconAlertTriangle size={16} />}
                        title="Live mode is not ready"
                      >
                        <Stack gap={4}>
                          {!current?.live.hasKeyId && (
                            <Text size="xs">No live keys are saved for {current?.label}.</Text>
                          )}
                          {current?.live.hasKeyId && !current.live.verifiedAt && (
                            <Text size="xs">
                              The live keys have never been verified — press “Test connection” on
                              the keys step.
                            </Text>
                          )}
                          {!copy.webhookSecretless && !current?.live.webhookSecretMask && (
                            <Text size="xs">
                              No live webhook secret is saved. Payments will be taken but never
                              confirmed.
                            </Text>
                          )}
                          <Text size="xs">
                            Switch back to test mode until this is resolved, or respondents will
                            be charged and their responses will not complete.
                          </Text>
                        </Stack>
                      </Alert>
                    )}

                    {copy.needsPhone && (
                      <Alert
                        variant="light"
                        color="orange"
                        radius="md"
                        icon={<IconAlertTriangle size={16} />}
                        title={`${current?.label} needs a phone number`}
                      >
                        <Text size="xs">
                          Every {current?.label} payment must carry the payer’s mobile number.
                          Forms with a phone field use that answer. A form without one shows
                          respondents an extra “Mobile number” box above the pay button — it
                          reaches {current?.label} and the receipt, but is not stored as an
                          answer, so add a phone field to any form where you want it in your
                          responses.
                        </Text>
                      </Alert>
                    )}

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

                    <Reference
                      title="Going live safely"
                      facts={copy.liveFacts}
                      docsUrl={copy.dashboardUrl}
                      docsLabel={`Open ${current?.label}`}
                    />
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
