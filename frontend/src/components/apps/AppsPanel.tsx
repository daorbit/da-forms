import { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Skeleton, Alert, Text, SegmentedControl } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle, IconPlugConnected, IconMail, IconCreditCard } from '@tabler/icons-react';
import { StatCards } from '@/components/ui/StatCards';
import classes from './apps.module.css';
import { listApps, getPaymentSettings, getWebhookApp, saveWebhookApp, ApiError } from '@/lib/api';
import type { AppCard as AppCardData, PaymentSettings, PaymentProvider } from '@/types';
import { AppCard, type PaymentCardData, type WebhookCardData } from './AppCard';
import { AppConnectDialog } from './AppConnectDialog';
import { PaymentsModal } from '../builder/PaymentsModal';

const CATEGORY_TITLE = {
  email: 'Email',
  payments: 'Payments',
  notification: 'Notifications',
  crm: 'CRM',
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
  const [filter, setFilter] = useState('all');

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

  const allCards = grouped.flatMap((g) => g.cards);
  const connectedCount = allCards.filter((c) => c.enabled).length;
  const shown = grouped
    .map((g) => ({
      ...g,
      cards: g.cards.filter((c) =>
        filter === 'all' ? true : filter === 'connected' ? c.connected || c.enabled : c.category === filter
      ),
    }))
    .filter((g) => g.cards.length > 0);

  return (
    <Stack gap="xl">
      {isDemo && (
        <Alert color="blue" variant="light" icon={<IconInfoCircle size={18} />}>
          Integrations are configured in your own workspace, not the demo.
        </Alert>
      )}

      {error && (
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
          {error}
        </Alert>
      )}

      <StatCards
        count={3}
        items={
          loading
            ? null
            : [
                { label: 'apps connected', icon: <IconPlugConnected size={18} />, value: `${connectedCount} of ${allCards.length}` },
                {
                  label: 'email delivery',
                  icon: <IconMail size={18} />,
                  value: allCards.find((c) => c.category === 'email' && c.enabled)?.name ?? 'Quantalog default',
                },
                {
                  label: 'payments',
                  icon: <IconCreditCard size={18} />,
                  value: allCards.find((c) => c.category === 'payments' && c.enabled)?.name ?? 'Not set up',
                },
              ]
        }
      />

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        style={{ alignSelf: 'flex-start' }}
        data={[
          { value: 'all', label: 'All' },
          { value: 'connected', label: 'Connected' },
          ...CATEGORY_ORDER.filter((c) => grouped.some((g) => g.category === c)).map((c) => ({
            value: c,
            label: CATEGORY_TITLE[c],
          })),
        ]}
      />

      {loading ? (
        <div className={classes.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={180} radius="md" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          Nothing connected yet — pick an app under All to get started.
        </Text>
      ) : (
        shown.map(({ category, cards }) => (
          <div key={category}>
            <Text fw={600} size="sm" mb="sm">
              {CATEGORY_TITLE[category]}
            </Text>
            <div className={classes.grid}>
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
            </div>
          </div>
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
