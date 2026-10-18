import { Types } from 'mongoose';
import { BookingModel } from '../models/booking.model.js';
import { SubmissionModel, type SubmissionBooking } from '../models/submission.model.js';
import type { BookingConfig, FormDocument, FormField } from '../models/form.model.js';
import { shownFieldIds } from '../lib/conditions.js';
import { fillPlaceholders, flattenFields, repeaterText } from '../lib/pipe.js';
import { candidateSlots, overlapsAny, type Interval, type Slot } from '../lib/bookingSlots.js';
import { dateKeyIn, isValidTimeZone } from '../lib/zonedTime.js';
import { deleteEvent, insertEvent, queryFreeBusy } from '../lib/googleCalendar.js';
import { calendarAccessToken } from './calendarConnection.service.js';

export class SlotUnavailableError extends Error {}
export class InvalidBookingError extends Error {}

const DAY_MS = 86_400_000;
const BUSY_CACHE_TTL_MS = 30_000;
const busyCache = new Map<string, { at: number; busy: Interval[] }>();

type FormRef = Pick<FormDocument, 'workspaceId' | 'title' | 'fields'> & { _id: Types.ObjectId };

export function findBookingField(fields: FormField[]): FormField | undefined {
  return flattenFields(fields).find((field) => field.type === 'booking');
}

export function activeBookingField(fields: FormField[], values: Record<string, string>): FormField | undefined {
  const field = findBookingField(fields);
  if (!field) return undefined;
  return shownFieldIds(fields, values).has(field.id) ? field : undefined;
}

export function bookingConfig(field: FormField): BookingConfig {
  const raw = field.booking;
  const timezone = raw?.timezone && isValidTimeZone(raw.timezone) ? raw.timezone : 'UTC';
  return {
    ...raw,
    duration: Math.max(5, Number(raw?.duration) || 30),
    timezone,
    weekly: Array.isArray(raw?.weekly) ? raw.weekly : [],
    seats: Math.max(1, Number(raw?.seats) || 1),
  };
}

function conflictCalendars(config: BookingConfig): string[] {
  const ids = config.conflictCalendarIds?.length ? config.conflictCalendarIds : [config.calendarId || 'primary'];
  return [...new Set(ids)].slice(0, 20);
}

async function googleBusy(
  workspaceId: string,
  config: BookingConfig,
  from: Date,
  to: Date,
  fresh = false
): Promise<Interval[]> {
  if (!config.syncCalendar) return [];
  const calendars = conflictCalendars(config);
  const key = `${workspaceId}|${calendars.join(',')}|${from.getTime()}|${to.getTime()}`;
  const hit = busyCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < BUSY_CACHE_TTL_MS) return hit.busy;

  const token = await calendarAccessToken(workspaceId);
  if (!token) return [];
  try {
    const busy = await queryFreeBusy(token, calendars, from, to);
    if (busyCache.size > 200) busyCache.clear();
    busyCache.set(key, { at: Date.now(), busy });
    return busy;
  } catch (err) {
    console.error('[booking] free/busy lookup failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

function existingBookings(formId: Types.ObjectId, fieldId: string, from: Date, to: Date) {
  return BookingModel.find({ formId, fieldId, start: { $gte: from, $lt: to } })
    .select('start end')
    .limit(5000)
    .lean();
}

function isOpen(
  slot: Slot,
  config: BookingConfig,
  bookings: Interval[],
  busy: Interval[],
  dailyCounts: Map<string, number>
): boolean {
  const sameStart = bookings.filter((b) => b.start.getTime() === slot.start.getTime()).length;
  if (sameStart >= (config.seats ?? 1)) return false;
  if (config.dailyLimit && (dailyCounts.get(dateKeyIn(slot.start, config.timezone)) ?? 0) >= config.dailyLimit) {
    return false;
  }
  const blocking = config.seats === 1 ? [...busy, ...bookings] : busy;
  return !overlapsAny(slot, blocking, config);
}

function countByDay(bookings: Interval[], timeZone: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    const key = dateKeyIn(booking.start, timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function availableSlots(
  form: FormRef,
  field: FormField,
  fromKey: string,
  toKey: string,
  now = new Date()
): Promise<{ timezone: string; slots: string[] }> {
  const config = bookingConfig(field);
  const candidates = candidateSlots(config, fromKey, toKey, now);
  if (!candidates.length) return { timezone: config.timezone, slots: [] };

  const from = new Date(candidates[0].start.getTime() - DAY_MS);
  const to = new Date(candidates[candidates.length - 1].end.getTime() + DAY_MS);
  const [bookings, busy] = await Promise.all([
    existingBookings(form._id, field.id, from, to),
    googleBusy(form.workspaceId, config, from, to),
  ]);
  const dailyCounts = countByDay(bookings, config.timezone);

  return {
    timezone: config.timezone,
    slots: candidates
      .filter((slot) => isOpen(slot, config, bookings, busy, dailyCounts))
      .map((slot) => slot.start.toISOString()),
  };
}

export async function reserveSlot(form: FormRef, field: FormField, value: string, now = new Date()) {
  const config = bookingConfig(field);
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) throw new InvalidBookingError('Pick a time for your booking.');

  const day = dateKeyIn(start, config.timezone);
  const slot = candidateSlots(config, day, day, now).find((s) => s.start.getTime() === start.getTime());
  if (!slot) throw new InvalidBookingError('That time is no longer offered. Pick another slot.');

  const dayStart = new Date(slot.start.getTime() - DAY_MS);
  const dayEnd = new Date(slot.end.getTime() + DAY_MS);
  const [bookings, busy] = await Promise.all([
    existingBookings(form._id, field.id, dayStart, dayEnd),
    googleBusy(form.workspaceId, config, dayStart, dayEnd, true),
  ]);
  if (!isOpen(slot, config, bookings, busy, countByDay(bookings, config.timezone))) {
    throw new SlotUnavailableError('That time was just taken. Pick another slot.');
  }

  for (let seat = 0; seat < (config.seats ?? 1); seat++) {
    try {
      return await BookingModel.create({
        workspaceId: form.workspaceId,
        formId: form._id,
        fieldId: field.id,
        start: slot.start,
        end: slot.end,
        seat,
        status: 'held',
      });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  throw new SlotUnavailableError('That time was just taken. Pick another slot.');
}

export function attachBooking(bookingId: Types.ObjectId, submissionId: Types.ObjectId, confirmed: boolean) {
  return BookingModel.updateOne(
    { _id: bookingId },
    { submissionId, ...(confirmed ? { status: 'confirmed' } : {}) }
  );
}

export function dropHold(bookingId: Types.ObjectId) {
  return BookingModel.deleteOne({ _id: bookingId, status: 'held' });
}

function answerLines(fields: FormField[], data: Record<string, string>, skipId: string): string {
  return flattenFields(fields)
    .filter((f) => f.id !== skipId && f.label && data[f.id])
    .slice(0, 30)
    .map((f) => `${f.label}: ${f.type === 'repeater' ? repeaterText(f, data[f.id]) : data[f.id]}`)
    .join('\n');
}

function attendeeFor(fields: FormField[], data: Record<string, string>, config: BookingConfig) {
  const all = flattenFields(fields);
  const emailField =
    all.find((f) => f.id === config.attendeeEmailFieldId) ?? all.find((f) => f.type === 'email');
  const nameField = all.find((f) => f.id === config.attendeeNameFieldId) ?? all.find((f) => f.type === 'name');
  const email = emailField ? (data[emailField.id] ?? '').trim() : '';
  const name = nameField ? (data[nameField.id] ?? '').trim() : '';
  return { email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : '', name };
}

async function createCalendarEvent(
  form: FormRef,
  field: FormField,
  config: BookingConfig,
  data: Record<string, string>,
  booking: { _id: Types.ObjectId; start: Date; end: Date }
) {
  if (!config.syncCalendar) return null;
  const token = await calendarAccessToken(form.workspaceId).catch((err: unknown) => {
    console.error('[booking] calendar token failed:', err instanceof Error ? err.message : err);
    return null;
  });
  if (!token) return null;

  const attendee = attendeeFor(form.fields, data, config);
  const defaultTitle = attendee.name ? `${field.label || form.title} with ${attendee.name}` : field.label || form.title;
  const description = [
    config.eventDescription ? fillPlaceholders(config.eventDescription, form.fields, data) : '',
    `Booked through ${form.title}.`,
    answerLines(form.fields, data, field.id),
  ]
    .filter(Boolean)
    .join('\n\n');
  const calendarId = config.calendarId || 'primary';

  try {
    const event = await insertEvent(token, calendarId, {
      summary: config.eventTitle ? fillPlaceholders(config.eventTitle, form.fields, data) : defaultTitle,
      description,
      location: config.location || undefined,
      start: booking.start,
      end: booking.end,
      timeZone: config.timezone,
      attendees: attendee.email ? [{ email: attendee.email, displayName: attendee.name || undefined }] : [],
      addMeet: Boolean(config.addMeet),
      requestId: String(booking._id),
    });
    return { ...event, calendarId };
  } catch (err) {
    console.error('[booking] calendar event failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function finalizeBooking(
  form: FormRef,
  submissionId: Types.ObjectId,
  data: Record<string, string>
): Promise<SubmissionBooking | undefined> {
  const booking = await BookingModel.findOneAndUpdate(
    { submissionId },
    { status: 'confirmed' },
    { new: true }
  ).lean();
  if (!booking) return undefined;

  const field = flattenFields(form.fields).find((f) => f.id === booking.fieldId);
  if (!field) return undefined;
  const config = bookingConfig(field);

  const event = await createCalendarEvent(form, field, config, data, booking);
  const summary: SubmissionBooking = {
    fieldId: field.id,
    start: booking.start,
    end: booking.end,
    timezone: config.timezone,
    ...(event?.meetLink ? { meetLink: event.meetLink } : {}),
    ...(event?.htmlLink ? { eventLink: event.htmlLink } : {}),
  };

  await Promise.all([
    SubmissionModel.updateOne({ _id: submissionId }, { booking: summary }),
    event?.eventId
      ? BookingModel.updateOne({ _id: booking._id }, { eventId: event.eventId, calendarId: event.calendarId })
      : null,
  ]);
  return summary;
}

export async function releaseBookings(submissionIds: Types.ObjectId[]): Promise<void> {
  if (!submissionIds.length) return;
  const bookings = await BookingModel.find({ submissionId: { $in: submissionIds } })
    .select('workspaceId calendarId eventId')
    .lean();
  if (!bookings.length) return;

  await BookingModel.deleteMany({ _id: { $in: bookings.map((b) => b._id) } });

  const withEvents = bookings.filter((b) => b.eventId && b.calendarId);
  if (!withEvents.length) return;
  const workspaces = [...new Set(withEvents.map((b) => b.workspaceId))];
  const tokens = new Map(
    await Promise.all(workspaces.map(async (id) => [id, await calendarAccessToken(id)] as const))
  );
  const results = await Promise.allSettled(
    withEvents.map((b) => {
      const token = tokens.get(b.workspaceId);
      return token ? deleteEvent(token, b.calendarId!, b.eventId!) : null;
    })
  );
  for (const result of results) {
    if (result.status === 'rejected') console.error('[booking] could not cancel calendar event:', result.reason);
  }
}

export async function sweepStaleHolds(graceMinutes: number) {
  const cutoff = new Date(Date.now() - graceMinutes * 60_000);
  const result = await BookingModel.deleteMany({
    status: 'held',
    createdAt: { $lt: cutoff },
    submissionId: { $exists: false },
  });
  return { deleted: result.deletedCount ?? 0 };
}
