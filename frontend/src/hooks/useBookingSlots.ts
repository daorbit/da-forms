import { useEffect, useMemo, useState } from 'react';
import type { FormField } from '@/types';
import { getBookingSlots } from '@/lib/api';
import { withBookingDefaults } from '@/lib/booking';
import { candidateSlots } from '@/lib/bookingSlots';
import { addDays } from '@/lib/zonedTime';

function monthRange(month: string): [string, string] {
  const [y, m] = month.split('-').map(Number);
  const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`;
  return [addDays(month, -1), nextMonth];
}

export function useBookingSlots(formId: string | undefined, field: FormField, month: string) {
  const config = useMemo(() => withBookingDefaults(field.booking), [field.booking]);
  const [from, to] = monthRange(month);
  const [version, setVersion] = useState(0);
  const [remote, setRemote] = useState<{ key: string; slots: string[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const key = `${formId}|${field.id}|${from}|${to}|${version}`;

  const preview = useMemo(
    () => (formId ? null : candidateSlots(config, from, to, new Date()).map((s) => s.start.toISOString())),
    [formId, config, from, to]
  );

  useEffect(() => {
    if (!formId) return;
    let cancelled = false;
    getBookingSlots(formId, field.id, from, to)
      .then((result) => !cancelled && setRemote({ key, slots: result.slots }))
      .catch(() => !cancelled && setFailedKey(key));
    return () => {
      cancelled = true;
    };
  }, [formId, field.id, from, to, key]);

  const reload = () => setVersion((v) => v + 1);

  if (preview) return { slots: preview, loading: false, failed: false, reload };
  const slots = remote?.key === key ? remote.slots : null;
  const failed = failedKey === key;
  return { slots: slots ?? [], loading: !slots && !failed, failed, reload };
}
