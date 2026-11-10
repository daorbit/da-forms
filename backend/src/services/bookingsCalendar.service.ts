import { Types } from 'mongoose';
import { BookingModel } from '../models/booking.model.js';
import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import type { SummaryWindow } from '../lib/summaryWindow.js';
import { contactFields, contactOf } from './campaignLeads.service.js';

const MAX_BOOKINGS = 500;

export interface CalendarBooking {
  id: string;
  formId: string;
  formName: string;
  start: Date;
  end: Date;
  submissionId?: string;
  name?: string;
  email?: string;
  meetLink?: string;
  eventLink?: string;
}

type SubmissionRow = {
  _id: Types.ObjectId;
  formId: Types.ObjectId;
  data?: Record<string, unknown>;
  booking?: { meetLink?: string; eventLink?: string };
};

export async function bookingsCalendar(workspaceId: string, window: SummaryWindow) {
  const bookings = await BookingModel.find(
    { workspaceId, status: 'confirmed', start: { $gte: window.since, $lt: window.until } },
    { formId: 1, start: 1, end: 1, submissionId: 1 },
  )
    .sort({ start: 1 })
    .limit(MAX_BOOKINGS + 1)
    .lean();

  const truncated = bookings.length > MAX_BOOKINGS;
  const rows = bookings.slice(0, MAX_BOOKINGS);
  if (!rows.length) return { bookings: [] as CalendarBooking[], truncated };

  const formIds = [...new Set(rows.map((b) => String(b.formId)))];
  const submissionIds = rows.flatMap((b) => (b.submissionId ? [b.submissionId] : []));

  const forms = await FormModel.find({ _id: { $in: formIds }, workspaceId }).select('title fields').lean();
  const fieldsByForm = new Map(forms.map((f) => [String(f._id), contactFields(f.fields ?? [])]));
  const titleByForm = new Map(forms.map((f) => [String(f._id), f.title ?? '']));

  const contactPaths = new Set<string>();
  for (const fields of fieldsByForm.values()) {
    for (const id of [...fields.emailIds, ...(fields.nameId ? [fields.nameId] : [])]) contactPaths.add(`data.${id}`);
  }
  const submissions = submissionIds.length
    ? await SubmissionModel.find({ _id: { $in: submissionIds }, formId: { $in: forms.map((f) => f._id) } })
        .select(['formId', 'booking.meetLink', 'booking.eventLink', ...contactPaths].join(' '))
        .lean<SubmissionRow[]>()
    : [];
  const submissionById = new Map(submissions.map((s) => [String(s._id), s]));

  const result: CalendarBooking[] = rows.map((b) => {
    const formId = String(b.formId);
    const submission = b.submissionId ? submissionById.get(String(b.submissionId)) : undefined;
    const fields = fieldsByForm.get(formId);
    const contact = submission && fields ? contactOf(submission.data ?? {}, fields) : {};
    return {
      id: String(b._id),
      formId,
      formName: titleByForm.get(formId) ?? '',
      start: b.start,
      end: b.end,
      ...(b.submissionId ? { submissionId: String(b.submissionId) } : {}),
      ...contact,
      ...(submission?.booking?.meetLink ? { meetLink: submission.booking.meetLink } : {}),
      ...(submission?.booking?.eventLink ? { eventLink: submission.booking.eventLink } : {}),
    };
  });

  return { bookings: result, truncated };
}
