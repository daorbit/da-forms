import type { CalendarBooking } from '@/lib/api';
import { toneOf } from '@/components/builder/entries/calendar/bookingTone';
import type { LegendForm } from '@/components/builder/entries/calendar/CalendarFormLegend';

export function legendForms(bookings: CalendarBooking[]): LegendForm[] {
  const seen = new Map<string, LegendForm>();
  for (const b of bookings) {
    if (!b.formId || seen.has(b.formId)) continue;
    seen.set(b.formId, { id: b.formId, name: b.formName || 'Untitled form', tone: toneOf(b.formId) });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
