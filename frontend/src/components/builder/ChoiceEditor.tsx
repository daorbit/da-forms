import { ActionIcon, Button, Stack, TextInput } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';

interface Props {
  options: string[];
  onChange: (options: string[]) => void;
}

/**
 * One row per choice, rather than a textarea of newline-separated text.
 *
 * The textarea made every edit a whole-list edit: reordering meant retyping,
 * an accidental blank line became a blank choice, and there was no place to
 * report that one specific choice was empty. A row owns its own value, its own
 * delete, and its own error.
 */
export function ChoiceEditor({ options, onChange }: Props) {
  // A field that has never had its choices touched still edits as one empty
  // row, so the first thing on screen is somewhere to type.
  const rows = options.length ? options : [''];

  const update = (index: number, value: string) =>
    onChange(rows.map((opt, i) => (i === index ? value : opt)));

  // Removing the last remaining row leaves one empty row rather than nothing:
  // a choice field with no choices renders as an empty control on the form.
  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : ['']);
  };

  const duplicate = (value: string, index: number) =>
    value.trim().length > 0 &&
    rows.some((opt, i) => i !== index && opt.trim() === value.trim());

  return (
    <Stack gap="xs">
      {rows.map((opt, index) => (
        <TextInput
          key={index}
          value={opt}
          placeholder={`Choice ${index + 1}`}
          onChange={(e) => update(index, e.target.value)}
          error={duplicate(opt, index) ? 'Already used' : undefined}
          rightSection={
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={`Remove choice ${index + 1}`}
              onClick={() => remove(index)}
            >
              <IconX size={15} />
            </ActionIcon>
          }
        />
      ))}

      <Button
        variant="subtle"
        color="emerald"
        size="compact-sm"
        leftSection={<IconPlus size={15} />}
        onClick={() => onChange([...rows, ''])}
        style={{ alignSelf: 'flex-end' }}
      >
        Add another
      </Button>
    </Stack>
  );
}
