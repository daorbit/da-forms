import { Fragment } from 'react';
import { Box, Stack, Text, Paper, Title, ActionIcon } from '@mantine/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CopyPlusIcon, SettingsIcon, Trash2Icon } from 'lucide-react';
import type {
  FieldType,
  FormField,
  FormTheme,
  SubmitButtonAlign,
  SubmitButtonSize,
  SubmitButtonWidth,
} from '@/types';
import { staticTypes, type PaletteItem } from '@/lib/fieldPalette';
import { FieldControl } from '@/components/FieldControl';
import { resolveTextColor } from '@/lib/formTheme';
import { SortableField } from './SortableField';
import { GridColumn } from './GridColumn';
import { skinAttributes, skinVars } from '@/lib/formSkin';
import { cardSurfaceStyle, pageSurfaceStyle } from '@/lib/formBackground';
import { useFormFont } from '@/hooks/useFormFont';
import { CanvasHeader } from './canvas/CanvasHeader';
import { CanvasSubmit } from './canvas/CanvasSubmit';
import { EmptyCanvas } from './canvas/EmptyCanvas';
import { InlineText } from './canvas/InlineText';
import { InsertGap } from './canvas/InsertGap';
import skinClasses from '@/components/FormSkin.module.css';
import classes from './FormCanvas.module.css';

interface Props {
  title: string;
  description?: string;
  fields: FormField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeselect?: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenProperties: (id: string) => void;
  onOpenFormSettings: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFieldChange: (id: string, patch: Partial<FormField>) => void;
  onInsertAt: (item: PaletteItem, index: number) => void;
  onQuickAdd: (type: FieldType) => void;
  onAskAi: () => void;
  onOpenInsert: () => void;
  submitLabel: string;
  onSubmitLabelChange: (value: string) => void;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  submitButtonSize?: SubmitButtonSize;
  hideHeader?: boolean;
  headerAlign?: SubmitButtonAlign;
  onHideHeader: () => void;
  offsetRight?: boolean;
  theme?: FormTheme;
}

const TOOLBAR_ICON = { color: '#495057' };

export function FormCanvas({
  title,
  description,
  fields,
  selectedId,
  onSelect,
  onDeselect,
  onRemove,
  onDuplicate,
  onOpenProperties,
  onOpenFormSettings,
  onTitleChange,
  onDescriptionChange,
  onFieldChange,
  onInsertAt,
  onQuickAdd,
  onAskAi,
  onOpenInsert,
  submitLabel,
  onSubmitLabelChange,
  submitButtonWidth,
  submitButtonAlign,
  submitButtonSize,
  hideHeader = false,
  headerAlign,
  onHideHeader,
  offsetRight = false,
  theme,
}: Props) {
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({ id: 'root' });
  const textColor = resolveTextColor(theme);
  const labelColor = theme?.labelColor ?? textColor;
  useFormFont(theme?.fontFamily);

  const isDarkCard = textColor === '#f8f9fa';

  const control = (field: FormField) => (
    <FieldControl
      field={field}
      value=""
      onChange={() => {}}
      readOnly
      hideLabel
      labelColor={labelColor}
      inputBg={theme?.inputBg}
      inputBorder={theme?.inputBorder}
      inputTextColor={theme?.inputTextColor}
    />
  );

  function renderStatic(field: FormField) {
    const select = () => onSelect(field.id);
    if (field.type === 'heading') {
      return (
        <Title order={4} c={labelColor}>
          <InlineText
            multiline
            enterFinishes
            value={field.content ?? ''}
            onChange={(content) => onFieldChange(field.id, { content })}
            placeholder="Heading"
            ariaLabel="Heading text"
            onActivate={select}
          />
        </Title>
      );
    }
    if (field.type === 'description') {
      return (
        <Text size="sm" c={labelColor ? undefined : 'dimmed'} style={labelColor ? { color: labelColor, opacity: 0.75 } : undefined}>
          <InlineText
            multiline
            value={field.content ?? ''}
            onChange={(content) => onFieldChange(field.id, { content })}
            placeholder="Description text"
            ariaLabel="Description text"
            onActivate={select}
          />
        </Text>
      );
    }
    return control(field);
  }

  function renderField(field: FormField) {
    const isStatic = staticTypes.includes(field.type);
    const isGrid = field.type === 'grid';
    const isSelected = selectedId === field.id;

    return (
      <SortableField
        key={field.id}
        field={field}
        className={`${classes.fieldRow} ${isSelected ? classes.fieldRowSelected : ''} ${isDarkCard ? classes.fieldRowDark : ''}`}
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
              <GridColumn key={columnIndex} gridId={field.id} columnIndex={columnIndex} fields={column}>
                {column.map(renderField)}
              </GridColumn>
            ))}
          </div>
        ) : isStatic ? (
          renderStatic(field)
        ) : (
          <>
            {!field.hideLabel && (
              <Text size="sm" fw={600} mb={2} style={labelColor ? { color: labelColor } : undefined}>
                <InlineText
                  value={field.label}
                  onChange={(label) => onFieldChange(field.id, { label })}
                  placeholder="Untitled field"
                  ariaLabel="Field label"
                  onActivate={() => onSelect(field.id)}
                />
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
            <Box mt={8}>{control(field)}</Box>
          </>
        )}

        <Stack gap={2} p={4} className={classes.hoverToolbar}>
          {!isGrid && (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="md"
              size="lg"
              style={TOOLBAR_ICON}
              onClick={(e) => {
                e.stopPropagation();
                onOpenProperties(field.id);
              }}
              aria-label="Field settings"
            >
              <SettingsIcon size={16} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="md"
            size="lg"
            style={TOOLBAR_ICON}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(field.id);
            }}
            aria-label="Duplicate field"
          >
            <CopyPlusIcon size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            radius="md"
            size="lg"
            style={{ color: '#e03131' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            aria-label="Delete field"
          >
            <Trash2Icon size={16} />
          </ActionIcon>
        </Stack>
      </SortableField>
    );
  }

  return (
    <Box
      className={classes.canvasScroll}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDeselect?.();
      }}
    >
      <Box
        className={`${classes.canvasArea} ${offsetRight ? classes.canvasAreaOffset : ''}`}
        style={theme?.scope === 'card' ? undefined : pageSurfaceStyle(theme)}
        onClick={(e) => {
          if (e.target === e.currentTarget) onDeselect?.();
        }}
      >
        <div className="da-forms-light-surface" data-mantine-color-scheme="light">
          <Paper
            className={`${classes.formCard} ${skinClasses.skin}`}
            radius="md"
            withBorder
            {...skinAttributes(theme)}
            style={{
              ...skinVars(theme),
              ...cardSurfaceStyle(theme),
              color: textColor,
            }}
          >
            {!hideHeader && (
              <CanvasHeader
                title={title}
                description={description}
                onTitleChange={onTitleChange}
                onDescriptionChange={onDescriptionChange}
                onOpenFormSettings={onOpenFormSettings}
                onHideHeader={onHideHeader}
                headerAlign={headerAlign}
                theme={theme}
                textColor={textColor}
                isDarkCard={isDarkCard}
              />
            )}

            <div ref={setRootRef} className={`${classes.rootDrop} ${isOverRoot && fields.length > 0 ? classes.rootDropOver : ''}`}>
              <SortableContext id="root" items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                {fields.length === 0 ? (
                  <EmptyCanvas isOver={isOverRoot} onAskAi={onAskAi} onOpenInsert={onOpenInsert} onQuickAdd={onQuickAdd} />
                ) : (
                  <>
                    {fields.map((field, index) => (
                      <Fragment key={field.id}>
                        <InsertGap onPick={(item) => onInsertAt(item, index)} />
                        {renderField(field)}
                      </Fragment>
                    ))}
                    <InsertGap onPick={(item) => onInsertAt(item, fields.length)} />
                  </>
                )}
              </SortableContext>
            </div>

            {fields.length > 0 && (
              <CanvasSubmit
                label={submitLabel}
                onChange={onSubmitLabelChange}
                theme={theme}
                width={submitButtonWidth}
                align={submitButtonAlign}
                size={submitButtonSize}
              />
            )}
          </Paper>
        </div>
      </Box>
    </Box>
  );
}
