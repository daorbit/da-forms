import type { ReactNode } from 'react';
import { notifications } from '@mantine/notifications';

const DEDUPE_MS = 4000;
const recent = new Map<string, number>();

function showDeduped(opts: Parameters<typeof notifications.show>[0]) {
  const key = `${opts.color ?? ''}|${String(opts.title ?? '')}|${String(opts.message ?? '')}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEDUPE_MS) return;
  recent.set(key, now);
  if (recent.size > 50) {
    for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
  }
  notifications.show(opts);
}

export const notify = {
  success: (message: ReactNode, title?: ReactNode) =>
    showDeduped({ title, message, color: 'emerald', autoClose: 3000 }),

  error: (message: ReactNode, title?: ReactNode) =>
    showDeduped({ title, message, color: 'red', autoClose: 5000 }),

  warn: (message: ReactNode, title?: ReactNode) =>
    showDeduped({ title, message, color: 'orange', autoClose: 5000 }),

  info: (message: ReactNode, title?: ReactNode) =>
    showDeduped({ title, message, color: 'gray', autoClose: 3000 }),
};
