/** `undefined` for an empty box, so a cleared date removes the bound entirely. */
export function toIso(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * An ISO instant as `datetime-local` wants it: local time, no zone, no seconds.
 *
 * The input has no notion of a timezone, so the string it is given is read as
 * whatever the owner's browser is set to — which is what they mean when they
 * type a closing time.
 */
export function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
