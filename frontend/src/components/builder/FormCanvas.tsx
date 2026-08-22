import { Box, Stack, Text, Paper, Title, ActionIcon, Group } from '@mantine/core';
import { IconTrash, IconSettings, IconCopyPlus } from '@tabler/icons-react';
import type { FormField } from '@/types';
import { staticTypes } from '@/lib/fieldPalette';
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
  onOpenProperties: (id: string) => void;
  onOpenFormSettings: () => void;
  /** Shifts the card clear of the properties drawer while it is open. */
  offsetRight?: boolean;
}

export function FormCanvas({
  title,
  description,
  fields,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onOpenProperties,
  onOpenFormSettings,
  offsetRight = false,
}: Props) {
  return (
    <Box className={classes.canvasScroll}>
      <Box className={`${classes.canvasArea} ${offsetRight ? classes.canvasAreaOffset : ''}`}>
      <Paper className={classes.formCard} radius="md" withBorder>
        <Box className={`${classes.fieldRow} ${classes.header}`}>
          <Title order={3} ta="center">
            {title || 'Untitled form'}
          </Title>
          {description && (
            <Text c="dimmed" size="sm" ta="center" mt={4}>
              {description}
            </Text>
          )}

          <Stack gap={0} className={classes.hoverToolbar}>
            <ActionIcon variant="filled" color="dark" radius={0} size="lg" onClick={onOpenFormSettings}>
              <IconSettings size={16} />
            </ActionIcon>
          </Stack>
        </Box>

        <Stack gap={0}>
          {fields.length === 0 && (
            <Box className={classes.emptyState}>
              <Text c="dimmed" size="sm">
                No fields yet
              </Text>
              <Text c="dimmed" size="xs" mt={4}>
                Pick a field type from the left panel to start building.
              </Text>
            </Box>
          )}

          {fields.map((field) => {
            const isStatic = staticTypes.includes(field.type);

            return (
              <Box
                key={field.id}
                className={`${classes.fieldRow} ${selectedId === field.id ? classes.fieldRowSelected : ''}`}
                onClick={() => {
                  onSelect(field.id);
                  onOpenProperties(field.id);
                }}
              >
                {isStatic ? (
                  <FieldPreview field={field} />
                ) : (
                  <Group align="flex-start" wrap="nowrap" gap="sm">
                    <Box className={classes.fieldLabel}>
                      {!field.hideLabel && (
                        <Text size="sm" fw={500}>
                          {field.label || 'Untitled field'}
                          {field.required && (
                            <Text span c="red">
                              {' '}
                              *
                            </Text>
                          )}
                        </Text>
                      )}
                      {field.instructions && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {field.instructions}
                        </Text>
                      )}
                    </Box>

                    <Box className={classes.fieldInput}>
                      <FieldPreview field={field} />
                    </Box>
                  </Group>
                )}

                <Stack gap={0} className={classes.hoverToolbar}>
                  <ActionIcon
                    variant="filled"
                    color="dark"
                    radius={0}
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProperties(field.id);
                    }}
                  >
                    <IconSettings size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="filled"
                    color="dark"
                    radius={0}
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(field.id);
                    }}
                  >
                    <IconCopyPlus size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="filled"
                    color="red"
                    radius={0}
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(field.id);
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Paper>
      </Box>
    </Box>
  );
}
