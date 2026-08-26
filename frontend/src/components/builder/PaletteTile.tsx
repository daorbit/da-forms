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
  index = 0,
  accent,
}: {
  item: PaletteItem;
  onAdd: () => void;
  /** Position within its group, used to stagger the mount animation. */
  index?: number;
  /** The group's accent as bare `r, g, b`, so the stylesheet can vary alpha. */
  accent: string;
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
      style={{
        // Capped, or the last tiles in a long group animate in noticeably late.
        animationDelay: `${Math.min(index, 10) * 22}ms`,
        ['--tile-accent' as string]: accent,
      }}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      <span className={classes.itemIcon}>
        <item.icon size={18} stroke={1.6} />
      </span>
      <span className={classes.itemLabel}>{item.label}</span>
    </button>
  );
}
