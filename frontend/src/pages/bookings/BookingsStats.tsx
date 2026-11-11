import { CalendarClockIcon, CalendarDaysIcon, CheckCircle2Icon, ClockIcon, TimerIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookingStats } from './bookingStats';
import classes from './BookingsStats.module.css';

interface Item {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'accent' | 'green' | 'violet' | 'teal' | 'muted';
}

function itemsOf(stats: BookingStats): Item[] {
  return [
    { icon: CalendarClockIcon, label: 'Today', value: String(stats.today), tone: 'accent' },
    { icon: CalendarDaysIcon, label: 'Next 7 days', value: String(stats.week), tone: 'violet' },
    { icon: ClockIcon, label: 'Upcoming', value: String(stats.upcoming), tone: 'teal' },
    { icon: CheckCircle2Icon, label: 'Completed', value: String(stats.completed), tone: 'green' },
    { icon: TimerIcon, label: 'Meeting hours', value: `${stats.hours} h`, tone: 'muted' },
  ];
}

export function BookingsStats({ stats }: { stats: BookingStats }) {
  return (
    <div className={classes.strip}>
      {itemsOf(stats).map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className={classes.item} data-tone={tone}>
          <span className={classes.icon}>
            <Icon size={15} />
          </span>
          <span className={classes.text}>
            <span className={classes.value}>{value}</span>
            <span className={classes.label}>{label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
