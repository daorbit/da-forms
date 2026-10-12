import type { FormField, FieldType } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { flattenFields } from '../lib/pipe.js';
import { leadScoreOf } from '../lib/leadScore.js';
import { applyCalculatedFields } from './form.service.js';

export const IMPORT_ROW_LIMIT = 500;

const MAX_VALUE_LENGTH = 5000;

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

export function importableFields(fields: FormField[]): FormField[] {
  return flattenFields(fields).filter((field) => !NOT_IMPORTABLE.includes(field.type));
}

function cleanRow(raw: unknown, allowed: Set<string>): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    const text = String(value).trim().slice(0, MAX_VALUE_LENGTH);
    if (text) data[key] = text;
  }
  return Object.keys(data).length ? data : null;
}

export function cleanTags(tags: unknown): string[] {
  const base = ['imported'];
  if (!Array.isArray(tags)) return base;
  const extra = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase().slice(0, 40))
    .filter(Boolean)
    .slice(0, 5);
  return [...new Set([...base, ...extra])];
}

function bookingOf(field: FormField | undefined, data: Record<string, string>) {
  if (!field) return undefined;
  const raw = data[field.id];
  if (!raw) return undefined;
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) {
    delete data[field.id];
    return undefined;
  }
  data[field.id] = start.toISOString();
  const end = new Date(start.getTime() + (field.booking?.duration ?? 30) * 60_000);
  return { fieldId: field.id, start, end, timezone: field.booking?.timezone ?? 'UTC' };
}

export async function importSubmissions(
  formId: string,
  fields: FormField[],
  rows: unknown[],
  tags: string[]
): Promise<{ imported: number; skipped: number }> {
  const allowed = new Set(importableFields(fields).map((field) => field.id));
  const bookingField = flattenFields(fields).find((field) => field.type === 'booking');
  const docs = [];
  let skipped = 0;

  for (const raw of rows) {
    const data = cleanRow(raw, allowed);
    if (!data) {
      skipped++;
      continue;
    }
    const booking = bookingOf(bookingField, data);
    applyCalculatedFields(fields, data);
    const leadScore = leadScoreOf(fields, data);
    docs.push({
      formId,
      data,
      ...(booking ? { booking } : {}),
      status: 'complete' as const,
      stage: 'new' as const,
      tags,
      read: true,
      ...(leadScore !== undefined ? { leadScore } : {}),
    });
  }

  if (docs.length) await SubmissionModel.insertMany(docs, { ordered: false });
  return { imported: docs.length, skipped };
}
