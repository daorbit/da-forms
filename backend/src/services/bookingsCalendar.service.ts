import { Types } from 'mongoose';
import { FormModel, type FormField } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { flattenFields } from '../lib/pipe.js';
import type { SummaryWindow } from '../lib/summaryWindow.js';
import { contactFields, contactOf } from './campaignLeads.service.js';

const MAX_FORMS = 200;
const MAX_BOOKINGS = 500;
const DEFAULT_DURATION_MIN = 30;

export interface CalendarBooking {
  id: string;
  formId: string;
  formName: string;
  start: Date;
  end: Date;
  submissionId: string;
  name?: string;
  email?: string;
  meetLink?: string;
  eventLink?: string;
}

type BookingForm = {
  id: Types.ObjectId;
  title: string;
  fieldId: string;
  duration: number;
  contacts: ReturnType<typeof contactFields>;
};

type SubmissionRow = {
  _id: Types.ObjectId;
  formId: Types.ObjectId;
  data?: Record<string, unknown>;
  booking?: { start?: Date; end?: Date; meetLink?: string; eventLink?: string };
};

function bookingForms(forms: { _id: Types.ObjectId; title?: string; fields?: FormField[] }[]): BookingForm[] {
  return forms.flatMap((form) => {
    const field = flattenFields(form.fields ?? []).find((f) => f.type === 'booking');
    if (!field) return [];
    const duration = Number((field as { booking?: { duration?: number } }).booking?.duration) || DEFAULT_DURATION_MIN;
    return [{ id: form._id, title: form.title ?? '', fieldId: field.id, duration, contacts: contactFields(form.fields ?? []) }];
  });
}

function startOf(row: SubmissionRow, form: BookingForm): Date | null {
  const raw = row.booking?.start ?? row.data?.[form.fieldId];
  if (!raw) return null;
  const date = new Date(raw as string | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function bookingsCalendar(workspaceId: string, window: SummaryWindow) {
  const forms = bookingForms(
    await FormModel.find({ workspaceId }).select('title fields').limit(MAX_FORMS).lean(),
  );
  const formList = forms.map((f) => ({ id: String(f.id), title: f.title }));
  if (!forms.length) return { forms: formList, bookings: [] as CalendarBooking[], truncated: false };

  const since = window.since.toISOString();
  const until = window.until.toISOString();
  const projection = new Set(['formId', 'booking.start', 'booking.end', 'booking.meetLink', 'booking.eventLink']);
  for (const form of forms) {
    projection.add(`data.${form.fieldId}`);
    for (const id of [...form.contacts.emailIds, ...(form.contacts.nameId ? [form.contacts.nameId] : [])]) {
      projection.add(`data.${id}`);
    }
  }

  const rows = await SubmissionModel.find({
    formId: { $in: forms.map((f) => f.id) },
    status: 'complete',
    $or: [
      { 'booking.start': { $gte: window.since, $lt: window.until } },
      ...forms.map((f) => ({ formId: f.id, [`data.${f.fieldId}`]: { $gte: since, $lt: until } })),
    ],
  })
    .select([...projection].join(' '))
    .limit(MAX_BOOKINGS + 1)
    .lean<SubmissionRow[]>();

  const formById = new Map(forms.map((f) => [String(f.id), f]));
  const bookings = rows.flatMap((row): CalendarBooking[] => {
    const form = formById.get(String(row.formId));
    const start = form ? startOf(row, form) : null;
    if (!form || !start || start < window.since || start >= window.until) return [];
    const end = row.booking?.end ? new Date(row.booking.end) : new Date(start.getTime() + form.duration * 60_000);
    return [
      {
        id: String(row._id),
        formId: String(form.id),
        formName: form.title,
        start,
        end,
        submissionId: String(row._id),
        ...contactOf(row.data ?? {}, form.contacts),
        ...(row.booking?.meetLink ? { meetLink: row.booking.meetLink } : {}),
        ...(row.booking?.eventLink ? { eventLink: row.booking.eventLink } : {}),
      },
    ];
  });

  bookings.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { forms: formList, bookings: bookings.slice(0, MAX_BOOKINGS), truncated: rows.length > MAX_BOOKINGS };
}
