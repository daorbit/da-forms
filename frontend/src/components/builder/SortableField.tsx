import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import type { FormField } from '@/types';
import type { DragData } from './dnd';
import classes from './FormCanvas.module.css';

interface SortableMeta {
  sortable?: { containerId?: string | number };
}

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver, active, data } = useSortable({
    id: field.id,
    data: { kind: 'field', field },
  });

  const activeData = active?.data.current as (DragData & SortableMeta) | undefined;
  const ownContainer = (data as SortableMeta | undefined)?.sortable?.containerId;
  const fromElsewhere =
    activeData?.kind === 'palette' || activeData?.sortable?.containerId !== ownContainer;
  const showDropLine = isOver && !isDragging && active?.id !== field.id && fromElsewhere;

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isDragging ? classes.rowDragging : ''}`}
      data-drop-before={showDropLine || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <span className={classes.grip} aria-hidden>
        <GripVerticalIcon size={14} />
      </span>
      {children}
    </div>
  );
}
