import type { FormField } from '@/types';

/**
 * What a drag carries.
 *
 * A palette tile creates a field on drop; a canvas row moves the field it
 * already is. Both land on the same drop targets, so the difference lives in
 * the payload rather than in two parallel sets of handlers.
 */
export type DragData =
  | { kind: 'palette'; paletteKey: string }
  | { kind: 'field'; field: FormField };

/** Where a drop can land: the root list, or one column of one grid. */
export type DropTarget =
  | { kind: 'root'; index: number }
  | { kind: 'column'; gridId: string; columnIndex: number; index: number };

export function columnDroppableId(gridId: string, columnIndex: number): string {
  return `column:${gridId}:${columnIndex}`;
}

export function parseColumnDroppableId(
  id: string
): { gridId: string; columnIndex: number } | null {
  const parts = id.split(':');
  if (parts[0] !== 'column' || parts.length !== 3) return null;
  return { gridId: parts[1], columnIndex: Number(parts[2]) };
}
