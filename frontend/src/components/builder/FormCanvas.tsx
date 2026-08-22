import {
  Box, Stack, Text, Paper, Title, ActionIcon, Group, Tooltip, MantineProvider,
} from '@mantine/core';
import { IconTrash, IconSettings, IconCopyPlus, IconEyeOff } from '@tabler/icons-react';
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
  hideHeader?: boolean;
  onHideHeader: () => void;
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
  hideHeader = false,
  onHideHeader,
  offsetRight = false,
}: Props) {
  return (
    <Box className={classes.canvasScroll}>
      <Box className={`${classes.canvasArea} ${offsetRight ? classes.canvasAreaOffset : ''}`}>
      {/*
        A nested provider rather than a data attribute: the attribute alone does
        not re-emit Mantine's variables, so inputs inside kept the host's dark
        palette. The card is a preview of the live form and has to look the way
        respondents will see it, whatever theme the host passes.
      */}
      <MantineProvider
        forceColorScheme="light"
        cssVariablesSelector=".da-forms-light-surface"
        // Without this the nested provider also writes its light variables onto
        // <html>, which repaints the whole editor around the card.
        getRootElement={() => undefined}
      >
      <div className="da-forms-light-surface">
      <Paper className={classes.formCard} radius="md" withBorder>
        {!hideHeader && (
          <Box className={`${classes.fieldRow} ${classes.header}`}>
            <Title order={3} ta="center">
              {title || 'Untitled form'}
            </Title>
            {description && (
              <Text c="dimmed" size="sm" ta="center" mt={4}>
                {description}
              </Text>
            )}

            <Stack gap={6} className={classes.hoverToolbar}>
              <Tooltip label="Form properties" position="left" withArrow>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  radius="md"
                  size="lg"
                  onClick={onOpenFormSettings}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Hide header" position="left" withArrow>
                <ActionIcon variant="filled" color="red" radius="md" size="lg" onClick={onHideHeader}>
                  <IconEyeOff size={16} />
                </ActionIcon>
              </Tooltip>
            </Stack>
          </Box>
        )}

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

                <Stack gap={6} className={classes.hoverToolbar}>
                  <ActionIcon
                    variant="filled"
                    color="dark"
                    radius="md"
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
                    radius="md"
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
                    radius="md"
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
      </div>
      </MantineProvider>
      </Box>
    </Box>
  );
}
