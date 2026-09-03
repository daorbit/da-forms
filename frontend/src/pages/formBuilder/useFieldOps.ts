import { notifications } from '@mantine/notifications';
import type { DragEndEvent } from '@dnd-kit/core';
import type { FieldType, FormField } from '@/types';
import { makeField, paletteByKey } from '@/lib/fieldPalette';
import {
  cloneWithNewIds,
  findField,
  insertIntoColumn,
  locateField,
  removeFromTree,
  updateInTree,
} from '@/lib/fieldTree';
import { findPaymentField } from '@/lib/payment';
import { parseColumnDroppableId, type DragData } from '@/components/builder/dnd';

interface Params {
  fields: FormField[];
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  setDragging: React.Dispatch<React.SetStateAction<DragData | null>>;
}


export function useFieldOps({
  fields,
  setFields,
  selectedId,
  setSelectedId,
  editingId,
  setEditingId,
  setDragging,
}: Params) {

  function refusesSecondPayment(type: FieldType): boolean {
    if (type !== 'payment' || !findPaymentField(fields)) return false;
    notifications.show({
      message: 'A form can only take one payment. Edit the payment field you already have.',
      color: 'orange',
    });
    return true;
  }

  function addField(type: FieldType, columns?: number) {
    if (refusesSecondPayment(type)) return;
    const field = makeField(type, columns);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => updateInTree(prev, id, patch));
  }

  function removeField(id: string) {
    const next = removeFromTree(fields, id);
    setFields(next);
    if (selectedId && !findField(next, selectedId)) setSelectedId(null);
    if (editingId && !findField(next, editingId)) setEditingId(null);
  }

  function duplicateField(id: string) {
    setFields((prev) => {
      const source = findField(prev, id);
      if (!source) return prev;
      if (source.type === 'payment') {
        notifications.show({
          message: 'A form can only take one payment.',
          color: 'orange',
        });
        return prev;
      }

      const copy = cloneWithNewIds(source);
      const place = locateField(prev, id);
      if (place && 'gridId' in place) {
        return insertIntoColumn(prev, place.gridId, place.columnIndex, copy, place.index + 1);
      }
      const index = prev.findIndex((f) => f.id === id);
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (!over) return;

    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const field =
      data.kind === 'palette'
        ? (() => {
            const item = paletteByKey[data.paletteKey];
            if (!item || refusesSecondPayment(item.type)) return null;
            return makeField(item.type, item.columns);
          })()
        : data.field;
    if (!field) return;

    const overColumn = parseColumnDroppableId(String(over.id));
    if ((field.type === 'grid' || field.type === 'pageBreak') && overColumn) return;

    setFields((prev) => {
      const without = data.kind === 'field' ? removeFromTree(prev, field.id) : prev;

      if (overColumn) {
        return insertIntoColumn(without, overColumn.gridId, overColumn.columnIndex, field);
      }
      const overPlace = locateField(without, String(over.id));
      if (overPlace && 'gridId' in overPlace) {
        return insertIntoColumn(
          without,
          overPlace.gridId,
          overPlace.columnIndex,
          field,
          overPlace.index
        );
      }
      if (overPlace) {
        const next = [...without];
        next.splice(overPlace.index, 0, field);
        return next;
      }

      // The card itself: append.
      return [...without, field];
    });

    setSelectedId(field.id);
  }

  return { refusesSecondPayment, addField, updateField, removeField, duplicateField, handleDragEnd };
}
