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
  Slider,
  Divider,
  Text,
  Title,
  Box,
  Chip,
} from '@mantine/core';
import { IconMail, IconPhone, IconWorld, IconCurrencyDollar } from '@tabler/icons-react';
import type { FormField, FieldSize } from '@/types';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}

const sizeWidth: Record<FieldSize, string> = {
  small: '35%',
  medium: '60%',
  large: '100%',
};

/** Live, respondent-facing control for one field. */
export function FieldControl({ field, value, onChange }: Props) {
  const label = field.hideLabel ? undefined : (
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
    description: field.instructions,
    required: field.required,
    placeholder: field.placeholder,
    title: field.hoverText,
    style: { maxWidth: sizeWidth[field.size ?? 'large'] },
  };

  const text = (extra?: Record<string, unknown>) => (
    <TextInput
      {...base}
      {...extra}
      maxLength={field.maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  const number = (extra?: Record<string, unknown>) => (
    <NumberInput
      {...base}
      {...extra}
      min={field.min}
      max={field.max}
      value={value}
      onChange={(v) => onChange(String(v))}
    />
  );

  switch (field.type) {
    case 'name': {
      const [first = '', last = ''] = value.split(' ');
      return (
        <div>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Group grow style={base.style}>
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
      return (
        <Textarea
          {...base}
          maxLength={field.maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autosize
          minRows={3}
        />
      );
    case 'regex':
      return text({ pattern: field.pattern });
    case 'number':
      return number();
    case 'decimal':
      return number({ decimalScale: 2 });
    case 'currency':
      return number({ decimalScale: 2, leftSection: <IconCurrencyDollar size={16} /> });
    case 'select':
      return <Select {...base} data={field.options ?? []} value={value} onChange={(v) => onChange(v ?? '')} />;
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
    case 'multipleChoice': {
      const selected = value ? value.split(', ') : [];
      return (
        <div>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Chip.Group multiple value={selected} onChange={(v) => onChange(v.join(', '))}>
            <Group gap="xs">
              {(field.options ?? []).map((opt) => (
                <Chip key={opt} value={opt}>
                  {opt}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
      );
    }
    case 'date':
      return text({ type: 'date' });
    case 'time':
      return text({ type: 'time' });
    case 'datetime':
      return text({ type: 'datetime-local' });
    case 'monthYear':
      return text({ type: 'month' });
    case 'file':
    case 'imageUpload':
    case 'mediaUpload':
      return (
        <FileInput
          {...base}
          accept={
            field.type === 'imageUpload'
              ? 'image/*'
              : field.type === 'mediaUpload'
                ? 'audio/*,video/*'
                : undefined
          }
          onChange={(file) => onChange(file?.name ?? '')}
        />
      );
    case 'rating':
      return (
        <div>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Rating count={field.maxRating ?? 5} value={Number(value) || 0} onChange={(v) => onChange(String(v))} />
        </div>
      );
    case 'slider':
      return (
        <div style={base.style}>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Slider
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={Number(value) || field.min || 0}
            onChange={(v) => onChange(String(v))}
          />
        </div>
      );
    case 'terms':
      return (
        <Stack gap="xs">
          <Box
            p="xs"
            style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 'var(--mantine-radius-sm)',
              maxHeight: 140,
              overflow: 'auto',
            }}
          >
            <Text size="xs" c="dimmed">
              {field.content}
            </Text>
          </Box>
          <Checkbox
            label={field.label || 'I accept the terms and conditions'}
            required={field.required}
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
          />
        </Stack>
      );
    case 'decisionBox':
      return (
        <Checkbox
          label={field.content || field.label}
          required={field.required}
          checked={value === 'true'}
          onChange={(e) => onChange(String(e.target.checked))}
        />
      );
    case 'yesNo':
      return (
        <Radio.Group {...base} value={value} onChange={onChange}>
          <Group gap="lg" mt="xs">
            <Radio value="yes" label="Yes" />
            <Radio value="no" label="No" />
          </Group>
        </Radio.Group>
      );
    case 'uniqueId':
    case 'randomId':
      return <TextInput {...base} readOnly value={value} />;
    case 'heading':
      return <Title order={4}>{field.content || field.label}</Title>;
    case 'description':
      return (
        <Text size="sm" c="dimmed">
          {field.content || field.label}
        </Text>
      );
    case 'divider':
      return <Divider my="xs" />;
    case 'spacer':
      return <Box h={32} />;
    default:
      return text();
  }
}
