import { useCallback, useEffect, useMemo, useState } from 'react';
import { SimpleGrid, Stack, Skeleton, Alert, Title, Text } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { listApps, getPaymentSettings, getWebhookApp, saveWebhookApp, ApiError } from '@/lib/api';
import type { AppCard as AppCardData, PaymentSettings, PaymentProvider } from '@/types';
import { AppCard, type PaymentCardData, type WebhookCardData } from './AppCard';
import { AppConnectDialog } from './AppConnectDialog';
import { PaymentsModal } from '../builder/PaymentsModal';

const CATEGORY_TITLE = {
  email: 'Email delivery',
  payments: 'Payments',
  notification: 'Notifications',
  crm: 'Marketing & CRM',
  automation: 'Automation',
} as const;

type Category = keyof typeof CATEGORY_TITLE;

const CATEGORY_ORDER: Category[] = ['email', 'payments', 'notification', 'crm', 'automation'];

const PAYMENT_PROVIDERS: { id: PaymentProvider; name: string; description: string }[] = [
  { id: 'razorpay', name: 'Razorpay', description: 'Take payments on your forms through Razorpay.' },
  { id: 'cashfree', name: 'Cashfree', description: 'Take payments on your forms through Cashfree.' },
  { id: 'payu', name: 'PayU', description: 'Take payments on your forms through PayU.' },
];

/** The 3 payment gateways as cards, their state read from the payment settings. */
function paymentCards(settings: PaymentSettings | null): PaymentCardData[] {
  return PAYMENT_PROVIDERS.map((p) => {
    const view = settings?.providers?.[p.id];
    return {
      kind: 'payment',
      id: p.id,
      name: p.name,
      category: 'payments',
      description: p.description,
      connected: Boolean(view?.test.hasKeyId || view?.live.hasKeyId),
      enabled: Boolean(view?.enabled),
    };
  });
}

interface Props {
  workspaceId: string;
  isDemo: boolean;
  /** Bumps whenever a parent wants a reload (e.g. the panel just became visible). */
  reloadKey?: number;
}

 
export function AppsPanel({ workspaceId, isDemo, reloadKey = 0 }: Props) {
  const [apps, setApps] = useState<AppCardData[]>([]);
  const [payments, setPayments] = useState<PaymentSettings | null>(null);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [payFocus, setPayFocus] = useState<PaymentProvider | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      listApps(workspaceId),
      getPaymentSettings(workspaceId).catch(() => null),
      getWebhookApp(workspaceId).catch(() => ({ enabled: false })),
    ])
      .then(([appList, paySettings, webhookApp]) => {
        setApps(appList);
        setPayments(paySettings);
        setWebhookEnabled(webhookApp.enabled);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load integrations.')
      )
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!isDemo) load();
    else setLoading(false);
  }, [isDemo, load, reloadKey]);

  const openApp = useMemo(() => apps.find((a) => a.id === openId) ?? null, [apps, openId]);

  const grouped = useMemo(() => {
    const generic = apps.map((a) => ({ kind: 'generic' as const, ...a }));
    const webhookCard: WebhookCardData = {
      kind: 'webhook',
      id: 'webhook',
      name: 'Webhook',
      category: 'automation',
      description:
        'Turn on to let any form send its submissions to a URL. Set the URL and secret from that form’s own Webhook panel.',
      connected: webhookEnabled,
      enabled: webhookEnabled,
    };
    const all = [...generic, ...paymentCards(payments), webhookCard];
    const map = new Map<Category, (typeof all)[number][]>();
    for (const card of all) {
      const list = map.get(card.category as Category) ?? [];
      list.push(card);
      map.set(card.category as Category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      cards: map.get(c)!,
    }));
  }, [apps, payments, webhookEnabled]);

  function replaceCard(card: AppCardData) {
    setApps((prev) => prev.map((a) => (a.id === card.id ? card : a)));
  }

  function toggleWebhook() {
    const next = !webhookEnabled;
    setWebhookEnabled(next);
    setWebhookBusy(true);
    saveWebhookApp(next, workspaceId)
      .catch(() => setWebhookEnabled(!next))
      .finally(() => setWebhookBusy(false));
  }

  return (
    <Stack gap="xl">
      {isDemo && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={18} />}>
          Integrations are configured in your own workspace, not the demo.
        </Alert>
      )}

      <Text size="sm" c="dimmed" maw={640}>
        Connect an email provider so this workspace sends its own notification emails, and a payment
        gateway to charge on your forms. Notification and CRM apps follow.
      </Text>

      {error && (
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
          {error}
        </Alert>
      )}

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={190} radius="md" />
          ))}
        </SimpleGrid>
      ) : (
        grouped.map(({ category, cards }) => (
          <Stack key={category} gap="sm">
            <Title order={5}>{CATEGORY_TITLE[category]}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {cards.map((card) => (
                <AppCard
                  key={card.id}
                  card={card}
                  busy={card.kind === 'webhook' ? webhookBusy : false}
                  onOpen={() => {
                    if (card.kind === 'payment') setPayFocus(card.id as PaymentProvider);
                    else if (card.kind === 'webhook') toggleWebhook();
                    else setOpenId(card.id);
                  }}
                />
              ))}
            </SimpleGrid>
          </Stack>
        ))
      )}

      {!isDemo && (
        <>
          <AppConnectDialog
            app={openApp}
            workspaceId={workspaceId}
            onClose={() => setOpenId(null)}
            onSaved={replaceCard}
            onDisconnected={setApps}
          />
          <PaymentsModal
            opened={payFocus !== null}
            focusProvider={payFocus ?? undefined}
            onClose={() => {
              setPayFocus(null);
              getPaymentSettings(workspaceId).then(setPayments).catch(() => {});
            }}
            workspaceId={workspaceId}
            webhookUrl={`${
              import.meta.env.VITE_API_URL ?? `${window.location.origin}/api`
            }/public/workspaces/${workspaceId}/payments/webhook`}
          />
        </>
      )}
    </Stack>
  );
}
