

import { Types } from 'mongoose';
import { FormModel } from '../models/form.model.js';
import { SubmissionModel, type SubmissionPayment } from '../models/submission.model.js';
import { FormViewModel } from '../models/formView.model.js';
import { evaluateFormula, numericValues } from '../lib/formula.js';
import {
  claimUploads,
  destroyFormBackground,
  destroyUploadsForForm,
  destroyUploadsForSubmissions,
} from './media.service.js';
import type {
  FormField,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormTheme,
  FormStep,
  StepIndicator,
  NotificationSettings,
  WebhookSettings,
  FormSchedule,
} from '../models/form.model.js';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RetiredColumn {
  id: string;

  label: string;
}

const sortMap = {
  name: { name: 1 as const },
  nameDesc: { name: -1 as const },
  date: { createdAt: -1 as const },
  dateAsc: { createdAt: 1 as const },
  status: { status: 1 as const },
};

export interface WorkspaceStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalViews: number;
  totalSubmissions: number;
}

export interface FormListResult extends Paginated<Record<string, unknown>> {

  stats: WorkspaceStats;
}

export async function listForms(
  workspaceId: string,
  options: {
    page?: number;
    limit?: number;
    q?: string;
    sort?: keyof typeof sortMap;
    status?: 'published' | 'draft';
  } = {}
): Promise<FormListResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const filter: Record<string, unknown> = { workspaceId };
  if (options.q) filter.name = { $regex: options.q, $options: 'i' };

  if (options.status) filter.status = options.status;
  const sort = sortMap[options.sort ?? 'date'];

  const [items, total, allForms] = await Promise.all([
    FormModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    FormModel.countDocuments(filter),

    FormModel.find({ workspaceId }, { status: 1, viewCount: 1 }),
  ]);

  const formIds = allForms.map((f) => f._id);
  const [totalSubmissions, publishedForms, pageCounts] = await Promise.all([
    formIds.length
      ? SubmissionModel.countDocuments({ formId: { $in: formIds }, status: 'complete' })
      : 0,
    allForms.filter((f) => f.status === 'published').length,
    // Responses per form, for this page only — the list shows a count on each row.
    items.length
      ? SubmissionModel.aggregate<{ _id: unknown; count: number }>([
          { $match: { formId: { $in: items.map((f) => f._id) }, status: 'complete' } },
          { $group: { _id: '$formId', count: { $sum: 1 } } },
        ])
      : [],
  ]);
  const countByForm = new Map(pageCounts.map((c) => [String(c._id), c.count]));

  return {
    items: items.map((f) => ({ ...f.toJSON(), submissionCount: countByForm.get(String(f._id)) ?? 0 })),
    total,
    page,
    limit,
    stats: {
      totalForms: allForms.length,
      publishedForms,
      draftForms: allForms.length - publishedForms,
      totalViews: allForms.reduce((sum, f) => sum + (f.viewCount ?? 0), 0),
      totalSubmissions,
    },
  };
}

export function getForm(id: string) {
  return FormModel.findById(id);
}

export function countForms(workspaceId: string) {
  return FormModel.countDocuments({ workspaceId });
}

export function createForm(input: {
  name: string;
  title: string;
  description?: string;
  workspaceId: string;
  fields: FormField[];
  redirectUrl?: string;
  thankYouMessage?: string;
  hideHeader?: boolean;
  headerAlign?: SubmitButtonAlign;
  labelPlacement?: 'top' | 'left' | 'right';
  submitLabel?: string;
  submitButtonSize?: 'small' | 'medium' | 'large';
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
  collectIp?: boolean;
  notifications?: NotificationSettings;
  requireCaptcha?: boolean;
  collectPartials?: boolean;
  allowEdit?: boolean;
  schedule?: FormSchedule;
}) {
  return FormModel.create(input);
}

export function updateForm(
  id: string,
  workspaceId: string,
  input: Partial<{
    name: string;
    title: string;
    description: string;
    fields: FormField[];
    status: 'draft' | 'published';
    redirectUrl: string;
    thankYouMessage: string;
    hideHeader: boolean;
    headerAlign: SubmitButtonAlign;
    labelPlacement: 'top' | 'left' | 'right';
    submitLabel: string;
    submitButtonSize: 'small' | 'medium' | 'large';
    submitButtonWidth: SubmitButtonWidth;
    submitButtonAlign: SubmitButtonAlign;
    theme: FormTheme;
    steps: FormStep[];
    stepIndicator: StepIndicator;
    showStepHeadings: boolean;
    collectIp: boolean;
    notifications: NotificationSettings;
    webhook: WebhookSettings;
    requireCaptcha: boolean;
    collectPartials: boolean;
    allowEdit: boolean;
    schedule: FormSchedule;
  }>
) {
  return FormModel.findOneAndUpdate({ _id: id, workspaceId }, input, { new: true });
}

export type ClosedReason = 'notPublished' | 'notYetOpen' | 'closed' | 'full';

export interface Availability {
  open: boolean;
  reason?: ClosedReason;

  message?: string;
}

const CLOSED_TEXT: Record<ClosedReason, string> = {
  notPublished: 'This form is not accepting responses yet',
  notYetOpen: 'This form is not open for responses yet',
  closed: 'This form is no longer accepting responses',
  full: 'This form has reached its response limit',
};

export async function availability(
  form: Pick<FormDocumentLike, '_id' | 'status' | 'schedule'>,
  now: Date = new Date()
): Promise<Availability> {
  const closed = (reason: ClosedReason): Availability => ({
    open: false,
    reason,
    message: form.schedule?.closedMessage || CLOSED_TEXT[reason],
  });

  if (form.status !== 'published') {

    return { open: false, reason: 'notPublished', message: CLOSED_TEXT.notPublished };
  }

  const schedule = form.schedule;
  if (!schedule) return { open: true };

  if (schedule.opensAt && now < schedule.opensAt) return closed('notYetOpen');
  if (schedule.closesAt && now >= schedule.closesAt) return closed('closed');

  if (schedule.maxSubmissions) {

    const count = await SubmissionModel.countDocuments({
      formId: form._id,
      status: 'complete',
    });
    if (count >= schedule.maxSubmissions) return closed('full');
  }

  return { open: true };
}

type FormDocumentLike = {
  _id: Types.ObjectId;
  status: 'draft' | 'published';
  schedule?: FormSchedule;
};

function stripBackgrounds(theme: FormTheme | undefined): FormTheme | undefined {
  if (!theme) return theme;
  const next: FormTheme = { ...theme };

  if (typeof next.pageBg === 'string' && next.pageBg.startsWith('http')) delete next.pageBg;
  if (next.pageBackground?.image) next.pageBackground = { ...next.pageBackground, image: undefined };
  if (next.cardBackground?.image) next.cardBackground = { ...next.cardBackground, image: undefined };
  return next;
}

export async function duplicateForm(id: string, workspaceId: string) {
  const source = await FormModel.findOne({ _id: id, workspaceId });
  if (!source) return null;

  const copy = source.toObject();
  delete (copy as { _id?: unknown })._id;
  delete (copy as { createdAt?: unknown }).createdAt;
  delete (copy as { updatedAt?: unknown }).updatedAt;
  delete (copy as { schedule?: unknown }).schedule;

  return FormModel.create({
    ...copy,

    theme: stripBackgrounds(copy.theme),
    name: `${source.name ?? source.title} (copy)`,
    status: 'draft',
    viewCount: 0,
  });
}

/* ------------------------- portable form config ---------------------------- */

/**
 * The envelope a copied form travels in.
 *
 * Versioned because the shape people paste may have been copied weeks ago
 * against an older build, and `kind` so a stray clipboard paste is rejected
 * with a sentence rather than a schema error.
 */
export const FORM_CONFIG_KIND = 'da-forms/form-config';
export const FORM_CONFIG_VERSION = 1;

export interface FormConfigEnvelope {
  kind: typeof FORM_CONFIG_KIND;
  version: number;
  exportedAt: string;
  form: Record<string, unknown>;
}

/**
 * Everything that travels with a copied form.
 *
 * Listed rather than derived by deletion, so a field added to the model later
 * is left out of an export until someone decides it should travel — the safer
 * default when the new field might be a secret or a workspace-bound id.
 */
const PORTABLE_FIELDS = [
  'name',
  'title',
  'description',
  'fields',
  'redirectUrl',
  'thankYouMessage',
  'hideHeader',
  'headerAlign',
  'labelPlacement',
  'submitLabel',
  'submitButtonSize',
  'submitButtonWidth',
  'submitButtonAlign',
  'theme',
  'steps',
  'stepIndicator',
  'showStepHeadings',
  'collectIp',
  'notifications',
  'requireCaptcha',
  'collectPartials',
  'allowEdit',
] as const;

/**
 * Uploaded images belong to the workspace that uploaded them.
 *
 * A pasted form pointing at the source workspace's upload would break the day
 * that form is deleted, and would leak an asset across a workspace boundary in
 * the meantime — so the reference is dropped and the colours are kept. Same
 * reasoning as `stripBackgrounds`, which the duplicate path uses for the
 * narrower same-workspace case.
 */
function stripUploadedImages(theme: FormTheme | undefined): FormTheme | undefined {
  if (!theme) return theme;
  const next: FormTheme = { ...theme };
  if (typeof next.pageBg === 'string' && next.pageBg.startsWith('http')) delete next.pageBg;
  if (next.pageBackground) {
    const { image: _image, ...rest } = next.pageBackground;
    next.pageBackground = rest;
  }
  if (next.cardBackground) {
    const { image: _image, ...rest } = next.cardBackground;
    next.cardBackground = rest;
  }
  return next;
}

/**
 * A payment field names the gateway it charges through, and the keys for that
 * gateway live in workspace settings. The provider is kept — the field is
 * useless without one and the target workspace may well have the same gateway
 * connected — but it is the importing workspace's own keys that will be used.
 */
export async function exportFormConfig(
  id: string,
  workspaceId: string
): Promise<FormConfigEnvelope | null> {
  const source = await FormModel.findOne({ _id: id, workspaceId });
  if (!source) return null;

  const doc = source.toObject() as unknown as Record<string, unknown>;
  const form: Record<string, unknown> = {};
  for (const key of PORTABLE_FIELDS) {
    if (doc[key] !== undefined) form[key] = doc[key];
  }
  form.theme = stripUploadedImages(doc.theme as FormTheme | undefined);
  if (form.theme === undefined) delete form.theme;

  return {
    kind: FORM_CONFIG_KIND,
    version: FORM_CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    form,
  };
}

export class InvalidFormConfigError extends Error {}

/**
 * Read a pasted envelope back into something `createForm` will accept.
 *
 * Anything outside `PORTABLE_FIELDS` is discarded rather than trusted: the
 * payload arrives from a clipboard, so it must be treated as input a person
 * can edit, not as a document this server wrote.
 */
export function parseFormConfig(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    throw new InvalidFormConfigError('That does not look like a form config.');
  }
  const envelope = payload as Partial<FormConfigEnvelope>;
  if (envelope.kind !== FORM_CONFIG_KIND) {
    throw new InvalidFormConfigError('That does not look like a form config.');
  }
  if (typeof envelope.version !== 'number' || envelope.version > FORM_CONFIG_VERSION) {
    throw new InvalidFormConfigError(
      'This config was copied from a newer version of the app.'
    );
  }
  const source = envelope.form;
  if (!source || typeof source !== 'object') {
    throw new InvalidFormConfigError('That config has no form in it.');
  }

  const form: Record<string, unknown> = {};
  for (const key of PORTABLE_FIELDS) {
    const value = (source as Record<string, unknown>)[key];
    if (value !== undefined) form[key] = value;
  }

  if (typeof form.title !== 'string' || !form.title.trim()) {
    throw new InvalidFormConfigError('That config has no form title.');
  }
  if (form.fields !== undefined && !Array.isArray(form.fields)) {
    throw new InvalidFormConfigError('That config has no usable fields.');
  }

  form.theme = stripUploadedImages(form.theme as FormTheme | undefined);
  if (form.theme === undefined) delete form.theme;

  return form;
}

/**
 * Create a form in `workspaceId` from a pasted config.
 *
 * Always a draft: a form arriving from elsewhere has not been reviewed against
 * this workspace's gateways or mailer, and publishing it on paste would put a
 * live, possibly uncharged checkout on the internet.
 */
export async function importFormConfig(payload: unknown, workspaceId: string) {
  const form = parseFormConfig(payload);
  // `parseFormConfig` has already established that the title is a non-empty
  // string; the name falls back to it when the config carried none.
  const title = form.title as string;
  const name = typeof form.name === 'string' && form.name.trim() ? form.name : title;

  return FormModel.create({
    ...form,
    title,
    name,
    workspaceId,
    status: 'draft',
    viewCount: 0,
  });
}

export async function deleteForm(id: string, workspaceId: string) {
  const form = await FormModel.findOne({ _id: id, workspaceId });
  if (!form) return null;

  await destroyUploadsForForm(form._id);
  await destroyFormBackground(form.get('theme'));

  await SubmissionModel.deleteMany({ formId: form._id });

  await FormViewModel.deleteMany({ formId: String(form._id) });

  await FormModel.deleteOne({ _id: form._id });
  return form;
}

export async function recordView(id: string, fingerprint: string) {
  try {
    await FormViewModel.create({ formId: id, fingerprint });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return; 
    throw err;
  }
  await FormModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
}

export function flattenFieldsPublic(fields: FormField[]): FormField[] {
  return flattenFields(fields);
}

function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

export async function savePartial(
  formId: string,
  partialKey: string,
  data: Record<string, string>,
  lastFieldId?: string,
  lastFieldIndex?: number,
  sourceUrl?: string
) {
  return SubmissionModel.findOneAndUpdate(
    { formId, partialKey, status: 'partial' },
    {
      $set: { data, lastFieldId, lastFieldIndex, sourceUrl },
      $setOnInsert: { formId, partialKey, status: 'partial' },
    },
    { upsert: true, new: true }
  );
}

async function promotePartial(
  formId: string,
  partialKey: string,
  data: Record<string, string>,
  sourceUrl?: string,
  payment?: SubmissionPayment,
  fileMeta?: Record<string, { bytes: number }>,
  quiz?: QuizScore
) {
  return SubmissionModel.findOneAndUpdate(
    { formId, partialKey, status: 'partial' },
    {
      $set: {
        data,
        fileMeta,
        sourceUrl,
        status: payment ? 'pending_payment' : 'complete',
        ...(payment ? { payment } : {}),
        ...(quiz ? { quiz } : {}),

        lastFieldId: undefined,
        lastFieldIndex: undefined,
      },
    },
    { new: true }
  );
}

export async function sweepAbandonedPartials(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const stale = await SubmissionModel.find(
    { status: 'partial', updatedAt: { $lt: cutoff } },
    { _id: 1 }
  );
  if (!stale.length) return 0;

  const ids = stale.map((row) => row._id);
  await destroyUploadsForSubmissions(ids);
  const { deletedCount } = await SubmissionModel.deleteMany({ _id: { $in: ids } });
  return deletedCount ?? 0;
}

export function getPartialById(id: string) {
  return SubmissionModel.findOne({ _id: id, status: 'partial' });
}

export function getPartialByKey(formId: string, partialKey: string) {
  return SubmissionModel.findOne({ formId, partialKey, status: 'partial' });
}

export interface DropOffEntry {
  fieldId: string;

  index: number;

  abandoned: number;
}

export async function dropOffBreakdown(formId: string): Promise<DropOffEntry[]> {
  const rows = await SubmissionModel.aggregate<{
    _id: { fieldId: string; index: number };
    abandoned: number;
  }>([
    { $match: { formId: new Types.ObjectId(formId), status: 'partial', lastFieldId: { $ne: null } } },
    {
      $group: {
        _id: { fieldId: '$lastFieldId', index: '$lastFieldIndex' },
        abandoned: { $sum: 1 },
      },
    },
    { $sort: { abandoned: -1 } },
  ]);

  return rows.map((row) => ({
    fieldId: row._id.fieldId,
    index: row._id.index ?? 0,
    abandoned: row.abandoned,
  }));
}

export function applyCalculatedFields(
  fields: FormField[],
  data: Record<string, string>
): void {
  const all = flattenFields(fields);
  const calculated = all.filter((f) => f.type === 'calculated' && f.formula);
  if (!calculated.length) return;

  const optionValues: Record<string, Record<string, number>> = {};
  for (const field of all) {
    if (field.optionValues) optionValues[field.id] = field.optionValues;
  }

  const values = numericValues(all, data, optionValues);

  for (const field of calculated) {
    const result = evaluateFormula(field.formula!, values);

    if (!result.ok) continue;

    const precision = field.formulaPrecision ?? (field.formulaFormat === 'currency' ? 2 : 0);
    data[field.id] = result.value.toFixed(precision);

    if (field.label?.trim()) values.set(field.label.trim(), result.value);
  }
}

export interface QuizScore {

  score: number;

  total: number;

  correct: number;

  questions: number;
}

export function scoreSubmission(
  fields: FormField[],
  data: Record<string, string>
): QuizScore | undefined {
  const scored = flattenFields(fields).filter((f) => f.correctOptions?.length);
  if (!scored.length) return undefined;

  let score = 0;
  let total = 0;
  let correct = 0;

  for (const field of scored) {
    const worth = field.optionValues
      ? Math.max(...Object.values(field.optionValues), 1)
      : 1;
    total += worth;

    const answer = data[field.id];
    if (!answer) continue;

    const chosen = String(answer).split(',').map((s) => s.trim()).filter(Boolean);
    const key = field.correctOptions!;
    const right =
      chosen.length === key.length && chosen.every((option) => key.includes(option));

    if (right) {
      correct++;
      score += field.optionValues
        ? chosen.reduce((sum, option) => sum + (field.optionValues![option] ?? 0), 0) || worth
        : worth;
    }
  }

  return { score, total, correct, questions: scored.length };
}

export class DuplicateValueError extends Error {
  constructor(public field: FormField) {
    super(`${field.label || 'This field'} must be unique`);
  }
}

export async function submitForm(
  formId: string,
  fields: FormField[],
  data: Record<string, string>,
  sourceUrl?: string,
  payment?: SubmissionPayment,
  fileMeta?: Record<string, { bytes: number }>,

  partialKey?: string
) {

  applyCalculatedFields(fields, data);

  const uniqueFields = flattenFields(fields).filter((field) => field.unique);
  for (const field of uniqueFields) {
    const value = data[field.id];
    if (!value) continue;

    const existing = await SubmissionModel.exists({
      formId,
      status: 'complete',
      [`data.${field.id}`]: value,
    });
    if (existing) throw new DuplicateValueError(field);
  }

  const quiz = scoreSubmission(fields, data);

  const submission =
    (partialKey
      ? await promotePartial(formId, partialKey, data, sourceUrl, payment, fileMeta, quiz)
      : null) ??
    (await SubmissionModel.create({
      formId,
      data,
      fileMeta,
      sourceUrl,
      status: payment ? 'pending_payment' : 'complete',
      payment,
      quiz,
    }));

  await claimUploads(submission._id, data);

  return submission;
}

export function attachOrderId(submissionId: Types.ObjectId, orderId: string) {
  return SubmissionModel.updateOne({ _id: submissionId }, { 'payment.orderId': orderId });
}

export async function markSubmissionPaid(
  orderId: string,
  paymentId: string,
  payer: { payerEmail?: string; payerContact?: string; method?: string } = {}
) {
  return SubmissionModel.findOneAndUpdate(
    { 'payment.orderId': orderId, 'payment.status': { $ne: 'paid' } },
    {
      status: 'complete',
      'payment.status': 'paid',
      'payment.paymentId': paymentId,
      'payment.paidAt': new Date(),

      'payment.payerEmail': payer.payerEmail,
      'payment.payerContact': payer.payerContact,
      'payment.method': payer.method,
    },
    { new: true }
  );
}

export async function markSubmissionFailed(orderId: string) {
  return SubmissionModel.findOneAndUpdate(
    { 'payment.orderId': orderId, 'payment.status': 'created' },
    { 'payment.status': 'failed' },
    { new: true }
  );
}

export async function discardPendingSubmission(orderId: string) {
  const submission = await SubmissionModel.findOne({
    'payment.orderId': orderId,
    status: 'pending_payment',
  });
  if (!submission) return null;

  await SubmissionModel.deleteOne({ _id: submission._id });
  return submission;
}

export function getSubmissionByOrderId(orderId: string) {
  return SubmissionModel.findOne({ 'payment.orderId': orderId });
}

export async function sweepAbandonedPayments(graceMinutes: number) {
  const cutoff = new Date(Date.now() - graceMinutes * 60_000);
  const stale = await SubmissionModel.find(
    { status: 'pending_payment', createdAt: { $lt: cutoff } },
    { _id: 1 }
  );
  if (!stale.length) return { deleted: 0 };

  const ids = stale.map((s) => s._id);
  await destroyUploadsForSubmissions(ids);
  const result = await SubmissionModel.deleteMany({ _id: { $in: ids } });
  return { deleted: result.deletedCount ?? 0 };
}

export function submissionCount(formId: string) {
  return SubmissionModel.countDocuments({ formId, status: 'complete' });
}

/**
 * Complete responses per UTC day for the last `days` days, oldest first, with
 * empty days filled in as zero — the responses card draws its trend from this.
 */
export async function dailySubmissions(formId: string, days = 14) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const rows = await SubmissionModel.aggregate<{ _id: string; count: number }>([
    { $match: { formId: new Types.ObjectId(formId), status: 'complete', createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.count]));

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    return { date, count: byDay.get(date) ?? 0 };
  });
}

export interface UploadedFile {
  url: string;

  fieldLabel: string;

  submissionId: string;
  submittedAt: Date;
}

export async function uploadedFiles(
  formId: string,
  fields: FormField[]
): Promise<UploadedFile[]> {
  const uploadFieldIds = new Map(
    flattenFields(fields)
      .filter((f) => f.type === 'file' || f.type === 'imageUpload' || f.type === 'mediaUpload')
      .map((f) => [f.id, f.label || 'Untitled question'])
  );
  if (!uploadFieldIds.size) return [];

  const submissions = await SubmissionModel.find(
    { formId, status: 'complete' },
    { data: 1, createdAt: 1 }
  ).sort({ createdAt: -1 });

  const files: UploadedFile[] = [];
  for (const submission of submissions) {
    for (const [fieldId, label] of uploadFieldIds) {
      const value = submission.data?.[fieldId];

      if (typeof value !== 'string' || !value.startsWith('http')) continue;
      files.push({
        url: value,
        fieldLabel: label,
        submissionId: String(submission._id),
        submittedAt: submission.createdAt,
      });
    }
  }
  return files;
}

export interface SourceBreakdownEntry {

  source: string;
  count: number;
}

export async function sourceBreakdown(formId: string): Promise<SourceBreakdownEntry[]> {
  const submissions = await SubmissionModel.find({ formId, status: 'complete' }, { sourceUrl: 1 });
  const counts = new Map<string, number>();
  for (const submission of submissions) {
    let source = 'Direct';
    if (submission.sourceUrl) {
      try {
        source = new URL(submission.sourceUrl).hostname;
      } catch {

        source = 'Other';
      }
    }
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export async function listSubmissions(
  formId: string,
  options: {
    page?: number;
    limit?: number;
    status?: 'all' | 'read' | 'unread' | 'starred';
    from?: string;
    to?: string;

    q?: string;

    fieldFilters?: Record<string, string>;

    currentFieldIds?: string[];
  } = {}
): Promise<Paginated<InstanceType<typeof SubmissionModel>> & { retiredColumns: RetiredColumn[] }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);

  const filter: Record<string, unknown> = { formId, status: 'complete' };

  if (options.status === 'read') filter.read = true;
  else if (options.status === 'unread') filter.read = false;
  else if (options.status === 'starred') filter.starred = true;

  if (options.q?.trim()) {
    const needle = options.q.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$expr = {
      $regexMatch: {
        input: { $reduce: {
          input: { $objectToArray: '$data' },
          initialValue: '',
          in: { $concat: ['$$value', ' ', { $toString: '$$this.v' }] },
        } },
        regex: needle,
        options: 'i',
      },
    };
  }

  for (const [fieldId, value] of Object.entries(options.fieldFilters ?? {})) {
    if (!value) continue;
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(fieldId)) continue;
    filter[`data.${fieldId}`] = value;
  }

  if (options.from || options.to) {
    const createdAt: Record<string, Date> = {};
    if (options.from) createdAt.$gte = new Date(options.from);
    if (options.to) createdAt.$lte = new Date(options.to);
    filter.createdAt = createdAt;
  }

  const [items, total, retiredColumns] = await Promise.all([
    SubmissionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SubmissionModel.countDocuments(filter),

    page === 1 ? retiredColumnsFor(formId, options.currentFieldIds ?? []) : Promise.resolve([]),
  ]);

  return { items, total, page, limit, retiredColumns };
}

export async function retiredColumnsFor(
  formId: string,
  currentFieldIds: string[]
): Promise<RetiredColumn[]> {
  const known = new Set(currentFieldIds);

  const rows = await SubmissionModel.aggregate<{ _id: string }>([
    { $match: { formId: new Types.ObjectId(formId), status: 'complete' } },
    { $project: { keys: { $objectToArray: '$data' } } },
    { $unwind: '$keys' },
    { $group: { _id: '$keys.k' } },
    { $limit: 200 },
  ]);

  return rows
    .map((r) => r._id)
    .filter((id) => id && !known.has(id))
    .map((id) => ({ id, label: id }));
}

export function getSubmissionById(id: string) {
  return SubmissionModel.findById(id);
}

export function updateSubmission(
  id: string,
  formId: string,
  patch: Partial<{ read: boolean; starred: boolean }>
) {
  return SubmissionModel.findOneAndUpdate({ _id: id, formId }, patch, { new: true });
}

export async function editSubmission(
  id: string,
  fields: FormField[],
  data: Record<string, string>,
  fileMeta?: Record<string, { bytes: number }>
) {
  const target = await SubmissionModel.findById(id, { formId: 1 });
  if (!target) return null;

  applyCalculatedFields(fields, data);

  const uniqueFields = flattenFields(fields).filter((field) => field.unique);
  for (const field of uniqueFields) {
    const value = data[field.id];
    if (!value) continue;

    const existing = await SubmissionModel.exists({
      _id: { $ne: id },
      formId: target.formId,
      status: 'complete',
      [`data.${field.id}`]: value,
    });
    if (existing) throw new DuplicateValueError(field);
  }

  const quiz = scoreSubmission(fields, data);

  const updated = await SubmissionModel.findOneAndUpdate(
    { _id: id, status: 'complete' },
    { $set: { data, fileMeta, read: false, ...(quiz ? { quiz } : {}) } },
    { new: true }
  );

  if (updated) await claimUploads(updated._id, data);
  return updated;
}

export async function bulkUpdateSubmissions(
  ids: string[],
  formId: string,
  patch: Partial<{ read: boolean; starred: boolean }>
) {
  const result = await SubmissionModel.updateMany({ _id: { $in: ids }, formId }, patch);
  return { matchedCount: result.matchedCount ?? 0 };
}

export async function deleteSubmission(id: string, formId: string) {
  const submission = await SubmissionModel.findOne({ _id: id, formId });
  if (!submission) return null;

  await destroyUploadsForSubmissions([submission._id]);
  await SubmissionModel.deleteOne({ _id: submission._id });
  return submission;
}

export async function bulkDeleteSubmissions(ids: string[], formId: string) {
  const submissions = await SubmissionModel.find({ _id: { $in: ids }, formId }, { _id: 1 });
  const matchedIds = submissions.map((s) => s._id);
  if (matchedIds.length === 0) return { deletedCount: 0 };

  await destroyUploadsForSubmissions(matchedIds);
  const result = await SubmissionModel.deleteMany({ _id: { $in: matchedIds } });
  return { deletedCount: result.deletedCount ?? matchedIds.length };
}
