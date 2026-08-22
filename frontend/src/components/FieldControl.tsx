import {
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Stack,
  Group,
  Rating,
  NumberInput,
  FileInput,
  Text,
} from '@mantine/core';
import { IconMail, IconPhone, IconWorld, IconCurrencyDollar } from '@tabler/icons-react';
import type { FormField } from '@/types';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}

/** Live, respondent-facing control for one field. */
export function FieldControl({ field, value, onChange }: Props) {
  const label = (
    <>
      {field.label}
      {field.required && (
        <Text span c="red">
          {' '}
          *
        </Text>
      )}
    </>
  );

  const base = {
    label,
    description: field.helpText,
    required: field.required,
    placeholder: field.placeholder,
  };

  const text = (extra?: Record<string, unknown>) => (
    <TextInput {...base} {...extra} value={value} onChange={(e) => onChange(e.target.value)} />
  );

  switch (field.type) {
    case 'name': {
      const [first = '', last = ''] = value.split(' ');
      return (
        <div>
          <Text size="sm" fw={500} mb={4}>
            {label}
          </Text>
          <Group grow>
            <TextInput
              placeholder="First"
              value={first}
              onChange={(e) => onChange(`${e.target.value} ${last}`.trim())}
              required={field.required}
            />
            <TextInput
              placeholder="Last"
              value={last}
              onChange={(e) => onChange(`${first} ${e.target.value}`.trim())}
            />
          </Group>
        </div>
      );
    }
    case 'address':
      return <Textarea {...base} value={value} onChange={(e) => onChange(e.target.value)} autosize minRows={2} />;
    case 'email':
      return text({ type: 'email', leftSection: <IconMail size={16} /> });
    case 'phone':
      return text({ type: 'tel', leftSection: <IconPhone size={16} /> });
    case 'website':
      return text({ type: 'url', leftSection: <IconWorld size={16} /> });
    case 'textarea':
      return <Textarea {...base} value={value} onChange={(e) => onChange(e.target.value)} autosize minRows={3} />;
    case 'regex':
      return text({ pattern: field.pattern });
    case 'number':
      return (
        <NumberInput {...base} min={field.min} max={field.max} value={value} onChange={(v) => onChange(String(v))} />
      );
    case 'decimal':
      return (
        <NumberInput
          {...base}
          decimalScale={2}
          min={field.min}
          max={field.max}
          value={value}
          onChange={(v) => onChange(String(v))}
        />
      );
    case 'currency':
      return (
        <NumberInput
          {...base}
          leftSection={<IconCurrencyDollar size={16} />}
          decimalScale={2}
          min={field.min}
          max={field.max}
          value={value}
          onChange={(v) => onChange(String(v))}
        />
      );
    case 'select':
      return (
        <Select {...base} data={field.options ?? []} value={value} onChange={(v) => onChange(v ?? '')} />
      );
    case 'radio':
      return (
        <Radio.Group {...base} value={value} onChange={onChange}>
          <Stack gap="xs" mt="xs">
            {(field.options ?? []).map((opt) => (
              <Radio key={opt} value={opt} label={opt} />
            ))}
          </Stack>
        </Radio.Group>
      );
    case 'checkbox': {
      const selected = value ? value.split(', ') : [];
      return (
        <Checkbox.Group {...base} value={selected} onChange={(v) => onChange(v.join(', '))}>
          <Stack gap="xs" mt="xs">
            {(field.options ?? []).map((opt) => (
              <Checkbox key={opt} value={opt} label={opt} />
            ))}
          </Stack>
        </Checkbox.Group>
      );
    }
    case 'date':
      return text({ type: 'date' });
    case 'time':
      return text({ type: 'time' });
    case 'rating':
      return (
        <div>
          <Text size="sm" fw={500} mb={4}>
            {label}
          </Text>
          <Rating count={field.maxRating ?? 5} value={Number(value) || 0} onChange={(v) => onChange(String(v))} />
        </div>
      );
    case 'file':
      return <FileInput {...base} onChange={(file) => onChange(file?.name ?? '')} />;
    default:
      return text();
  }
}
