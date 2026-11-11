import type { BookingEvent } from '@/components/builder/entries/calendar/bookingEvents';
import { dayKey } from '@/components/builder/entries/calendar/calendarDates';

export interface BookingStats {
  today: number;
  week: number;
  upcoming: number;
  completed: number;
  hours: number;
}

export function bookingStats(events: BookingEvent[]): BookingStats {
  const now = new Date();
  const todayKey = dayKey(now);
  const weekEnd = now.getTime() + 7 * 86_400_000;
  let minutes = 0;
  const stats: BookingStats = { today: 0, week: 0, upcoming: 0, completed: 0, hours: 0 };

  for (const event of events) {
    const start = event.start.getTime();
    if (dayKey(event.start) === todayKey) stats.today += 1;
    if (event.state !== 'past' && start <= weekEnd) stats.week += 1;
    if (event.state === 'past') stats.completed += 1;
    else stats.upcoming += 1;
    minutes += (event.end.getTime() - start) / 60_000;
  }

  stats.hours = Math.round((minutes / 60) * 10) / 10;
  return stats;
}
