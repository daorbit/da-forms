import type { FieldType, FormField } from '@/types';
import { flattenFields } from '@/lib/fieldTree';
import { STAGES } from '@/lib/stages';

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

export type MetaKey = 'stage' | 'assignee' | 'tags' | 'note' | 'submittedAt' | 'meetLink' | 'eventLink';

export interface ImportColumn {
  id: string;
  header: string;
  required: boolean;
  options?: string[];
  field?: FormField;
  meta?: MetaKey;
}

type BookingSetup = { calendar: boolean; meet: boolean };

const META: { key: MetaKey; header: string; when?: (setup: BookingSetup) => boolean }[] = [
  { key: 'stage', header: 'Stage' },
  { key: 'assignee', header: 'Assignee' },
  { key: 'tags', header: 'Tags' },
  { key: 'note', header: 'Note' },
  { key: 'submittedAt', header: 'Submitted at' },
  { key: 'meetLink', header: 'Google Meet link', when: (setup) => setup.meet },
  { key: 'eventLink', header: 'Calendar event link', when: (setup) => setup.calendar },
];

export function metaId(key: MetaKey): string {
  return `__${key}`;
}

export function importColumns(fields: FormField[]): ImportColumn[] {
  const flat = flattenFields(fields);
  const seen = new Map<string, number>();
  const unique = (base: string) => {
    const count = (seen.get(base.toLowerCase()) ?? 0) + 1;
    seen.set(base.toLowerCase(), count);
    return count > 1 ? `${base} (${count})` : base;
  };

  const answers: ImportColumn[] = flat
    .filter((field) => !NOT_IMPORTABLE.includes(field.type))
    .map((field) => ({
      id: field.id,
      header: unique((field.label || 'Untitled').trim()),
      required: Boolean(field.required),
      options: field.options,
      field,
    }));

  const booking = flat.find((field) => field.type === 'booking')?.booking;
  const setup: BookingSetup = {
    calendar: Boolean(booking?.syncCalendar),
    meet: Boolean(booking?.syncCalendar && booking.addMeet),
  };
  const meta: ImportColumn[] = META.filter((m) => !m.when || m.when(setup)).map((m) => ({
    id: metaId(m.key),
    header: unique(m.header),
    required: false,
    options: m.key === 'stage' ? STAGES.map((s) => s.label) : undefined,
    meta: m.key,
  }));

  return [...answers, ...meta];
}

const META_HINT: Record<MetaKey, string> = {
  stage: 'New, Contacted, Qualified, Won or Lost',
  assignee: 'Who handles this lead',
  tags: 'Labels, separated by commas',
  note: 'An internal note',
  submittedAt: 'Date and time, e.g. 2026-10-12 14:30',
  meetLink: 'Existing Meet link, if the meeting has one',
  eventLink: 'Existing Google Calendar event link',
};

export function columnHint(column: ImportColumn): string {
  if (column.meta) return META_HINT[column.meta];
  const field = column.field!;
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

export function hasDropdown(column: ImportColumn): boolean {
  if (column.meta === 'stage') return true;
  return Boolean(column.field && ['select', 'radio', 'likert'].includes(column.field.type) && column.options?.length);
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

function matchOption(options: string[] | undefined, value: string): string {
  return options?.find((o) => o.toLowerCase() === value.toLowerCase()) ?? value;
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

function instantOf(value: unknown): string {
  if (value instanceof Date) return localInstant(value);
  const raw = String(value).trim();
  return raw ? localInstant(raw) : '';
}

function normalizeMeta(key: MetaKey, value: unknown): string {
  if (key === 'submittedAt') return instantOf(value);
  const text = String(value).trim();
  if (!text) return '';
  if (key === 'stage') return STAGES.find((s) => s.label.toLowerCase() === text.toLowerCase() || s.id === text.toLowerCase())?.id ?? '';
  if (key === 'meetLink' || key === 'eventLink') return /^https:\/\//i.test(text) ? text : '';
  return text;
}

export function normalizeValue(column: ImportColumn, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (column.meta) return normalizeMeta(column.meta, value);
  const field = column.field!;
  if (field.type === 'booking') return instantOf(value);
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
          .map((part) => matchOption(field.options, part.trim()))
          .filter(Boolean)
          .join(', ');
      }
      if (SINGLE.includes(field.type)) return matchOption(field.options, text);
      return text;
  }
}
