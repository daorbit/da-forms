import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Skeleton, Alert, Text } from '@mantine/core';
import { InfoIcon, TriangleAlertIcon } from 'lucide-react';
import classes from './apps.module.css';
import { listApps, getPaymentSettings, getWebhookApp, saveWebhookApp, ApiError } from '@/lib/api';
import type { AppCard as AppCardData, PaymentSettings, PaymentProvider } from '@/types';
import { AppCard, type CalendarCardData, type PaymentCardData, type WebhookCardData } from './AppCard';
import { AppConnectDialog } from './AppConnectDialog';
import { GoogleCalendarDialog } from './GoogleCalendarDialog';
import { useCalendarConnection } from '@/hooks/useCalendarConnection';
import { PaymentsModal } from '../builder/PaymentsModal';

const CATEGORY_TITLE = {
  email: 'Email delivery',
  payments: 'Payments',
  scheduling: 'Scheduling',
  notification: 'Notifications',
  crm: 'CRM',
  automation: 'Automation',
} as const;

type Category = keyof typeof CATEGORY_TITLE;

const CATEGORY_HINT: Record<Category, string> = {
  email: 'Where this workspace’s notification emails are sent from. One provider is active at a time.',
  payments: 'Gateways your forms can charge through. Keys stay encrypted on the server.',
  scheduling: 'Calendars your booking fields check for busy times and add events to.',
  notification: 'Places a new response can be announced.',
  crm: 'Tools a response can be copied into.',
  automation: 'Send each submission on to your own systems.',
};

const CATEGORY_ORDER: Category[] = ['email', 'payments', 'scheduling', 'notification', 'crm', 'automation'];

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendar = useCalendarConnection(workspaceId, !isDemo);
  const refreshCalendar = calendar.refresh;

  useEffect(() => {
    if (!isDemo && reloadKey) void refreshCalendar();
  }, [isDemo, reloadKey, refreshCalendar]);

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
    const calendarCards: CalendarCardData[] = calendar.status?.configured
      ? [
          {
            kind: 'calendar',
            id: 'google-calendar',
            name: 'Google Calendar',
            category: 'scheduling',
            description: 'Block busy times on booking fields, add every booking to your calendar and send a Google Meet link.',
            connected: calendar.status.connected,
            enabled: calendar.status.connected,
            account: calendar.status.email,
          },
        ]
      : [];
    const all = [...generic, ...paymentCards(payments), ...calendarCards, webhookCard];
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
  }, [apps, payments, webhookEnabled, calendar.status]);

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
    <div>
      {isDemo && (
        <Alert color="blue" variant="light" mb="lg" icon={<InfoIcon size={18} />}>
          Integrations are configured in your own workspace, not the demo.
        </Alert>
      )}

      {error && (
        <Alert color="red" variant="light" mb="lg" icon={<TriangleAlertIcon size={16} />}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className={classes.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={230} radius="md" />
          ))}
        </div>
      ) : (
        grouped.map(({ category, cards }) => (
          <section key={category} className={classes.section}>
            <Box mb="lg">
              <Text fw={650} size="sm" style={{ letterSpacing: '-0.01em' }}>
                {CATEGORY_TITLE[category]}
              </Text>
              <Text c="dimmed" size="xs" mt={2}>
                {CATEGORY_HINT[category]}
              </Text>
            </Box>
            <div className={classes.grid}>
              {cards.map((card) => (
                <AppCard
                  key={card.id}
                  card={card}
                  busy={card.kind === 'webhook' ? webhookBusy : card.kind === 'calendar' ? calendar.busy : false}
                  onOpen={() => {
                    if (card.kind === 'payment') setPayFocus(card.id as PaymentProvider);
                    else if (card.kind === 'webhook') toggleWebhook();
                    else if (card.kind === 'calendar') {
                      if (card.connected) setCalendarOpen(true);
                      else void calendar.connect();
                    }
                    else setOpenId(card.id);
                  }}
                />
              ))}
            </div>
          </section>
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
          <GoogleCalendarDialog
            opened={calendarOpen && Boolean(calendar.status?.connected)}
            status={calendar.status}
            busy={calendar.busy}
            onClose={() => setCalendarOpen(false)}
            onReconnect={() => void calendar.connect()}
            onDisconnect={async () => {
              await calendar.disconnect();
              setCalendarOpen(false);
            }}
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
    </div>
  );
}
