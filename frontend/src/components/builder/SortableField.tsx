import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField } from '@/types';
import classes from './FormCanvas.module.css';

/**
 * One draggable row.
 *
 * The whole row is the handle: fields are large targets and a separate grip
 * would be the only draggable pixel on a row people already expect to grab.
 * Clicks still open the properties panel — dnd-kit only starts a drag past a
 * small movement threshold, set on the sensor.
 */
export function SortableField({
  field,
  children,
  className,
  onClick,
}: {
  field: FormField;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { kind: 'field', field },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isDragging ? classes.rowDragging : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
