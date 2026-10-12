import type { ReactElement } from 'react';
import { Popover } from '@mantine/core';
import type { Submission } from '@/types';
import type { BookingEvent } from './bookingEvents';
import { BookingEventCard } from './BookingEventCard';

interface Props {
  event: BookingEvent;
  onOpen: (submission: Submission) => void;
  children: ReactElement;
}

export function BookingEventPopover({ event, onOpen, children }: Props) {
  return (
    <Popover width={320} position="right-start" withArrow shadow="md" radius="lg" offset={8} withinPortal>
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown p={0}>
        <BookingEventCard event={event} onOpen={onOpen} />
      </Popover.Dropdown>
    </Popover>
  );
}
