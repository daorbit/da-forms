import { googleApi } from './googleOAuth.js';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarSummary {
  id: string;
  summary: string;
  primary: boolean;
  canWrite: boolean;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  timeZone: string;
  attendees: { email: string; displayName?: string }[];
  addMeet: boolean;
  requestId: string;
}

export interface CreatedEvent {
  eventId: string;
  htmlLink: string;
  meetLink: string;
}

export async function listCalendars(accessToken: string): Promise<CalendarSummary[]> {
  const data = await googleApi<{
    items?: { id?: string; summary?: string; summaryOverride?: string; primary?: boolean; accessRole?: string }[];
  }>(`${CALENDAR_API}/users/me/calendarList?maxResults=100&minAccessRole=reader`, accessToken);

  return (data.items ?? [])
    .filter((item) => item.id)
    .map((item) => ({
      id: String(item.id),
      summary: item.summaryOverride ?? item.summary ?? String(item.id),
      primary: Boolean(item.primary),
      canWrite: item.accessRole === 'owner' || item.accessRole === 'writer',
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary));
}

export async function queryFreeBusy(
  accessToken: string,
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  const data = await googleApi<{
    calendars?: Record<string, { busy?: { start?: string; end?: string }[] }>;
  }>(`${CALENDAR_API}/freeBusy`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    }),
  });

  return Object.values(data.calendars ?? {})
    .flatMap((calendar) => calendar.busy ?? [])
    .filter((slot) => slot.start && slot.end)
    .map((slot) => ({ start: new Date(String(slot.start)), end: new Date(String(slot.end)) }));
}

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  input: CalendarEventInput
): Promise<CreatedEvent> {
  const query = new URLSearchParams({
    conferenceDataVersion: input.addMeet ? '1' : '0',
    sendUpdates: input.attendees.length ? 'all' : 'none',
  });

  const data = await googleApi<{
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  }>(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start.toISOString(), timeZone: input.timeZone },
      end: { dateTime: input.end.toISOString(), timeZone: input.timeZone },
      attendees: input.attendees,
      reminders: { useDefault: true },
      ...(input.addMeet
        ? {
            conferenceData: {
              createRequest: { requestId: input.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } },
            },
          }
        : {}),
    }),
  });

  const video = data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video');
  return {
    eventId: String(data.id ?? ''),
    htmlLink: String(data.htmlLink ?? ''),
    meetLink: String(data.hangoutLink ?? video?.uri ?? ''),
  };
}

export function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  return googleApi<void>(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    accessToken,
    { method: 'DELETE' }
  );
}
