import { TextInput, Textarea, Select, Checkbox, Radio, Stack, Group, Rating, NumberInput, FileInput } from '@mantine/core';
import { IconMail, IconPhone, IconWorld, IconCurrencyDollar, IconCalendar, IconClock } from '@tabler/icons-react';
import type { FormField } from '@/types';

/** Read-only rendering of a field as it will appear to respondents. */
export function FieldPreview({ field }: { field: FormField }) {
  const common = { readOnly: true, placeholder: field.placeholder };

  switch (field.type) {
    case 'name':
      return (
        <Group grow>
          <TextInput {...common} placeholder="First" />
          <TextInput {...common} placeholder="Last" />
        </Group>
      );
    case 'address':
      return (
        <Stack gap="xs">
          <TextInput {...common} placeholder="Street address" />
          <Group grow>
            <TextInput {...common} placeholder="City" />
            <TextInput {...common} placeholder="Postal code" />
          </Group>
        </Stack>
      );
    case 'email':
      return <TextInput {...common} leftSection={<IconMail size={16} />} />;
    case 'phone':
      return <TextInput {...common} leftSection={<IconPhone size={16} />} />;
    case 'website':
      return <TextInput {...common} leftSection={<IconWorld size={16} />} placeholder="https://" />;
    case 'textarea':
      return <Textarea {...common} autosize minRows={3} />;
    case 'regex':
      return <TextInput {...common} placeholder={field.pattern ?? 'Pattern'} />;
    case 'number':
      return <NumberInput {...common} placeholder="123" />;
    case 'decimal':
      return <NumberInput {...common} decimalScale={2} placeholder="0.00" />;
    case 'currency':
      return <NumberInput {...common} leftSection={<IconCurrencyDollar size={16} />} decimalScale={2} />;
    case 'select':
      return <Select readOnly placeholder="Select..." data={field.options ?? []} />;
    case 'radio':
      return (
        <Radio.Group>
          <Stack gap="xs">
            {(field.options ?? []).map((opt) => (
              <Radio key={opt} value={opt} label={opt} readOnly />
            ))}
          </Stack>
        </Radio.Group>
      );
    case 'checkbox':
      return (
        <Stack gap="xs">
          {(field.options ?? []).map((opt) => (
            <Checkbox key={opt} label={opt} readOnly />
          ))}
        </Stack>
      );
    case 'date':
      return <TextInput {...common} leftSection={<IconCalendar size={16} />} placeholder="dd/mm/yyyy" />;
    case 'time':
      return <TextInput {...common} leftSection={<IconClock size={16} />} placeholder="hh:mm" />;
    case 'rating':
      return <Rating count={field.maxRating ?? 5} readOnly />;
    case 'file':
      return <FileInput {...common} placeholder="Choose file" />;
    default:
      return <TextInput {...common} />;
  }
}
