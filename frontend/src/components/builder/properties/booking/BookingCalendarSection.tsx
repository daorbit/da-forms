import { MultiSelect, Select, Textarea, TextInput } from '@mantine/core';
import type { BookingConfig, FormField } from '@/types';
import { withBookingDefaults } from '@/lib/booking';
import { flattenFields } from '@/lib/fieldTree';
import { useCalendarConnection } from '@/hooks/useCalendarConnection';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { PropertySection, ToggleList, ToggleRow } from '../PropertySection';
import type { SectionProps } from '../types';
import { CalendarConnectionCard } from './CalendarConnectionCard';
import classes from './BookingSection.module.css';

interface Props extends SectionProps {
  allFields: FormField[];
  onOpenIntegrations?: () => void;
}

export function BookingCalendarSection({ field, set, allFields, onOpenIntegrations }: Props) {
  const config = withBookingDefaults(field.booking);
  const setBooking = (patch: Partial<BookingConfig>) => set({ booking: { ...config, ...patch } });
  const { status } = useCalendarConnection(useWorkspaceId());
  const connected = Boolean(status?.connected);
  const calendars = status?.calendars ?? [];
  const writable = calendars.filter((c) => c.canWrite);
  const fields = flattenFields(allFields);
  const pick = (types: string[]) =>
    fields.filter((f) => types.includes(f.type)).map((f) => ({ value: f.id, label: f.label || f.type }));

  return (
    <PropertySection
      title="Google Calendar"
      description="Block times you are busy, add each booking to your calendar and send a Meet link."
    >
      <CalendarConnectionCard status={status} onManage={onOpenIntegrations} />

      {status && !connected && status.configured && (
        <div className={classes.hint}>
          Connect Google Calendar once from Apps. Every booking field in this workspace can then use it.
        </div>
      )}

      {connected && (
        <>
          <ToggleList>
            <ToggleRow
              label="Sync with Google Calendar"
              hint="Hide busy times and create an event for every booking."
              checked={Boolean(config.syncCalendar)}
              onChange={(syncCalendar) => setBooking({ syncCalendar })}
            />
            {config.syncCalendar && (
              <ToggleRow
                label="Add a Google Meet link"
                hint="Each event gets its own Meet room."
                checked={Boolean(config.addMeet)}
                onChange={(addMeet) => setBooking({ addMeet })}
              />
            )}
          </ToggleList>

          {config.syncCalendar && (
            <>
              <Select
                label="Add bookings to"
                value={config.calendarId ?? 'primary'}
                onChange={(v) => setBooking({ calendarId: v ?? undefined })}
                data={[
                  { value: 'primary', label: 'Primary calendar' },
                  ...writable.filter((c) => !c.primary).map((c) => ({ value: c.id, label: c.summary })),
                ]}
                allowDeselect={false}
              />
              <MultiSelect
                label="Check these calendars for conflicts"
                description="Blank checks only the calendar above."
                placeholder="Pick calendars"
                value={config.conflictCalendarIds ?? []}
                onChange={(ids) => setBooking({ conflictCalendarIds: ids.length ? ids : undefined })}
                data={calendars.map((c) => ({ value: c.primary ? 'primary' : c.id, label: c.summary }))}
                clearable
              />
              <TextInput
                label="Event title"
                placeholder={`${field.label || 'Meeting'} with {{Name}}`}
                description="Use {{Field Label}} to add an answer."
                value={config.eventTitle ?? ''}
                onChange={(e) => setBooking({ eventTitle: e.target.value || undefined })}
              />
              <Textarea
                label="Event description"
                autosize
                minRows={2}
                placeholder="Agenda, prep notes… All answers are added below it."
                value={config.eventDescription ?? ''}
                onChange={(e) => setBooking({ eventDescription: e.target.value || undefined })}
              />
              <TextInput
                label="Location"
                placeholder="Optional, e.g. office address"
                value={config.location ?? ''}
                onChange={(e) => setBooking({ location: e.target.value || undefined })}
              />
              <Select
                label="Invite the respondent using"
                description="They get the calendar invite and Meet link by email."
                placeholder="First email field"
                clearable
                value={config.attendeeEmailFieldId ?? null}
                onChange={(v) => setBooking({ attendeeEmailFieldId: v ?? undefined })}
                data={pick(['email'])}
              />
              <Select
                label="Respondent name from"
                placeholder="First name field"
                clearable
                value={config.attendeeNameFieldId ?? null}
                onChange={(v) => setBooking({ attendeeNameFieldId: v ?? undefined })}
                data={pick(['name', 'text'])}
              />
              {!pick(['email']).length && (
                <div className={classes.hint}>Add an email field so respondents receive the invite.</div>
              )}
            </>
          )}
        </>
      )}
    </PropertySection>
  );
}
