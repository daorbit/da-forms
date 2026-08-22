import type { FormField } from '@/types';

/**
 * Fields form a tree once grids exist: a grid holds columns, and each column
 * holds fields. These walk it so callers do not each reimplement the recursion.
 */

/** Every field in document order, grids included, their children after them. */
export function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

/** Only the fields that collect a value — what a submission has columns for. */
export function valueFields(fields: FormField[]): FormField[] {
  return flattenFields(fields).filter((field) => field.type !== 'grid');
}

export function findField(fields: FormField[], id: string): FormField | null {
  return flattenFields(fields).find((field) => field.id === id) ?? null;
}

/** Returns a new tree with `id` patched wherever it sits. */
export function updateInTree(
  fields: FormField[],
  id: string,
  patch: Partial<FormField>
): FormField[] {
  return fields.map((field) => {
    if (field.id === id) return { ...field, ...patch };
    if (field.type === 'grid' && field.columns) {
      return {
        ...field,
        columns: field.columns.map((column) => updateInTree(column, id, patch)),
      };
    }
    return field;
  });
}

/** Returns a new tree without `id`, from whichever column it sits in. */
export function removeFromTree(fields: FormField[], id: string): FormField[] {
  return fields
    .filter((field) => field.id !== id)
    .map((field) =>
      field.type === 'grid' && field.columns
        ? { ...field, columns: field.columns.map((column) => removeFromTree(column, id)) }
        : field
    );
}

/** Inserts `field` into `columnId` at `index`, or at the end when index is -1. */
export function insertIntoColumn(
  fields: FormField[],
  gridId: string,
  columnIndex: number,
  field: FormField,
  index = -1
): FormField[] {
  return fields.map((current) => {
    if (current.id === gridId && current.type === 'grid' && current.columns) {
      const columns = current.columns.map((column, i) => {
        if (i !== columnIndex) return column;
        const next = [...column];
        next.splice(index < 0 ? next.length : index, 0, field);
        return next;
      });
      return { ...current, columns };
    }
    if (current.type === 'grid' && current.columns) {
      return {
        ...current,
        columns: current.columns.map((column) =>
          insertIntoColumn(column, gridId, columnIndex, field, index)
        ),
      };
    }
    return current;
  });
}

/**
 * A deep copy with fresh ids throughout.
 *
 * Duplicating a grid copies what is inside it too, and every one of those needs
 * its own id — two fields sharing one would be addressed together by both the
 * properties panel and dnd-kit.
 */
export function cloneWithNewIds(field: FormField): FormField {
  const copy: FormField = { ...field, id: crypto.randomUUID() };
  if (field.type === 'grid' && field.columns) {
    copy.columns = field.columns.map((column) => column.map(cloneWithNewIds));
  }
  return copy;
}

/** Where a field lives, so a drag can lift it out of the right place. */
export function locateField(
  fields: FormField[],
  id: string
): { gridId: string; columnIndex: number; index: number } | { index: number } | null {
  const topLevel = fields.findIndex((field) => field.id === id);
  if (topLevel !== -1) return { index: topLevel };

  for (const field of fields) {
    if (field.type !== 'grid' || !field.columns) continue;
    for (let columnIndex = 0; columnIndex < field.columns.length; columnIndex += 1) {
      const index = field.columns[columnIndex].findIndex((child) => child.id === id);
      if (index !== -1) return { gridId: field.id, columnIndex, index };
    }
  }
  return null;
}
