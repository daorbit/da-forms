import { DateTimePicker } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import { toIso, toPickerValue } from './dateInput';

interface Props {
  label: string;
  value?: string;
  minDate?: string;
  onChange: (iso: string | undefined) => void;
}

export function ScheduleDatePicker({ label, value, minDate, onChange }: Props) {
  return (
    <DateTimePicker
      label={label}
      size="xs"
      placeholder="No limit"
      clearable
      valueFormat="D MMM YYYY, HH:mm"
      leftSection={<CalendarIcon size={14} />}
      value={toPickerValue(value)}
      minDate={toPickerValue(minDate) ?? undefined}
      onChange={(next) => onChange(toIso(next))}
    />
  );
}
