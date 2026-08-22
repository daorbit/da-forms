import { useDraggable } from '@dnd-kit/core';
import type { PaletteItem } from '@/lib/fieldPalette';
import { paletteKey } from '@/lib/fieldPalette';
import classes from './FieldPalette.module.css';

/**
 * One palette tile: draggable onto the canvas, and clickable to append.
 *
 * Both because dragging is the precise gesture and clicking is the fast one —
 * making people drag to add a field they just want at the end is a cost with
 * nothing bought.
 */
export function PaletteTile({
  item,
  onAdd,
}: {
  item: PaletteItem;
  onAdd: () => void;
}) {
  const key = paletteKey(item);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${key}`,
    data: { kind: 'palette', paletteKey: key },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`${classes.paletteItem} ${isDragging ? classes.paletteItemDragging : ''}`}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      <item.icon size={24} stroke={1.5} color={`var(--mantine-color-${item.color}-6)`} />
      <span className={classes.itemLabel}>{item.label}</span>
    </button>
  );
}
