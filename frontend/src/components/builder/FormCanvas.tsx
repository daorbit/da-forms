import {
  Box, Stack, Text, Paper, Title, ActionIcon, Tooltip, MantineProvider,
} from '@mantine/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { IconTrash, IconSettings, IconCopyPlus, IconEyeOff } from '@tabler/icons-react';
import type { FormField } from '@/types';
import { staticTypes } from '@/lib/fieldPalette';
import { FieldPreview } from './FieldPreview';
import { SortableField } from './SortableField';
import { GridColumn } from './GridColumn';
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
  // The card itself accepts drops, so a field can be added to an empty form
  // and dropped past the last row rather than only between existing ones.
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({ id: 'root' });

  function renderField(field: FormField) {
    const isStatic = staticTypes.includes(field.type);
    const isGrid = field.type === 'grid';

    return (
      <SortableField
        key={field.id}
        field={field}
        className={`${classes.fieldRow} ${selectedId === field.id ? classes.fieldRowSelected : ''}`}
        onClick={() => {
          onSelect(field.id);
          if (!isGrid) onOpenProperties(field.id);
        }}
      >
        {isGrid ? (
          <div
            className={classes.grid}
            style={{ gridTemplateColumns: `repeat(${field.columns?.length ?? 1}, 1fr)` }}
          >
            {(field.columns ?? []).map((column, columnIndex) => (
              <GridColumn
                key={columnIndex}
                gridId={field.id}
                columnIndex={columnIndex}
                fields={column}
              >
                {column.map(renderField)}
              </GridColumn>
            ))}
          </div>
        ) : isStatic ? (
          <FieldPreview field={field} />
        ) : (
          <>
            {!field.hideLabel && (
              <Text size="sm" fw={600} mb={2}>
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
              <Text size="xs" c="dimmed" mb={6}>
                {field.instructions}
              </Text>
            )}
            <Box mt={8}>
              <FieldPreview field={field} />
            </Box>
          </>
        )}

        <Stack gap={0} className={classes.hoverToolbar}>
          {!isGrid && (
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
          )}
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
      </SortableField>
    );
  }

  return (
    <Box className={classes.canvasScroll}>
      <Box className={`${classes.canvasArea} ${offsetRight ? classes.canvasAreaOffset : ''}`}>
        {/*
          A nested provider rather than a data attribute: the attribute alone
          does not re-emit Mantine's variables, so inputs inside kept the host's
          dark palette. The card is a preview of the live form and has to look
          the way respondents will see it, whatever theme the host passes.
        */}
        <MantineProvider
          forceColorScheme="light"
          cssVariablesSelector=".da-forms-light-surface"
          // Without this the nested provider also writes its light variables
          // onto <html>, repainting the whole editor around the card.
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

                  <Stack gap={0} className={classes.hoverToolbar}>
                    <Tooltip label="Form properties" position="left" withArrow>
                      <ActionIcon
                        variant="filled"
                        color="dark"
                        radius={0}
                        size="lg"
                        onClick={onOpenFormSettings}
                      >
                        <IconSettings size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Hide header" position="left" withArrow>
                      <ActionIcon
                        variant="filled"
                        color="red"
                        radius={0}
                        size="lg"
                        onClick={onHideHeader}
                      >
                        <IconEyeOff size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Stack>
                </Box>
              )}

              <div
                ref={setRootRef}
                className={`${classes.rootDrop} ${isOverRoot ? classes.rootDropOver : ''}`}
              >
                <SortableContext
                  id="root"
                  items={fields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.length === 0 ? (
                    <Box className={classes.emptyState}>
                      <Text c="dimmed" size="sm">
                        No fields yet
                      </Text>
                      <Text c="dimmed" size="xs" mt={4}>
                        Drag a field from the left panel, or click one to add it.
                      </Text>
                    </Box>
                  ) : (
                    fields.map(renderField)
                  )}
                </SortableContext>
              </div>
            </Paper>
          </div>
        </MantineProvider>
      </Box>
    </Box>
  );
}
