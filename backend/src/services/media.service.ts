import { Types } from 'mongoose';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { UploadModel, type UploadDocument } from '../models/upload.model.js';

/**
 * Everything that removes bytes from Cloudinary lives here.
 *
 * Deleting a stored file is the one operation in this service that cannot be
 * undone by re-running anything, so it has exactly one implementation rather
 * than a copy in each caller that might drift.
 */

/** Record a freshly uploaded file so it can be found again — to claim, or to sweep. */
export async function recordUpload(input: {
  publicId: string;
  resourceType: UploadDocument['resourceType'];
  url: string;
  formId?: string | null;
  workspaceId?: string;
}) {
  return UploadModel.create({
    publicId: input.publicId,
    resourceType: input.resourceType,
    url: input.url,
    formId: input.formId ? new Types.ObjectId(input.formId) : null,
    workspaceId: input.workspaceId,
    submissionId: null,
  });
}

/**
 * Delete these files from Cloudinary and drop their rows.
 *
 * Failures are logged and swallowed per file: a file already gone (someone
 * deleted it in the Cloudinary console, a retry of the same sweep) must not
 * abort the rest of the batch, and the row should go either way — a row
 * pointing at nothing is worse than no row.
 */
export async function destroyUploads(uploads: UploadDocument[]): Promise<number> {
  let destroyed = 0;

  for (const upload of uploads) {
    try {
      await cloudinary.uploader.destroy(upload.publicId, {
        resource_type: upload.resourceType,
        invalidate: true,
      });
      destroyed += 1;
    } catch (err) {
      console.error(`[media] destroy failed for ${upload.publicId}:`, err);
    }
  }

  await UploadModel.deleteMany({ publicId: { $in: uploads.map((u) => u.publicId) } });
  return destroyed;
}

/**
 * Attach every file referenced by a submission to it.
 *
 * Matched on URL because that is all the submitted answers carry — the client
 * stores what the upload route returned. Anything not matched here stays
 * unclaimed and is swept later, which is the safe direction: the alternative is
 * a file held forever because its answer was edited out before Submit.
 */
export async function claimUploads(submissionId: Types.ObjectId, data: Record<string, string>) {
  const urls = Object.values(data).filter(
    (value) => typeof value === 'string' && value.startsWith('http')
  );
  if (!urls.length) return;

  await UploadModel.updateMany(
    { url: { $in: urls }, submissionId: null },
    { $set: { submissionId } }
  );
}

/** Every file belonging to these submissions, gone from Cloudinary and from Mongo. */
export async function destroyUploadsForSubmissions(submissionIds: Types.ObjectId[]) {
  if (!submissionIds.length) return 0;
  const uploads = await UploadModel.find({ submissionId: { $in: submissionIds } });
  return destroyUploads(uploads);
}

/**
 * Every file belonging to a form: its respondents' answers and its own
 * background image alike. Includes unclaimed rows, since a form being deleted
 * means nothing will ever claim them.
 */
export async function destroyUploadsForForm(formId: Types.ObjectId) {
  const uploads = await UploadModel.find({ formId });
  return destroyUploads(uploads);
}

/**
 * Delete a form's background images.
 *
 * Backgrounds are uploaded per workspace, before the form they end up on is
 * known, so their rows carry no `formId` and `destroyUploadsForForm` cannot see
 * them. The theme is the only place that records which background a form
 * actually uses, so deletion goes through the URLs stored there.
 *
 * A background shared by two forms would be removed from both by this. That is
 * accepted: the editor uploads a fresh copy each time one is chosen, so two
 * forms pointing at one asset does not arise from the UI.
 */
export async function destroyFormBackground(theme: unknown) {
  const urls = backgroundUrls(theme);
  if (!urls.length) return 0;

  const uploads = await UploadModel.find({ url: { $in: urls } });
  return destroyUploads(uploads);
}

/** The image URLs a theme references, across the page and card layers. */
function backgroundUrls(theme: unknown): string[] {
  if (typeof theme !== 'object' || theme === null) return [];
  const t = theme as {
    pageBg?: unknown;
    pageBackground?: { image?: unknown };
    cardBackground?: { image?: unknown };
  };

  return [t.pageBg, t.pageBackground?.image, t.cardBackground?.image].filter(
    (value): value is string => typeof value === 'string' && value.startsWith('http')
  );
}

/**
 * Remove uploads nobody ever submitted.
 *
 * The grace period is what makes this safe: a row is only unclaimed-and-old if
 * the respondent picked a file and then did not finish, because a submission
 * claims its files in the same request that stores it.
 *
 * Form backgrounds are excluded. They are editor assets that no submission will
 * ever claim, so by this query's logic every one of them looks abandoned two
 * minutes after it is chosen — sweeping them would delete live form designs.
 * They go when their form goes, via `destroyUploadsForForm`.
 *
 * Capped per run so one sweep cannot spend an unbounded serverless invocation
 * on a backlog; the next cron tick picks up the remainder.
 */
export async function sweepAbandonedUploads(): Promise<{ found: number; destroyed: number }> {
  const cutoff = new Date(Date.now() - env.uploadGraceMinutes * 60 * 1000);
  const abandoned = await UploadModel.find({
    submissionId: null,
    workspaceId: { $exists: false },
    createdAt: { $lt: cutoff },
  }).limit(500);

  if (!abandoned.length) return { found: 0, destroyed: 0 };
  const destroyed = await destroyUploads(abandoned);
  return { found: abandoned.length, destroyed };
}
