import type { Types } from 'mongoose';
import { FormModel } from '../models/form.model.js';
import { SubmissionModel, type SubmissionPayment } from '../models/submission.model.js';
import { FormViewModel } from '../models/formView.model.js';
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
} from '../models/form.model.js';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
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

export interface FormListResult extends Paginated<InstanceType<typeof FormModel>> {
  /** Workspace-wide, unaffected by the current search/page — the stat tiles above the list. */
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
  // Filtered server-side rather than in the page component: the list is paged,
  // so filtering the current page would hide matches sitting on later ones.
  if (options.status) filter.status = options.status;
  const sort = sortMap[options.sort ?? 'date'];

  const [items, total, allForms] = await Promise.all([
    FormModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    FormModel.countDocuments(filter),
    // Unfiltered — the stat tiles reflect the whole workspace, not the
    // current search, so this cannot reuse the `filter` query above.
    FormModel.find({ workspaceId }, { status: 1, viewCount: 1 }),
  ]);

  const formIds = allForms.map((f) => f._id);
  const [totalSubmissions, publishedForms] = await Promise.all([
    formIds.length
      ? SubmissionModel.countDocuments({ formId: { $in: formIds }, status: 'complete' })
      : 0,
    allForms.filter((f) => f.status === 'published').length,
  ]);

  return {
    items,
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

/** How many forms a workspace holds — what the plan's form cap is counted against. */
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
  }>
) {
  return FormModel.findOneAndUpdate({ _id: id, workspaceId }, input, { new: true });
}

/**
 * Delete a form and everything that only existed because of it.
 *
 * A form's responses are meaningless without it and its uploaded files cost
 * storage forever, so they go together — leaving them behind is not "keeping
 * data safe", it is an orphaned collection nobody can reach through the UI and
 * a Cloudinary bill for files no form references.
 *
 * Ordered so nothing is stranded if this fails partway: the files go first
 * (their rows still name them), then the rows, then the form. The reverse order
 * would delete the form and lose the only handle on the rest.
 */
export async function deleteForm(id: string, workspaceId: string) {
  const form = await FormModel.findOne({ _id: id, workspaceId });
  if (!form) return null;

  await destroyUploadsForForm(form._id);
  await destroyFormBackground(form.get('theme'));

  await SubmissionModel.deleteMany({ formId: form._id });
  // FormView stores the id as a string, unlike Submission's ObjectId ref.
  await FormViewModel.deleteMany({ formId: String(form._id) });

  await FormModel.deleteOne({ _id: form._id });
  return form;
}

/**
 * Counts a view once per (form, fingerprint) per dedup window — a page
 * reload or the same visitor reopening the link minutes later shouldn't
 * inflate the count. The unique index on FormView is what enforces this:
 * a duplicate insert fails instead of racing a read-then-write check.
 */
export async function recordView(id: string, fingerprint: string) {
  try {
    await FormViewModel.create({ formId: id, fingerprint });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return; // already counted this window
    throw err;
  }
  await FormModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
}

/** Every field in document order, grids included — mirrors the frontend's `flattenFields`. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
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
  payment?: SubmissionPayment
) {
  const uniqueFields = flattenFields(fields).filter((field) => field.unique);
  for (const field of uniqueFields) {
    const value = data[field.id];
    if (!value) continue;
    // Abandoned checkouts must not reserve a value. Someone who opened
    // Razorpay and closed the tab has not used that email address, and
    // blocking their retry would make the field impossible to submit.
    const existing = await SubmissionModel.exists({
      formId,
      status: 'complete',
      [`data.${field.id}`]: value,
    });
    if (existing) throw new DuplicateValueError(field);
  }
  const submission = await SubmissionModel.create({
    formId,
    data,
    sourceUrl,
    status: payment ? 'pending_payment' : 'complete',
    payment,
  });

  // Attach whatever this answer uploaded, so the abandoned-upload sweep stops
  // considering those files fair game. Done after the insert because the claim
  // needs the submission's id.
  await claimUploads(submission._id, data);

  return submission;
}

/**
 * Write the real Razorpay order id onto a submission.
 *
 * Separate from the insert because Razorpay's receipt is the submission's own
 * id, so the row has to exist before the order can be opened.
 */
export function attachOrderId(submissionId: Types.ObjectId, orderId: string) {
  return SubmissionModel.updateOne({ _id: submissionId }, { 'payment.orderId': orderId });
}

/**
 * Promote a paid submission to a real response.
 *
 * The filter is what makes this safe to call twice: Razorpay retries webhooks,
 * and matching only rows that are not yet paid means a duplicate delivery
 * updates nothing and returns null. The caller reads that as "already handled"
 * and skips the notification emails, so a respondent is never thanked twice for
 * one payment.
 */
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
      // Undefined keys are dropped by Mongoose rather than written as null,
      // so a payment without an email simply leaves the field unset.
      'payment.payerEmail': payer.payerEmail,
      'payment.payerContact': payer.payerContact,
      'payment.method': payer.method,
    },
    { new: true }
  );
}

/** Records a failed attempt. The row stays pending so the sweep can clear it later. */
export async function markSubmissionFailed(orderId: string) {
  return SubmissionModel.findOneAndUpdate(
    { 'payment.orderId': orderId, 'payment.status': 'created' },
    { 'payment.status': 'failed' },
    { new: true }
  );
}

/**
 * Drop an abandoned checkout the respondent is now retrying.
 *
 * Guarded on 'pending_payment' so a paid submission can never be removed this
 * way — the order id arrives from the browser, and a client asking to delete a
 * completed response must get nothing.
 */
export async function discardPendingSubmission(orderId: string) {
  const submission = await SubmissionModel.findOne({
    'payment.orderId': orderId,
    status: 'pending_payment',
  });
  if (!submission) return null;

  // The uploads stay: the retry reuses the same URLs, so destroying them here
  // would leave the new submission pointing at files that no longer exist.
  await SubmissionModel.deleteOne({ _id: submission._id });
  return submission;
}

/** A submission by its Razorpay order id — how the post-checkout poll finds its status. */
export function getSubmissionByOrderId(orderId: string) {
  return SubmissionModel.findOne({ 'payment.orderId': orderId });
}

/**
 * Delete checkouts that were never completed.
 *
 * Mirrors the abandoned-upload sweep: a respondent who opens Razorpay and walks
 * away leaves a row that will never become a response, and its uploaded files
 * are storage nothing can reach. Only rows past the grace period are touched,
 * so a payment still in progress is never pulled out from under someone.
 */
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

export interface SourceBreakdownEntry {
  /** The referring page's hostname, or 'direct' when no referrer was sent. */
  source: string;
  count: number;
}

/** Submissions grouped by referrer hostname, most common first. */
export async function sourceBreakdown(formId: string): Promise<SourceBreakdownEntry[]> {
  const submissions = await SubmissionModel.find({ formId, status: 'complete' }, { sourceUrl: 1 });
  const counts = new Map<string, number>();
  for (const submission of submissions) {
    let source = 'Direct';
    if (submission.sourceUrl) {
      try {
        source = new URL(submission.sourceUrl).hostname;
      } catch {
        // Malformed referrer header — count it rather than drop the submission from the breakdown.
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
  } = {}
): Promise<Paginated<InstanceType<typeof SubmissionModel>>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  // Checkouts still in progress are not responses — they never appear on the
  // Entries page, whichever status filter is applied.
  const filter: Record<string, unknown> = { formId, status: 'complete' };

  if (options.status === 'read') filter.read = true;
  else if (options.status === 'unread') filter.read = false;
  else if (options.status === 'starred') filter.starred = true;

  if (options.from || options.to) {
    const createdAt: Record<string, Date> = {};
    if (options.from) createdAt.$gte = new Date(options.from);
    if (options.to) createdAt.$lte = new Date(options.to);
    filter.createdAt = createdAt;
  }

  const [items, total] = await Promise.all([
    SubmissionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SubmissionModel.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export function updateSubmission(
  id: string,
  formId: string,
  patch: Partial<{ read: boolean; starred: boolean }>
) {
  return SubmissionModel.findOneAndUpdate({ _id: id, formId }, patch, { new: true });
}

/**
 * Delete one response, and the files it uploaded along with it.
 *
 * Same reasoning as deleting a form: the files existed only to be part of this
 * answer, so keeping them past it is storage nothing can reach.
 */
export async function deleteSubmission(id: string, formId: string) {
  const submission = await SubmissionModel.findOne({ _id: id, formId });
  if (!submission) return null;

  await destroyUploadsForSubmissions([submission._id]);
  await SubmissionModel.deleteOne({ _id: submission._id });
  return submission;
}
