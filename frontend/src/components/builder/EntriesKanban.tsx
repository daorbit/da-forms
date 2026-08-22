import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Badge, Box, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import type { FormField, Submission } from '@/types';

type Column = 'unread' | 'read';

const COLUMNS: { id: Column; label: string; color: string }[] = [
  { id: 'unread', label: 'Unread', color: 'gray' },
  { id: 'read', label: 'Read', color: 'blue' },
];

function columnOf(submission: Submission): Column {
  return submission.read ? 'read' : 'unread';
}

function patchFor(column: Column): Partial<Pick<Submission, 'read'>> {
  return { read: column === 'read' };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Card({ submission, primaryField }: { submission: Submission; primaryField?: FormField }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: submission._id,
  });

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      radius="md"
      p="sm"
      style={{
        opacity: isDragging ? 0.4 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: 'grab',
      }}
      {...listeners}
      {...attributes}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text size="sm" fw={600} truncate>
          {primaryField ? submission.data[primaryField.id] || 'Untitled entry' : 'Entry'}
        </Text>
        <IconGripVertical size={14} color="var(--mantine-color-gray-5)" />
      </Group>
      <Text size="xs" c="dimmed">
        {formatDateTime(submission.createdAt)}
      </Text>
    </Paper>
  );
}

function ColumnDropZone({
  column,
  color,
  label,
  submissions,
  primaryField,
}: {
  column: Column;
  color: string;
  label: string;
  submissions: Submission[];
  primaryField?: FormField;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <Stack
      ref={setNodeRef}
      gap="xs"
      p="sm"
      style={{
        flex: 1,
        minWidth: 260,
        background: isOver ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-gray-1)',
        borderRadius: 8,
        minHeight: 300,
      }}
    >
      <Group justify="space-between">
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Badge color={color} variant="light">
          {submissions.length}
        </Badge>
      </Group>
      <Stack gap="xs">
        {submissions.map((s) => (
          <Card key={s._id} submission={s} primaryField={primaryField} />
        ))}
        {submissions.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" py="lg">
            No entries
          </Text>
        )}
      </Stack>
    </Stack>
  );
}

interface Props {
  submissions: Submission[];
  columns: FormField[];
  onMove: (submissionId: string, patch: Partial<Pick<Submission, 'read'>>) => void;
}

export function EntriesKanban({ submissions, columns, onMove }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const primaryField = columns[0];

  const grouped = useMemo(() => {
    const map: Record<Column, Submission[]> = { unread: [], read: [] };
    for (const s of submissions) map[columnOf(s)].push(s);
    return map;
  }, [submissions]);

  const activeSubmission = submissions.find((s) => s._id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const submission = submissions.find((s) => s._id === active.id);
    if (!submission) return;
    const targetColumn = over.id as Column;
    if (columnOf(submission) === targetColumn) return;
    onMove(submission._id, patchFor(targetColumn));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea>
        <Box style={{ display: 'flex', gap: 16, padding: '16px', minWidth: 780 }}>
          {COLUMNS.map((col) => (
            <ColumnDropZone
              key={col.id}
              column={col.id}
              color={col.color}
              label={col.label}
              submissions={grouped[col.id]}
              primaryField={primaryField}
            />
          ))}
        </Box>
      </ScrollArea>
      <DragOverlay>
        {activeSubmission ? <Card submission={activeSubmission} primaryField={primaryField} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
