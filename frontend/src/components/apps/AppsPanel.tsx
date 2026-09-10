import { useCallback, useEffect, useMemo, useState } from 'react';
import { SimpleGrid, Stack, Skeleton, Alert, Title, Text } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { listApps, getPaymentSettings, ApiError } from '@/lib/api';
import type { AppCard as AppCardData, PaymentSettings, PaymentProvider } from '@/types';
import { AppCard, type PaymentCardData } from './AppCard';
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

/**
 * The integrations card grid — email apps, payment gateways, and later the
 * notification and CRM apps. Rendered by both the standalone Integrations page
 * and the in-editor dialog, so the two stay identical.
 */
export function AppsPanel({ workspaceId, isDemo, reloadKey = 0 }: Props) {
  const [apps, setApps] = useState<AppCardData[]>([]);
  const [payments, setPayments] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [payFocus, setPayFocus] = useState<PaymentProvider | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listApps(workspaceId), getPaymentSettings(workspaceId).catch(() => null)])
      .then(([appList, paySettings]) => {
        setApps(appList);
        setPayments(paySettings);
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
    const all = [...generic, ...paymentCards(payments)];
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
  }, [apps, payments]);

  function replaceCard(card: AppCardData) {
    setApps((prev) => prev.map((a) => (a.id === card.id ? card : a)));
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
                  onOpen={() =>
                    card.kind === 'payment'
                      ? setPayFocus(card.id as PaymentProvider)
                      : setOpenId(card.id)
                  }
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
