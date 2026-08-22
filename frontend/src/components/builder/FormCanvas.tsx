import { Box, Stack, Text, Paper, Title, ActionIcon, Group } from '@mantine/core';
import { IconTrash, IconGripVertical, IconCopy } from '@tabler/icons-react';
import type { FormField } from '@/types';
import { FieldPreview } from './FieldPreview';
import classes from './FormCanvas.module.css';

interface Props {
  title: string;
  description?: string;
  fields: FormField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function FormCanvas({
  title,
  description,
  fields,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
}: Props) {
  return (
    <Box className={classes.canvasArea}>
      <Paper className={classes.formCard} radius="md" withBorder>
        <Box className={classes.header}>
          <Title order={3} ta="center">
            {title || 'Untitled form'}
          </Title>
          {description && (
            <Text c="dimmed" size="sm" ta="center" mt={4}>
              {description}
            </Text>
          )}
        </Box>

        <Stack gap={0}>
          {fields.length === 0 && (
            <Text c="dimmed" ta="center" py={60}>
              Click a field on the left to add it here
            </Text>
          )}

          {fields.map((field) => (
            <Group
              key={field.id}
              align="flex-start"
              className={`${classes.fieldRow} ${selectedId === field.id ? classes.fieldRowSelected : ''}`}
              onClick={() => onSelect(field.id)}
              wrap="nowrap"
              gap="sm"
            >
              <IconGripVertical size={16} className={classes.gripIcon} />

              <Box className={classes.fieldLabel}>
                <Text size="sm" fw={500}>
                  {field.label || 'Untitled field'}
                  {field.required && (
                    <Text span c="red">
                      {' '}
                      *
                    </Text>
                  )}
                </Text>
                {field.helpText && (
                  <Text size="xs" c="dimmed" mt={2}>
                    {field.helpText}
                  </Text>
                )}
              </Box>

              <Box className={classes.fieldInput}>
                <FieldPreview field={field} />
              </Box>

              <Group gap={4} className={classes.rowActions} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(field.id);
                  }}
                >
                  <IconCopy size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(field.id);
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
