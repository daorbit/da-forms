// A value, not just a type: `dropOffBreakdown` casts a string id for its
// aggregation, which the query builder does not do on its own.
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
  FormSchedule,
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
    requireCaptcha: boolean;
    collectPartials: boolean;
    allowEdit: boolean;
    schedule: FormSchedule;
  }>
) {
  return FormModel.findOneAndUpdate({ _id: id, workspaceId }, input, { new: true });
}

/* ------------------------------ availability ------------------------------ */

/**
 * Why a form is not taking answers, or null when it is.
 *
 * `notYetOpen` and `closed` are told apart because they need different words in
 * front of a respondent: one is "come back later", the other is "you missed
 * it", and showing the wrong one wastes the visit either way.
 */
export type ClosedReason = 'notPublished' | 'notYetOpen' | 'closed' | 'full';

export interface Availability {
  open: boolean;
  reason?: ClosedReason;
  /** The owner's own wording, when they set one. */
  message?: string;
}

/** What a respondent is told when the owner has not written their own message. */
const CLOSED_TEXT: Record<ClosedReason, string> = {
  notPublished: 'This form is not accepting responses yet',
  notYetOpen: 'This form is not open for responses yet',
  closed: 'This form is no longer accepting responses',
  full: 'This form has reached its response limit',
};

/**
 * Whether a form is currently accepting answers.
 *
 * The single source of truth for that question: the public page asks it to
 * decide what to render, and the submit route asks it again to decide what to
 * accept. Two implementations would eventually disagree, and the one that
 * disagreed in the respondent's favour would be a closed form still taking
 * responses.
 *
 * Counting is left until last because it costs a query, and a form closed by
 * date needs no count to know it is shut.
 */
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
    // Deliberately not the owner's `closedMessage`: an unpublished form is a
    // draft nobody was invited to, not a window that has shut.
    return { open: false, reason: 'notPublished', message: CLOSED_TEXT.notPublished };
  }

  const schedule = form.schedule;
  if (!schedule) return { open: true };

  if (schedule.opensAt && now < schedule.opensAt) return closed('notYetOpen');
  if (schedule.closesAt && now >= schedule.closesAt) return closed('closed');

  if (schedule.maxSubmissions) {
    // 'complete' only, matching every other place responses are counted: a
    // checkout someone abandoned has not taken one of the seats.
    const count = await SubmissionModel.countDocuments({
      formId: form._id,
      status: 'complete',
    });
    if (count >= schedule.maxSubmissions) return closed('full');
  }

  return { open: true };
}

/** The parts of a form `availability` reads. Keeps it callable with a lean projection. */
type FormDocumentLike = {
  _id: Types.ObjectId;
  status: 'draft' | 'published';
  schedule?: FormSchedule;
};

/**
 * Copy a form, without its responses.
 *
 * A duplicate is a starting point, so it comes back as a draft no matter what
 * the original was: publishing is a deliberate act, and a copy that went live
 * the moment it was made would put an unreviewed form on the original's
 * audience.
 *
 * Responses, view counts and the schedule are all left behind for the same
 * reason — they describe the original's run, and carrying them over would mean
 * a brand-new form that reports other people's answers and may already be
 * "full".
 */
/**
 * A theme with its uploaded images removed, colours and everything else kept.
 *
 * Mirrors the URLs `destroyFormBackground` looks for — if a new background slot
 * is added there, it belongs here too, or a duplicate starts sharing a file
 * again.
 */
function stripBackgrounds(theme: FormTheme | undefined): FormTheme | undefined {
  if (!theme) return theme;
  const next: FormTheme = { ...theme };
  // A gradient or a plain colour is a string with no file behind it; only an
  // uploaded image is shared storage.
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
    // Background images are dropped rather than shared.
    //
    // `destroyFormBackground` deletes by URL with no notion of which form owns
    // the file, so two forms pointing at one image means deleting either takes
    // the other's background with it. Re-uploading the file for the copy would
    // avoid that, but a duplicate is usually about to be edited anyway — the
    // cost of losing a background someone re-picks in a click is far below the
    // cost of a form silently losing its design when an unrelated one is
    // deleted.
    theme: stripBackgrounds(copy.theme),
    name: `${source.name ?? source.title} (copy)`,
    status: 'draft',
    viewCount: 0,
  });
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

/**
 * Every field in document order, grids included.
 *
 * Exported as well, for callers that need to check an id against the form's
 * real fields before it reaches a query.
 */
export function flattenFieldsPublic(fields: FormField[]): FormField[] {
  return flattenFields(fields);
}

/** Every field in document order, grids included — mirrors the frontend's `flattenFields`. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

/* --------------------------- partial submissions --------------------------- */

/**
 * Record what someone has typed so far.
 *
 * Upserted against `(formId, partialKey)` rather than inserted, so a form
 * autosaving every few seconds leaves one row per attempt instead of one per
 * keystroke. The unique index is what enforces that under a race; this query
 * merely expresses the intent.
 *
 * Never touches a row that is not `partial`. Someone whose submission has
 * already completed may still have a tab open firing one last autosave, and
 * without that guard it would overwrite the real response with a half-filled
 * copy of itself.
 */
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

/**
 * Turn this attempt's partial row into the real submission, if one exists.
 *
 * Promotion in place rather than insert-then-delete: the row already holds the
 * uploads this attempt claimed, and a new row would strand them. It also means
 * a respondent who finishes leaves exactly one row behind, which is what stops
 * "started" and "completed" from double-counting the same person.
 *
 * Returns null when there is nothing to promote — a form with autosave off, or
 * a submit that arrived before the first save.
 */
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
        // The drop-off point described where they stopped. They did not stop.
        lastFieldId: undefined,
        lastFieldIndex: undefined,
      },
    },
    { new: true }
  );
}

/**
 * Delete partials nobody came back to finish.
 *
 * These are the rows with the weakest claim to exist — text someone typed and
 * chose not to send — so they are kept only as long as the drop-off report
 * needs them and then removed. Aged by `updatedAt`, so a respondent who left a
 * tab open for a week is measured from when they last typed, not when they
 * arrived.
 *
 * Uploads go with them: a file attached to an abandoned attempt is exactly the
 * orphan the media sweep exists to prevent.
 */
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

/**
 * The draft behind a resume link.
 *
 * Restricted to 'partial' on purpose: a link emailed while someone was halfway
 * through must stop working once they finish, or it would reopen a submitted
 * response as an editable draft and let them fork it into a second one.
 */
export function getPartialById(id: string) {
  return SubmissionModel.findOne({ _id: id, status: 'partial' });
}

/** This attempt's draft row, by the key the browser has been autosaving under. */
export function getPartialByKey(formId: string, partialKey: string) {
  return SubmissionModel.findOne({ formId, partialKey, status: 'partial' });
}

export interface DropOffEntry {
  fieldId: string;
  /** Where this field sits in document order, as recorded when the row was written. */
  index: number;
  /** How many people stopped here without sending. */
  abandoned: number;
}

/**
 * Where a form loses people, worst first.
 *
 * Only answers anything for forms with autosave on — without partial rows there
 * is no record of where anyone stopped, and the honest answer is an empty list
 * rather than a guess derived from view counts.
 */
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

/**
 * Fill in every calculated field from the answers around it.
 *
 * Recomputed here rather than taken from the submitted body, for the same
 * reason a payment amount is derived from the stored form: the browser's copy
 * is a display convenience, and a respondent who edits the request must not be
 * able to name their own total. A form whose calculated field feeds a payment
 * would otherwise be a price the customer sets.
 *
 * Mutates the answers in place so everything downstream — storage, the emailed
 * receipt, the CSV — sees one set of numbers rather than each recomputing.
 */
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
    // A formula that does not compile stores nothing rather than an error
    // string: the answers are what the owner reads, and "unexpected symbol"
    // sitting in a totals column is worse than a blank the author can spot.
    if (!result.ok) continue;

    const precision = field.formulaPrecision ?? (field.formulaFormat === 'currency' ? 2 : 0);
    data[field.id] = result.value.toFixed(precision);

    // Available to any formula that references this one, so a subtotal can feed
    // a total. Order matters and is document order — a field referring to one
    // below it reads the value from before this pass, which is zero.
    if (field.label?.trim()) values.set(field.label.trim(), result.value);
  }
}

export interface QuizScore {
  /** Marks earned. */
  score: number;
  /** Marks available — the sum of each scored question's best possible answer. */
  total: number;
  /** How many scored questions were answered correctly. */
  correct: number;
  /** How many questions carried marks at all. */
  questions: number;
}

/**
 * Mark a submission against the form's answer key.
 *
 * A question counts toward the total when it has `correctOptions` — that is
 * what makes it a question rather than a field. Its worth is the highest
 * `optionValues` entry it has, defaulting to one mark, so a form can mix
 * one-mark questions with weighted ones without declaring a scheme.
 *
 * Marked server-side and stored, not recomputed on read: an owner who fixes a
 * typo in the answer key afterwards has not thereby changed what a respondent
 * scored on the day.
 */
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

    // Checkboxes submit several options; every selected one must be in the key
    // and every key option must be selected. A partially-right multi-answer is
    // wrong rather than half-right — awarding partial credit is a scheme the
    // author has not been asked to choose.
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
  /** This attempt's autosave row, promoted in place rather than duplicated. */
  partialKey?: string
) {
  // Before anything reads the answers: a calculated field is one of them, and
  // the uniqueness check below, the stored row, the emailed receipt and the CSV
  // must all see the same number.
  applyCalculatedFields(fields, data);

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

  const quiz = scoreSubmission(fields, data);
  // Promotion first, insert as the fallback: a form with autosave on already
  // has this attempt's row, and creating a second one would leave the abandoned
  // half of the same visit sitting next to the finished response.
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

export interface UploadedFile {
  url: string;
  /** Which question it answered, for naming the file on disk. */
  fieldLabel: string;
  /** Which response it came from, so two people's CVs do not collide. */
  submissionId: string;
  submittedAt: Date;
}

/**
 * Every file uploaded to a form, newest response first.
 *
 * A manifest rather than a zip. Building the archive here would mean pulling
 * every file back out of Cloudinary through this process and holding it in
 * memory — on a serverless function with a fixed timeout and a fixed memory
 * budget, which a form collecting three hundred CVs would exhaust. The browser
 * fetches from Cloudinary directly instead, which is where the files already
 * are and what its CDN is for.
 *
 * Reads from the answers rather than the upload rows because only the answers
 * know which question a file belonged to — the upload row has the id, not the
 * label.
 */
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
      // An unanswered upload field is absent; anything not a URL is a stale
      // answer from before the field became an upload.
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
    /** Free text, matched across every answer. */
    q?: string;
    /** Exact-match filters, keyed by field id — "everyone who picked Large". */
    fieldFilters?: Record<string, string>;
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

  /*
   * Free-text search across the answers.
   *
   * `$regex` over `data` as a whole is not possible — the field ids differ per
   * form — so this matches the serialised object with `$where`-free operators
   * by way of an aggregation-free trick: Mongo can regex a Mixed subdocument's
   * values only via `$expr`, so the search is done over the stringified
   * document. Restricted to a bounded, escaped needle: the input is a
   * respondent-visible box, and an unescaped one both breaks on a stray `(` and
   * hands the server a regex someone else wrote.
   */
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

  // Exact match on one field's stored answer. Keyed by field id, which comes
  // from the form the caller already loaded — not free text, so it cannot name
  // a path outside `data`.
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

  const [items, total] = await Promise.all([
    SubmissionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SubmissionModel.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

/** One response by id, however it is reached — currently only an edit link. */
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

/**
 * Replace a respondent's own answers, from a signed edit link.
 *
 * Restricted to 'complete' rows: a checkout still in flight has an amount
 * derived from the answers it was created with, and letting those answers move
 * underneath it would mean a respondent editing their way to a different price
 * than the one Razorpay is holding.
 *
 * Marked unread again, because from the owner's side this is new information
 * about a response they may have already read and acted on.
 */
export async function editSubmission(
  id: string,
  fields: FormField[],
  data: Record<string, string>,
  fileMeta?: Record<string, { bytes: number }>
) {
  const target = await SubmissionModel.findById(id, { formId: 1 });
  if (!target) return null;

  // The same derivation the original submit did. A respondent who changes the
  // quantity has changed the total, and leaving the old one would store a row
  // whose own numbers disagree.
  applyCalculatedFields(fields, data);

  const uniqueFields = flattenFields(fields).filter((field) => field.unique);
  for (const field of uniqueFields) {
    const value = data[field.id];
    if (!value) continue;
    // `$ne: id` is what makes an edit that leaves a unique field alone still
    // valid — without it the row would collide with itself and no edit could
    // ever be saved.
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

/** Same as `updateSubmission`, for a batch of ids — scoped to `formId` the
 *  same way, so an id that isn't this form's is silently skipped rather than
 *  failing the whole batch. */
export async function bulkUpdateSubmissions(
  ids: string[],
  formId: string,
  patch: Partial<{ read: boolean; starred: boolean }>
) {
  const result = await SubmissionModel.updateMany({ _id: { $in: ids }, formId }, patch);
  return { matchedCount: result.matchedCount ?? 0 };
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

/**
 * Same as `deleteSubmission`, for a batch of ids at once.
 *
 * Scoped to `formId` the same way — every id is matched against `{ _id, formId }`
 * before deletion, so a client can't smuggle in another form's submission id
 * and have it deleted through this form's route. Ids that don't match (already
 * deleted, or not this form's) are silently skipped rather than failing the
 * whole batch — the caller only sent ids it believed were still there.
 */
export async function bulkDeleteSubmissions(ids: string[], formId: string) {
  const submissions = await SubmissionModel.find({ _id: { $in: ids }, formId }, { _id: 1 });
  const matchedIds = submissions.map((s) => s._id);
  if (matchedIds.length === 0) return { deletedCount: 0 };

  await destroyUploadsForSubmissions(matchedIds);
  const result = await SubmissionModel.deleteMany({ _id: { $in: matchedIds } });
  return { deletedCount: result.deletedCount ?? matchedIds.length };
}
