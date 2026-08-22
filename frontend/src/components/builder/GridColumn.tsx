import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Text } from '@mantine/core';
import type { FormField } from '@/types';
import { columnDroppableId } from './dnd';
import classes from './FormCanvas.module.css';

/**
 * One column of a grid: a drop target that also sorts what it already holds.
 *
 * Empty columns say so rather than rendering as dead space — an invisible drop
 * target is one nobody aims at.
 */
export function GridColumn({
  gridId,
  columnIndex,
  fields,
  children,
}: {
  gridId: string;
  columnIndex: number;
  fields: FormField[];
  children: React.ReactNode;
}) {
  const droppableId = columnDroppableId(gridId, columnIndex);
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={`${classes.gridColumn} ${isOver ? classes.gridColumnOver : ''}`}
    >
      <SortableContext
        id={droppableId}
        items={fields.map((field) => field.id)}
        strategy={verticalListSortingStrategy}
      >
        {fields.length === 0 ? (
          <div className={classes.gridColumnEmpty}>
            <Text size="xs" c="dimmed">
              Drag and drop fields here
            </Text>
          </div>
        ) : (
          children
        )}
      </SortableContext>
    </div>
  );
}
