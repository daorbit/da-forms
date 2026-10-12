import type { BookingConfig } from '../models/form.model.js';

export function formatBookingTime(
  start: Date,
  end: Date,
  timeZone: string,
  timeFormat: BookingConfig['timeFormat'] = '12h'
): string {
  const hour12 = timeFormat !== '24h';
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(start);
  const time = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12 });
  return `${day}, ${time.format(start)} – ${time.format(end)} (${timeZone})`;
}
