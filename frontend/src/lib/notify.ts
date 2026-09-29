import type { ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import classes from '@/components/Toast.module.css';

const DEDUPE_MS = 4000;
const recent = new Map<string, number>();

type ToastTone = 'neutral' | 'error' | 'warn';

const TONE_CLASS: Record<ToastTone, string> = {
  neutral: classes.toast,
  error: `${classes.toast} ${classes.error}`,
  warn: `${classes.toast} ${classes.warn}`,
};

function showDeduped(message: ReactNode, tone: ToastTone, autoClose: number) {
  const key = `${tone}|${String(message ?? '')}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEDUPE_MS) return;
  recent.set(key, now);
  if (recent.size > 50) {
    for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
  }
  notifications.show({
    message,
    autoClose,
    withCloseButton: false,
    classNames: {
      root: TONE_CLASS[tone],
      body: classes.body,
      description: classes.message,
    },
  });
}

export const notify = {
  success: (message: ReactNode, title?: ReactNode) =>
    showDeduped(message || title, 'neutral', 3000),

  error: (message: ReactNode, title?: ReactNode) => showDeduped(message || title, 'error', 5000),

  warn: (message: ReactNode, title?: ReactNode, duration = 5000) =>
    showDeduped(message || title, 'warn', duration),

  info: (message: ReactNode, title?: ReactNode, duration = 3000) =>
    showDeduped(message || title, 'neutral', duration),
};
