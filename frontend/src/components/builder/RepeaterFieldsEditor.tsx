import { ActionIcon, Button, Group, Paper, Select, Stack, Switch, TextInput } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '@tabler/icons-react';
import type { FieldType, FormField } from '@/types';
import { makeField, optionTypes, paletteByType, repeaterSubTypes } from '@/lib/fieldPalette';
import { ChoiceEditor } from './ChoiceEditor';

interface Props {
  subFields: FormField[];
  onChange: (subFields: FormField[]) => void;
}

const typeOptions = repeaterSubTypes.map((t) => ({ value: t, label: paletteByType[t]?.label ?? t }));

export function RepeaterFieldsEditor({ subFields, onChange }: Props) {
  const patch = (index: number, next: Partial<FormField>) =>
    onChange(subFields.map((sf, i) => (i === index ? { ...sf, ...next } : sf)));

  const remove = (index: number) => onChange(subFields.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= subFields.length) return;
    const next = [...subFields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const add = () => {
    const created = makeField('text');
    created.label = `Field ${subFields.length + 1}`;
    onChange([...subFields, created]);
  };

  const changeType = (index: number, type: FieldType) => {
    const base = makeField(type);
    base.id = subFields[index].id;
    base.label = subFields[index].label;
    base.required = subFields[index].required;
    onChange(subFields.map((sf, i) => (i === index ? base : sf)));
  };

  return (
    <Stack gap="sm">
      {subFields.map((sf, index) => (
        <Paper key={sf.id} withBorder radius="md" p="sm">
          <Group gap="xs" wrap="nowrap" mb="xs">
            <TextInput
              style={{ flex: 1 }}
              placeholder="Field label"
              value={sf.label}
              onChange={(e) => patch(index, { label: e.target.value })}
            />
            <ActionIcon variant="subtle" color="gray" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move up">
              <IconChevronUp size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => move(index, index + 1)}
              disabled={index === subFields.length - 1}
              aria-label="Move down"
            >
              <IconChevronDown size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => remove(index)}
              disabled={subFields.length <= 1}
              aria-label="Remove field"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>

          <Group grow align="flex-start">
            <Select
              label="Type"
              data={typeOptions}
              value={sf.type}
              allowDeselect={false}
              onChange={(v) => v && changeType(index, v as FieldType)}
            />
            <Switch
              label="Required"
              mt="lg"
              checked={sf.required}
              onChange={(e) => patch(index, { required: e.target.checked })}
            />
          </Group>

          {optionTypes.includes(sf.type) && (
            <Stack gap={4} mt="xs">
              <ChoiceEditor options={sf.options ?? []} onChange={(options) => patch(index, { options })} />
            </Stack>
          )}
        </Paper>
      ))}

      <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={add}>
        Add field
      </Button>
    </Stack>
  );
}
