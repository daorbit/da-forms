import { Stack, TextInput, Select, Switch, Textarea, Text, Box, NumberInput, Divider, Group, ThemeIcon } from '@mantine/core';
import type { FormField, FieldType } from '@/types';
import { fieldPalette, paletteByType } from '@/lib/fieldPalette';

interface Props {
  field: FormField | null;
  onChange: (id: string, patch: Partial<FormField>) => void;
}

const typeOptions = fieldPalette.map((group) => ({
  group: group.group,
  items: group.items.map((item) => ({ value: item.type, label: item.label })),
}));

const optionTypes: FieldType[] = ['select', 'radio', 'checkbox'];
const numericTypes: FieldType[] = ['number', 'decimal', 'currency'];

export function FieldSettings({ field, onChange }: Props) {
  if (!field) {
    return (
      <Box p="md">
        <Text size="sm" c="dimmed">
          Select a field to edit its properties
        </Text>
      </Box>
    );
  }

  const meta = paletteByType[field.type];

  return (
    <Stack gap="md" p="md">
      <Group gap="xs">
        <ThemeIcon variant="light" color={meta.color} size="sm" radius="sm">
          <meta.icon size={14} />
        </ThemeIcon>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          {meta.label} properties
        </Text>
      </Group>

      <Divider />

      <TextInput
        label="Label"
        value={field.label}
        onChange={(e) => onChange(field.id, { label: e.target.value })}
      />

      <Select
        label="Type"
        value={field.type}
        data={typeOptions}
        onChange={(value) => value && onChange(field.id, { type: value as FieldType })}
      />

      <TextInput
        label="Placeholder"
        value={field.placeholder ?? ''}
        onChange={(e) => onChange(field.id, { placeholder: e.target.value })}
      />

      <TextInput
        label="Help text"
        value={field.helpText ?? ''}
        onChange={(e) => onChange(field.id, { helpText: e.target.value })}
      />

      {optionTypes.includes(field.type) && (
        <Textarea
          label="Options"
          description="One option per line"
          value={(field.options ?? []).join('\n')}
          onChange={(e) =>
            onChange(field.id, { options: e.target.value.split('\n').filter(Boolean) })
          }
          autosize
          minRows={3}
        />
      )}

      {field.type === 'regex' && (
        <TextInput
          label="Pattern"
          description="Regular expression respondents must match"
          value={field.pattern ?? ''}
          onChange={(e) => onChange(field.id, { pattern: e.target.value })}
        />
      )}

      {numericTypes.includes(field.type) && (
        <Group grow>
          <NumberInput
            label="Min"
            value={field.min ?? ''}
            onChange={(value) => onChange(field.id, { min: value === '' ? undefined : Number(value) })}
          />
          <NumberInput
            label="Max"
            value={field.max ?? ''}
            onChange={(value) => onChange(field.id, { max: value === '' ? undefined : Number(value) })}
          />
        </Group>
      )}

      {field.type === 'rating' && (
        <NumberInput
          label="Number of stars"
          min={2}
          max={10}
          value={field.maxRating ?? 5}
          onChange={(value) => onChange(field.id, { maxRating: Number(value) || 5 })}
        />
      )}

      <Divider />

      <Switch
        label="Required"
        checked={field.required}
        onChange={(e) => onChange(field.id, { required: e.target.checked })}
      />
    </Stack>
  );
}
