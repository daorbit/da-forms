import type { FieldType, FormField } from '@/types';
import { flattenFields } from '@/lib/fieldTree';

const NOT_IMPORTABLE: FieldType[] = [
  'heading',
  'description',
  'richText',
  'divider',
  'spacer',
  'pageBreak',
  'grid',
  'payment',
  'matrix',
  'ranking',
  'file',
  'imageUpload',
  'mediaUpload',
  'signature',
  'calculated',
  'uniqueId',
  'randomId',
  'repeater',
];

export const MAX_IMPORT_ROWS = 2000;

const MULTI: FieldType[] = ['checkbox', 'multipleChoice', 'chips'];
const SINGLE: FieldType[] = ['select', 'radio', 'likert', 'country'];
const TOGGLES: FieldType[] = ['terms', 'decisionBox'];

export interface ImportColumn {
  field: FormField;
  header: string;
}

export function importColumns(fields: FormField[]): ImportColumn[] {
  const seen = new Map<string, number>();
  return flattenFields(fields)
    .filter((field) => !NOT_IMPORTABLE.includes(field.type))
    .map((field) => {
      const base = (field.label || 'Untitled').trim();
      const count = (seen.get(base.toLowerCase()) ?? 0) + 1;
      seen.set(base.toLowerCase(), count);
      return { field, header: count > 1 ? `${base} (${count})` : base };
    });
}

export function formatHint(field: FormField): string {
  switch (field.type) {
    case 'date':
      return 'Date, e.g. 2026-10-12';
    case 'datetime':
      return 'Date and time, e.g. 2026-10-12 14:30';
    case 'booking':
      return 'Meeting start in your time, e.g. 2026-10-12 14:30';
    case 'time':
      return 'Time, e.g. 14:30';
    case 'monthYear':
      return 'Month, e.g. 2026-10';
    case 'dateRange':
      return 'e.g. 2026-10-12 to 2026-10-15';
    case 'timeRange':
      return 'e.g. 09:00 to 17:00';
    case 'yesNo':
      return 'Yes or No';
    case 'terms':
    case 'decisionBox':
      return 'Yes or No';
    case 'number':
    case 'decimal':
    case 'currency':
    case 'rating':
    case 'slider':
    case 'nps':
      return 'A number';
    case 'email':
      return 'Email address';
    case 'phone':
      return 'Phone number with country code';
    case 'website':
      return 'Web address';
    default:
      if (MULTI.includes(field.type)) return 'One or more options, separated by commas';
      if (SINGLE.includes(field.type) && field.options?.length) return 'One of the listed options';
      return 'Text';
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

function datePart(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function timePart(d: Date) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function fromDate(type: FieldType, d: Date): string {
  switch (type) {
    case 'time':
      return timePart(d);
    case 'datetime':
      return `${datePart(d)} ${timePart(d)}:00`;
    case 'monthYear':
      return `${datePart(d).slice(0, 7)}-01`;
    default:
      return datePart(d);
  }
}

function isoDay(text: string): string {
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  return text;
}

function matchOption(field: FormField, value: string): string {
  const option = field.options?.find((o) => o.toLowerCase() === value.toLowerCase());
  return option ?? value;
}

const TRUTHY = ['yes', 'y', 'true', '1', 'x', '✓'];

function localInstant(value: Date | string): string {
  if (value instanceof Date) {
    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      value.getUTCHours(),
      value.getUTCMinutes(),
    ).toISOString();
  }
  const [day, time = '00:00'] = value.trim().split(/[ T]+/);
  const [y, m, d] = isoDay(day).split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const parsed = new Date(y, (m || 1) - 1, d || 1, h || 0, mi || 0);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function normalizeValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (field.type === 'booking') {
    if (value instanceof Date) return localInstant(value);
    const raw = String(value).trim();
    return raw ? localInstant(raw) : '';
  }
  if (value instanceof Date) return fromDate(field.type, value);
  const text = String(value).trim();
  if (!text) return '';

  switch (field.type) {
    case 'yesNo':
      return TRUTHY.includes(text.toLowerCase()) ? 'yes' : 'no';
    case 'date':
      return isoDay(text);
    case 'datetime': {
      const [day, time = '00:00'] = text.split(/[ T]/);
      return `${isoDay(day)} ${time.length === 5 ? `${time}:00` : time}`;
    }
    case 'monthYear':
      return /^\d{4}-\d{2}$/.test(text) ? `${text}-01` : text;
    default:
      if (TOGGLES.includes(field.type)) return String(TRUTHY.includes(text.toLowerCase()));
      if (MULTI.includes(field.type)) {
        return text
          .split(/[,;]/)
          .map((part) => matchOption(field, part.trim()))
          .filter(Boolean)
          .join(', ');
      }
      if (SINGLE.includes(field.type)) return matchOption(field, text);
      return text;
  }
}
