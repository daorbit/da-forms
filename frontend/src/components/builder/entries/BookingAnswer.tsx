import { Anchor, Group, Stack, Text } from '@mantine/core';
import { CalendarIcon, VideoIcon } from 'lucide-react';
import type { FormField, Submission } from '@/types';
import { bookingEnd, browserTimeZone, formatBookingRange } from '@/lib/booking';

interface Props {
  field: FormField;
  submission: Submission;
}

export function BookingAnswer({ field, submission }: Props) {
  const start = submission.booking?.start ?? submission.data[field.id];
  if (!start) return <Text c="dimmed">—</Text>;

  const end = submission.booking?.end ?? bookingEnd(field, start);
  const zone = browserTimeZone();

  return (
    <Stack gap={6}>
      <Text size="sm">{formatBookingRange(start, end, zone, field.booking?.timeFormat)}</Text>
      <Group gap="md">
        {submission.booking?.meetLink && (
          <Anchor href={submission.booking.meetLink} target="_blank" rel="noopener noreferrer" size="sm">
            <Group gap={4} component="span">
              <VideoIcon size={14} />
              Google Meet
            </Group>
          </Anchor>
        )}
        {submission.booking?.eventLink && (
          <Anchor href={submission.booking.eventLink} target="_blank" rel="noopener noreferrer" size="sm">
            <Group gap={4} component="span">
              <CalendarIcon size={14} />
              Calendar event
            </Group>
          </Anchor>
        )}
      </Group>
    </Stack>
  );
}
