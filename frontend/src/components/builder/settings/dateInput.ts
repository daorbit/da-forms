import dayjs from 'dayjs';

const PICKER_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function toIso(value: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : undefined;
}

export function toPickerValue(iso: string | undefined): string | null {
  if (!iso) return null;
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format(PICKER_FORMAT) : null;
}
