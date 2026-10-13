import { ActionIcon, Switch, Textarea, TextInput } from '@mantine/core';
import { ArrowDownIcon, ArrowUpIcon, CopyPlusIcon, Rows3Icon, Trash2Icon } from 'lucide-react';
import type { FormField } from '@/types';
import { optionTypes, paletteByType, staticTypes } from '@/lib/fieldPalette';
import { ChoiceEditor } from '@/components/builder/ChoiceEditor';
import classes from './mobileBuilder.module.css';

export interface FieldCardActions {
  onChange: (id: string, patch: Partial<FormField>) => void;
  onMove: (id: string, delta: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

interface Props extends FieldCardActions {
  field: FormField;
  first: boolean;
  last: boolean;
}

const TEXT_STATICS = new Set<FormField['type']>(['heading', 'description', 'richText']);

export function MobileFieldCard({ field, first, last, onChange, onMove, onDuplicate, onRemove }: Props) {
  const isGrid = field.type === 'grid';
  const item = paletteByType[field.type];
  const Icon = isGrid ? Rows3Icon : item?.icon;
  const isStatic = staticTypes.includes(field.type);

  return (
    <article className={classes.card} data-grid={isGrid || undefined}>
      <header className={classes.cardHead}>
        <span className={classes.cardType}>
          {Icon && <Icon size={14} strokeWidth={1.9} />}
          {isGrid ? 'Row' : (item?.label ?? field.type)}
        </span>
        <div className={classes.cardActions}>
          <ActionIcon variant="subtle" color="gray" radius="xl" disabled={first} onClick={() => onMove(field.id, -1)} aria-label="Move up">
            <ArrowUpIcon size={15} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" radius="xl" disabled={last} onClick={() => onMove(field.id, 1)} aria-label="Move down">
            <ArrowDownIcon size={15} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={() => onDuplicate(field.id)} aria-label="Duplicate">
            <CopyPlusIcon size={15} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" radius="xl" onClick={() => onRemove(field.id)} aria-label="Delete">
            <Trash2Icon size={15} />
          </ActionIcon>
        </div>
      </header>

      {isGrid ? (
        <div className={classes.nested}>
          {(field.columns ?? []).flatMap((column) =>
            column.map((child, i) => (
              <MobileFieldCard
                key={child.id}
                field={child}
                first={i === 0}
                last={i === column.length - 1}
                onChange={onChange}
                onMove={onMove}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
              />
            ))
          )}
        </div>
      ) : TEXT_STATICS.has(field.type) ? (
        <Textarea
          autosize
          minRows={1}
          value={field.content ?? ''}
          onChange={(e) => onChange(field.id, { content: e.currentTarget.value })}
          placeholder="Text"
          aria-label="Text"
        />
      ) : isStatic ? null : (
        <div className={classes.cardBody}>
          <TextInput
            value={field.label}
            onChange={(e) => onChange(field.id, { label: e.currentTarget.value })}
            placeholder="Question"
            aria-label="Question"
          />
          {optionTypes.includes(field.type) && (
            <ChoiceEditor options={field.options ?? []} onChange={(options) => onChange(field.id, { options })} />
          )}
          <Switch
            size="sm"
            label="Required"
            checked={field.required}
            onChange={(e) => onChange(field.id, { required: e.currentTarget.checked })}
          />
        </div>
      )}
    </article>
  );
}
