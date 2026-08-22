import {
  Box, Stack, Text, Paper, Title, ActionIcon, Tooltip,
} from '@mantine/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { IconTrash, IconSettings, IconCopyPlus, IconEyeOff, IconPlus } from '@tabler/icons-react';
import type { FormField, FormTheme } from '@/types';
import { staticTypes } from '@/lib/fieldPalette';
import { FieldControl } from '@/components/FieldControl';
import { resolveTextColor } from '@/lib/formTheme';
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
  theme?: FormTheme;
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
  theme,
}: Props) {
  // The card itself accepts drops, so a field can be added to an empty form
  // and dropped past the last row rather than only between existing ones.
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({ id: 'root' });
  const textColor = resolveTextColor(theme);
  const labelColor = theme?.labelColor ?? textColor;

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
          <FieldControl field={field} value="" onChange={() => {}} readOnly hideLabel labelColor={labelColor} />
        ) : (
          <>
            {!field.hideLabel && (
              <Text size="sm" fw={600} mb={2} style={labelColor ? { color: labelColor } : undefined}>
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
              <FieldControl field={field} value="" onChange={() => {}} readOnly hideLabel labelColor={labelColor} />
            </Box>
          </>
        )}

        <Stack gap={2} p={4} className={classes.hoverToolbar}>
          {!isGrid && (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="md"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProperties(field.id);
              }}
              aria-label="Field settings"
            >
              <IconSettings size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="md"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(field.id);
            }}
            aria-label="Duplicate field"
          >
            <IconCopyPlus size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            radius="md"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            aria-label="Delete field"
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
          The card is a preview of the live form, so it keeps the respondent's
          own light-mode base (never the builder's own theme) — but the
          form's own custom theme colors, when set, apply on top of that base
          exactly as they will on the public page. `data-mantine-color-scheme`
          scopes Mantine's own light variables to this subtree; the stylesheet
          adds the few surfaces that attribute does not cover.
        */}
        <div className="da-forms-light-surface" data-mantine-color-scheme="light">
            <Paper
              className={classes.formCard}
              radius="md"
              withBorder
              style={{
                backgroundColor: theme?.cardBg,
                borderColor: theme?.cardBorder,
                color: textColor,
              }}
            >
              {!hideHeader && (
                <Box className={`${classes.fieldRow} ${classes.header}`}>
                  <Title order={3} ta="center" c={textColor}>
                    {title || 'Untitled form'}
                  </Title>
                  {description && (
                    <Text
                      size="sm"
                      ta="center"
                      mt={4}
                      c={textColor ? undefined : 'dimmed'}
                      style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
                    >
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
                    // The empty state is the drop zone itself, so it reads as
                    // somewhere to aim rather than as a notice about absence.
                    <Box className={classes.emptyState}>
                      <div className={classes.emptyIcon}>
                        <IconPlus size={20} />
                      </div>
                      <Text size="sm" fw={500} mt="sm">
                        Drag a field here
                      </Text>
                      <Text c="dimmed" size="xs" mt={4}>
                        Or click any field in the left panel to add it.
                      </Text>
                    </Box>
                  ) : (
                    fields.map(renderField)
                  )}
                </SortableContext>
              </div>
            </Paper>
        </div>
      </Box>
    </Box>
  );
}
