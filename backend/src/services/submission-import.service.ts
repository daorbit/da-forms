import type { FormField, FieldType } from '../models/form.model.js';
import { randomUUID } from 'node:crypto';
import { SubmissionModel, SUBMISSION_STAGES } from '../models/submission.model.js';
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
  'image',
  'loader',
  'countdown',
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

function metaText(raw: unknown, key: string, max: number): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = (raw as Record<string, unknown>)[`__${key}`];
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, max);
  return text || undefined;
}

function httpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

function leadDetails(raw: unknown, baseTags: string[]) {
  const stageText = metaText(raw, 'stage', 20)?.toLowerCase();
  const stage = SUBMISSION_STAGES.find((s) => s === stageText) ?? 'new';
  const assignee = metaText(raw, 'assignee', 80);
  const rowTags = (metaText(raw, 'tags', 400) ?? '')
    .split(',')
    .map((tag) => tag.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 10);
  const noteText = metaText(raw, 'note', 2000);
  const submitted = metaText(raw, 'submittedAt', 40);
  const submittedAt = submitted ? new Date(submitted) : undefined;
  const createdAt =
    submittedAt && !Number.isNaN(submittedAt.getTime()) && submittedAt.getTime() <= Date.now() ? submittedAt : undefined;

  return {
    stage,
    tags: [...new Set([...baseTags, ...rowTags])],
    ...(assignee ? { assignee } : {}),
    ...(noteText ? { notes: [{ id: randomUUID(), text: noteText, createdAt: new Date() }] } : {}),
    ...(createdAt ? { createdAt } : {}),
    meetLink: httpsUrl(metaText(raw, 'meetLink', 500)),
    eventLink: httpsUrl(metaText(raw, 'eventLink', 1000)),
  };
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
    const { meetLink, eventLink, ...details } = leadDetails(raw, tags);
    const slot = bookingOf(bookingField, data);
    const booking = slot
      ? { ...slot, ...(meetLink ? { meetLink } : {}), ...(eventLink ? { eventLink } : {}) }
      : undefined;
    applyCalculatedFields(fields, data);
    const leadScore = leadScoreOf(fields, data);
    docs.push({
      formId,
      data,
      ...(booking ? { booking } : {}),
      status: 'complete' as const,
      read: true,
      ...details,
      ...(leadScore !== undefined ? { leadScore } : {}),
    });
  }

  if (docs.length) await SubmissionModel.insertMany(docs, { ordered: false });
  return { imported: docs.length, skipped };
}
