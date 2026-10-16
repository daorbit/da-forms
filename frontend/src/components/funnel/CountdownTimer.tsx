import { useEffect, useState, type CSSProperties } from 'react';
import { TimerIcon } from 'lucide-react';
import type { FormField } from '@/types';
import { useFormId } from '@/components/FormIdContext';
import classes from './CountdownTimer.module.css';

const DEFAULT_MINUTES = 15;

function storageKey(formId: string | undefined, fieldId: string): string {
  return `da-forms:countdown:${formId ?? 'preview'}:${fieldId}`;
}

function readDeadline(key: string, minutes: number): number {
  try {
    const saved = Number(sessionStorage.getItem(key));
    if (saved && saved > Date.now()) return saved;
    const next = Date.now() + minutes * 60_000;
    sessionStorage.setItem(key, String(next));
    return next;
  } catch {
    return Date.now() + minutes * 60_000;
  }
}

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CountdownTimer({ field, accentColor }: { field: FormField; accentColor?: string }) {
  const formId = useFormId();
  const minutes = Math.max(1, field.duration ?? DEFAULT_MINUTES);
  const [deadline] = useState(() => readDeadline(storageKey(formId, field.id), minutes));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = deadline - now;
  const vars = (accentColor ? { '--countdown-accent': accentColor } : {}) as CSSProperties;

  return (
    <div className={classes.root} style={vars} data-expired={left <= 0 || undefined}>
      <TimerIcon size={18} className={classes.icon} />
      <span className={classes.label}>{left > 0 ? field.label || 'Offer reserved for' : field.content || 'Offer time is up'}</span>
      <span className={classes.time}>{format(left)}</span>
    </div>
  );
}
