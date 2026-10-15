import type { FieldType, FormField } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { formatBookingTime } from './bookingFormat.js';
import { flattenFields, repeaterText } from './pipe.js';

const LAYOUT_TYPES: FieldType[] = ['heading', 'description', 'richText', 'divider', 'spacer', 'pageBreak', 'grid'];

function formatPaid(payment: SubmissionPayment): string {
  const major = (payment.amount / 100).toFixed(2);
  const amount = payment.currency === 'INR' ? `₹${major}` : `${major} ${payment.currency}`;
  return payment.method ? `${amount} (${payment.method.toUpperCase()})` : amount;
}

function bookingText(field: FormField, raw: string, booking?: SubmissionBooking): string {
  const start = booking ? new Date(booking.start) : new Date(raw);
  if (Number.isNaN(start.getTime())) return raw;
  const end = booking
    ? new Date(booking.end)
    : new Date(start.getTime() + (field.booking?.duration ?? 30) * 60_000);
  const when = formatBookingTime(start, end, booking?.timezone ?? field.booking?.timezone ?? 'UTC', field.booking?.timeFormat);
  return booking?.meetLink ? `${when}\nGoogle Meet: ${booking.meetLink}` : when;
}

export function answerText(
  field: FormField,
  data: Record<string, string>,
  payment?: SubmissionPayment,
  booking?: SubmissionBooking
): string {
  if (field.type === 'payment') return payment?.status === 'paid' ? formatPaid(payment) : '';
  const raw = data[field.id] ?? '';
  if (!raw) return '';
  if (field.type === 'repeater') return repeaterText(field, raw);
  if (field.type === 'booking') return bookingText(field, raw, booking?.fieldId === field.id ? booking : undefined);
  return raw;
}

export function answersOf(
  fields: FormField[],
  data: Record<string, string>,
  payment?: SubmissionPayment,
  booking?: SubmissionBooking
): { label: string; value: string }[] {
  return flattenFields(fields)
    .filter((f) => {
      if (f.type === 'payment') return Boolean(f.label && payment?.status === 'paid');
      return Boolean(f.label && data[f.id] !== undefined && data[f.id] !== '');
    })
    .map((f) => ({ label: f.label, value: answerText(f, data, payment, booking) }));
}

export function answerFields(fields: FormField[]): FormField[] {
  return flattenFields(fields).filter((field) => !LAYOUT_TYPES.includes(field.type));
}
