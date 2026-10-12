import { Loader, UnstyledButton } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import type { BookingTimeFormat } from '@/types';
import { formatSlotTime } from '@/lib/booking';
import classes from './BookingInput.module.css';

interface Props {
  slots: string[];
  confirmed: string;
  pending: string | null;
  timeZone: string;
  timeFormat?: BookingTimeFormat;
  loading: boolean;
  onPick: (iso: string) => void;
  onConfirm: (iso: string) => void;
}

export function BookingTimeList({
  slots,
  confirmed,
  pending,
  timeZone,
  timeFormat,
  loading,
  onPick,
  onConfirm,
}: Props) {
  if (loading) {
    return (
      <div className={classes.timesEmpty}>
        <Loader size="sm" color="var(--bk-accent)" />
      </div>
    );
  }

  if (!slots.length) {
    return <div className={classes.timesEmpty}>No times left on this day.</div>;
  }

  return (
    <div className={classes.timeList}>
      {slots.map((iso) => {
        const time = formatSlotTime(iso, timeZone, timeFormat);

        if (iso === confirmed) {
          return (
            <UnstyledButton key={iso} type="button" className={classes.timeConfirmed} onClick={() => onPick(iso)}>
              <CheckIcon size={16} strokeWidth={2.6} />
              {time}
            </UnstyledButton>
          );
        }

        if (iso === pending) {
          return (
            <div key={iso} className={classes.timeSplit}>
              <span className={classes.timePicked}>{time}</span>
              <UnstyledButton type="button" className={classes.timeConfirm} onClick={() => onConfirm(iso)}>
                Confirm
              </UnstyledButton>
            </div>
          );
        }

        return (
          <UnstyledButton key={iso} type="button" className={classes.time} onClick={() => onPick(iso)}>
            {time}
          </UnstyledButton>
        );
      })}
    </div>
  );
}
