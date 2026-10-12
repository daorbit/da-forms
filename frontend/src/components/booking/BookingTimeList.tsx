import { Loader, Text, UnstyledButton } from '@mantine/core';
import type { BookingTimeFormat } from '@/types';
import { formatSlotTime } from '@/lib/booking';
import classes from './BookingInput.module.css';

interface Props {
  slots: string[];
  selected: string;
  timeZone: string;
  timeFormat?: BookingTimeFormat;
  loading: boolean;
  disabled?: boolean;
  onPick: (iso: string) => void;
}

export function BookingTimeList({ slots, selected, timeZone, timeFormat, loading, disabled, onPick }: Props) {
  if (loading) {
    return (
      <div className={classes.timesEmpty}>
        <Loader size="sm" />
      </div>
    );
  }

  if (!slots.length) {
    return (
      <Text size="sm" className={classes.timesEmpty}>
        No times left on this day.
      </Text>
    );
  }

  return (
    <div className={classes.timeList} role="listbox" aria-label="Available times">
      {slots.map((iso) => (
        <UnstyledButton
          key={iso}
          type="button"
          role="option"
          aria-selected={iso === selected}
          data-selected={iso === selected || undefined}
          className={classes.time}
          disabled={disabled}
          onClick={() => onPick(iso)}
        >
          {formatSlotTime(iso, timeZone, timeFormat)}
        </UnstyledButton>
      ))}
    </div>
  );
}
