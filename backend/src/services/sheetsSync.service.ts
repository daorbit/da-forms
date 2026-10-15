import type { FormDocument, FormField } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { FormSheetModel } from '../models/formSheet.model.js';
import { GoogleApiError } from '../lib/googleOAuth.js';
import { appendRow, createSpreadsheet, deleteSpreadsheet, writeHeader } from '../lib/googleSheets.js';
import { answerFields, answerText } from '../lib/submissionAnswers.js';
import { markSheetsResult, sheetsAccessToken } from './sheetsConnection.service.js';

const SUBMITTED_AT = '__submittedAt';
const SUBMISSION_ID = '__submissionId';
const DUPLICATE_KEY = 11000;

type SyncForm = Pick<FormDocument, 'title' | 'workspaceId' | 'fields'> & { _id: unknown };

interface SheetLink {
  spreadsheetId: string;
  columns: string[];
}

function headerFor(columns: string[], fields: Map<string, FormField>): string[] {
  return columns.map((id) =>
    id === SUBMITTED_AT ? 'Submitted at' : id === SUBMISSION_ID ? 'Response ID' : fields.get(id)?.label || id
  );
}

function rowFor(
  columns: string[],
  fields: Map<string, FormField>,
  data: Record<string, string>,
  submissionId: string,
  payment?: SubmissionPayment,
  booking?: SubmissionBooking
): string[] {
  const submittedAt = new Date().toISOString();
  return columns.map((id) => {
    if (id === SUBMITTED_AT) return submittedAt;
    if (id === SUBMISSION_ID) return submissionId;
    const field = fields.get(id);
    return field ? answerText(field, data, payment, booking) : '';
  });
}

async function createLink(token: string, form: SyncForm, columns: string[], fields: Map<string, FormField>): Promise<SheetLink> {
  const formId = String(form._id);
  const created = await createSpreadsheet(token, `${form.title || 'Form'} — responses`, headerFor(columns, fields));
  try {
    await FormSheetModel.create({
      workspaceId: form.workspaceId,
      formId,
      spreadsheetId: created.spreadsheetId,
      spreadsheetUrl: created.spreadsheetUrl,
      columns,
    });
    return { spreadsheetId: created.spreadsheetId, columns };
  } catch (err) {
    if ((err as { code?: number }).code !== DUPLICATE_KEY) throw err;
    await deleteSpreadsheet(token, created.spreadsheetId).catch(() => undefined);
    const existing = await FormSheetModel.findOne({ formId }).select('spreadsheetId columns').lean();
    if (!existing) throw err;
    return existing;
  }
}

async function ensureColumns(
  token: string,
  formId: string,
  link: SheetLink,
  wanted: string[],
  fields: Map<string, FormField>
): Promise<string[]> {
  const missing = wanted.filter((id) => !link.columns.includes(id));
  if (!missing.length) return link.columns;
  const columns = [...link.columns, ...missing];
  await writeHeader(token, link.spreadsheetId, headerFor(columns, fields));
  await FormSheetModel.updateOne({ formId }, { $set: { columns } });
  return columns;
}

async function appendTo(
  token: string,
  form: SyncForm,
  wanted: string[],
  fields: Map<string, FormField>,
  values: (columns: string[]) => string[]
): Promise<void> {
  const formId = String(form._id);
  const stored = await FormSheetModel.findOne({ formId }).select('spreadsheetId columns').lean();
  const link = stored ?? (await createLink(token, form, wanted, fields));
  const columns = await ensureColumns(token, formId, link, wanted, fields);
  await appendRow(token, link.spreadsheetId, values(columns));
  await FormSheetModel.updateOne({ formId }, { $inc: { rows: 1 }, $set: { lastRowAt: new Date() } });
}

export async function syncSubmissionToSheet(
  form: SyncForm,
  data: Record<string, string>,
  submissionId: string,
  payment?: SubmissionPayment,
  booking?: SubmissionBooking
): Promise<void> {
  const token = await sheetsAccessToken(form.workspaceId);
  if (!token) return;

  const answerable = answerFields(form.fields);
  const fields = new Map(answerable.map((f) => [f.id, f]));
  const wanted = [SUBMITTED_AT, ...answerable.map((f) => f.id), SUBMISSION_ID];
  const values = (columns: string[]) => rowFor(columns, fields, data, submissionId, payment, booking);

  try {
    await appendTo(token, form, wanted, fields, values);
    await markSheetsResult(form.workspaceId);
  } catch (err) {
    if (err instanceof GoogleApiError && (err.kind === 'not_found' || err.kind === 'forbidden')) {
      await FormSheetModel.deleteOne({ formId: String(form._id) });
      try {
        await appendTo(token, form, wanted, fields, values);
        await markSheetsResult(form.workspaceId);
        return;
      } catch (retryErr) {
        err = retryErr;
      }
    }
    const message = err instanceof Error ? err.message : 'Google Sheets rejected the row.';
    console.error('[google-sheets] could not add response:', message);
    await markSheetsResult(form.workspaceId, message);
  }
}
