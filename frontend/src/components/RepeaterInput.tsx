import { useMemo } from 'react';
import { ActionIcon, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { FormField, LabelPlacement } from '@/types';
import { FieldControl } from '@/components/FieldControl';
import { parseRepeaterRows, validateField } from '@/lib/formValidation';

export type RepeaterRow = Record<string, string>;

function emptyRow(subFields: FormField[]): RepeaterRow {
  const row: RepeaterRow = {};
  for (const sf of subFields) row[sf.id] = '';
  return row;
}

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  showErrors?: boolean;
  labelPlacement?: LabelPlacement;
  labelColor?: string;
  inputBg?: string;
  inputBorder?: string;
  inputTextColor?: string;
  accentColor?: string;
}

export function RepeaterInput({
  field,
  value,
  onChange,
  readOnly,
  showErrors,
  labelPlacement,
  labelColor,
  inputBg,
  inputBorder,
  inputTextColor,
  accentColor,
}: Props) {
  const subFields = field.subFields ?? [];
  const min = Math.max(field.minRows ?? (field.required ? 1 : 0), 0);
  const max = field.maxRows && field.maxRows > 0 ? field.maxRows : Infinity;

  const rows = useMemo(() => {
    const parsed = parseRepeaterRows(value);
    if (parsed.length < min && !readOnly) {
      return [...parsed, ...Array.from({ length: min - parsed.length }, () => emptyRow(subFields))];
    }
    return parsed;
  }, [value, min, readOnly, subFields]);

  function commit(next: RepeaterRow[]) {
    onChange(next.length > 0 ? JSON.stringify(next) : '');
  }

  function setCell(rowIndex: number, subId: string, cell: string) {
    commit(rows.map((row, i) => (i === rowIndex ? { ...row, [subId]: cell } : row)));
  }

  function addRow() {
    if (rows.length >= max) return;
    commit([...rows, emptyRow(subFields)]);
  }

  function removeRow(rowIndex: number) {
    if (rows.length <= min) return;
    commit(rows.filter((_, i) => i !== rowIndex));
  }

  if (subFields.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        This repeating group has no fields yet.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {rows.map((row, rowIndex) => (
        <Paper key={rowIndex} withBorder radius="md" p="sm" style={{ borderColor: inputBorder, background: inputBg }}>
          <Group justify="space-between" mb={rows.length > 1 || !readOnly ? 6 : 0}>
            <Text size="xs" fw={600} style={labelColor ? { color: labelColor, opacity: 0.7 } : { color: 'var(--mantine-color-dimmed)' }}>
              {(field.label || 'Item')} {rowIndex + 1}
            </Text>
            {!readOnly && rows.length > min && (
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label={`Remove ${rowIndex + 1}`}
                onClick={() => removeRow(rowIndex)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>
          <Stack gap="sm">
            {subFields.map((sf) => {
              const cell = row[sf.id] ?? '';
              const err = showErrors ? validateField(sf, cell) : '';
              return (
                <FieldControl
                  key={sf.id}
                  field={sf}
                  value={cell}
                  readOnly={readOnly}
                  error={err || undefined}
                  onChange={(v) => setCell(rowIndex, sf.id, v)}
                  labelPlacement={labelPlacement}
                  labelColor={labelColor}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputTextColor={inputTextColor}
                  accentColor={accentColor}
                />
              );
            })}
          </Stack>
        </Paper>
      ))}

      {!readOnly && rows.length < max && (
        <Box>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            color={accentColor ? undefined : 'emerald'}
            style={accentColor ? { color: accentColor } : undefined}
            onClick={addRow}
          >
            Add {field.label || 'another'}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
