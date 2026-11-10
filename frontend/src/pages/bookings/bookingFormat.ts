const DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const TIME = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function bookingDay(iso: string): string {
  return DAY.format(new Date(iso));
}

export function bookingTime(start: string, end: string): string {
  return `${TIME.format(new Date(start))} – ${TIME.format(new Date(end))}`;
}

export function untilLabel(iso: string, now = Date.now()): string {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (minutes < 60) return `In ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `In ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
}
