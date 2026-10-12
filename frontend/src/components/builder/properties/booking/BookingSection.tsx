import { useMemo } from 'react';
import { NumberInput, SegmentedControl, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { BookingConfig, BookingTimeFormat } from '@/types';
import { DURATION_OPTIONS, timeZoneOptions, withBookingDefaults } from '@/lib/booking';
import { FieldPair, PropertySection } from '../PropertySection';
import type { SectionProps } from '../types';
import { WeeklyHoursEditor } from './WeeklyHoursEditor';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import statusClasses from '../PaymentSection.module.css';

const optionalNumber = (v: string | number) => (v === '' ? undefined : Number(v));

export function BookingSection({ field, set }: SectionProps) {
  const config = withBookingDefaults(field.booking);
  const zones = useMemo(() => timeZoneOptions(), []);
  const setBooking = (patch: Partial<BookingConfig>) => set({ booking: { ...config, ...patch } });

  return (
    <>
      <PropertySection
        title="Meeting"
        description="How long each booking is and how slots are spaced."
        aside={<DocsLink path={DOCS.booking} label="Booking guide" />}
      >
        <FieldPair>
          <Select
            label="Duration"
            value={String(config.duration)}
            onChange={(v) => setBooking({ duration: Number(v) || 30 })}
            data={DURATION_OPTIONS.map((m) => ({ value: String(m), label: `${m} min` }))}
            allowDeselect={false}
          />
          <NumberInput
            label="Start a slot every"
            description="Minutes. Blank uses the duration."
            min={5}
            step={5}
            value={config.interval ?? ''}
            onChange={(v) => setBooking({ interval: optionalNumber(v) })}
          />
        </FieldPair>
        <FieldPair>
          <NumberInput
            label="Buffer before"
            description="Minutes kept free."
            min={0}
            step={5}
            value={config.bufferBefore ?? ''}
            onChange={(v) => setBooking({ bufferBefore: optionalNumber(v) })}
          />
          <NumberInput
            label="Buffer after"
            description="Minutes kept free."
            min={0}
            step={5}
            value={config.bufferAfter ?? ''}
            onChange={(v) => setBooking({ bufferAfter: optionalNumber(v) })}
          />
        </FieldPair>
        <FieldPair>
          <NumberInput
            label="Seats per slot"
            description="People who can book the same time."
            min={1}
            max={500}
            value={config.seats ?? 1}
            onChange={(v) => setBooking({ seats: Math.max(1, Number(v) || 1) })}
          />
          <NumberInput
            label="Max bookings a day"
            description="Optional."
            min={1}
            value={config.dailyLimit ?? ''}
            onChange={(v) => setBooking({ dailyLimit: optionalNumber(v) })}
          />
        </FieldPair>
      </PropertySection>

      <PropertySection title="Availability" description="When people can book you, in your own timezone.">
        <Select
          label="Your timezone"
          searchable
          value={config.timezone}
          onChange={(v) => v && setBooking({ timezone: v })}
          data={zones}
          allowDeselect={false}
        />
        <WeeklyHoursEditor weekly={config.weekly} onChange={(weekly) => setBooking({ weekly })} />
        <FieldPair>
          <NumberInput
            label="Minimum notice"
            description="Hours before a slot."
            min={0}
            value={(config.minNotice ?? 0) / 60}
            onChange={(v) => setBooking({ minNotice: Math.round((Number(v) || 0) * 60) })}
          />
          <NumberInput
            label="Book up to"
            description="Days into the future."
            min={1}
            max={365}
            value={config.maxDaysAhead ?? 30}
            onChange={(v) => setBooking({ maxDaysAhead: Math.max(1, Number(v) || 30) })}
          />
        </FieldPair>
        <DatePickerInput
          type="multiple"
          label="Days off"
          description="Holidays and other dates nobody can book."
          placeholder="Pick dates"
          clearable
          value={config.blockedDates ?? []}
          onChange={(dates) => setBooking({ blockedDates: dates.length ? [...dates].sort() : undefined })}
        />
        <div>
          <div className={statusClasses.fieldLabel}>Time format</div>
          <SegmentedControl
            fullWidth
            size="xs"
            value={config.timeFormat ?? '12h'}
            onChange={(v) => setBooking({ timeFormat: v as BookingTimeFormat })}
            data={[
              { value: '12h', label: '9:30 AM' },
              { value: '24h', label: '09:30' },
            ]}
          />
        </div>
      </PropertySection>
    </>
  );
}
