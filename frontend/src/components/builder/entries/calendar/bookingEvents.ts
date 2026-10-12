import type { FormField, Submission } from '@/types';
import { bookingEnd, findBookingField } from '@/lib/booking';
import { respondentIdentity } from '@/lib/respondent';
import { answerText } from '../entriesTypes';
import { dayKey, minutesOfDay } from './calendarDates';

export type BookingEventState = 'upcoming' | 'live' | 'past';

export interface BookingEvent {
  id: string;
  submission: Submission;
  start: Date;
  end: Date;
  title: string;
  email?: string;
  initials: string;
  meetLink?: string;
  eventLink?: string;
  state: BookingEventState;
}

export interface PlacedEvent {
  event: BookingEvent;
  top: number;
  duration: number;
  lane: number;
  lanes: number;
}

function stateOf(start: Date, end: Date, now: number): BookingEventState {
  if (end.getTime() <= now) return 'past';
  if (start.getTime() <= now) return 'live';
  return 'upcoming';
}

export function bookingEvents(fields: FormField[], submissions: Submission[]): BookingEvent[] {
  const field = findBookingField(fields);
  if (!field) return [];
  const now = Date.now();
  const events: BookingEvent[] = [];

  for (const submission of submissions) {
    const startIso = submission.booking?.start ?? answerText(submission.data[field.id]);
    if (!startIso) continue;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) continue;
    const end = new Date(submission.booking?.end ?? bookingEnd(field, startIso));
    const who = respondentIdentity(fields, submission);

    events.push({
      id: submission._id,
      submission,
      start,
      end,
      title: who.name ?? who.email ?? 'Booking',
      email: who.name ? who.email : undefined,
      initials: who.initials,
      meetLink: submission.booking?.meetLink,
      eventLink: submission.booking?.eventLink,
      state: stateOf(start, end, now),
    });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function groupByDay(events: BookingEvent[]): Map<string, BookingEvent[]> {
  const map = new Map<string, BookingEvent[]>();
  for (const event of events) {
    const key = dayKey(event.start);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

export function placeDay(events: BookingEvent[]): PlacedEvent[] {
  const placed: PlacedEvent[] = [];
  let cluster: PlacedEvent[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const event of events) {
    const top = minutesOfDay(event.start);
    const duration = Math.max(15, Math.round((event.end.getTime() - event.start.getTime()) / 60_000));
    const bottom = Math.min(top + duration, 24 * 60);

    if (top >= clusterEnd) closeCluster();

    let lane = laneEnds.findIndex((end) => end <= top);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(bottom);
    } else {
      laneEnds[lane] = bottom;
    }

    const item: PlacedEvent = { event, top, duration, lane, lanes: 1 };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, bottom);
  }
  closeCluster();

  return placed;
}
