import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core';
import { IconGripVertical, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface Props {
  options: string[];
  /** The current order, as a comma-joined list. Empty means "as authored". */
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  inputBg?: string;
  inputBorder?: string;
  textColor?: string;
}

function Row({
  option,
  index,
  readOnly,
  inputBg,
  inputBorder,
  textColor,
  onMove,
  isFirst,
  isLast,
}: {
  option: string;
  index: number;
  readOnly?: boolean;
  inputBg?: string;
  inputBorder?: string;
  textColor?: string;
  onMove: (from: number, to: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option,
    disabled: readOnly,
  });

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      p="xs"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: inputBg,
        borderColor: inputBorder,
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <Text size="xs" fw={700} c="dimmed" style={{ width: 18, flexShrink: 0 }}>
          {index + 1}
        </Text>
        <Text size="sm" style={{ flex: 1, color: textColor }}>
          {option}
        </Text>
        {!readOnly && (
          <Group gap={2} wrap="nowrap">
            {/* Buttons as well as a drag handle: dragging is unusable by
                keyboard and awkward on a small screen, and a ranking with no
                other way to reorder is a ranking some people cannot answer. */}
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              disabled={isFirst}
              onClick={() => onMove(index, index - 1)}
              aria-label={`Move ${option} up`}
            >
              <IconChevronUp size={14} />
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              disabled={isLast}
              onClick={() => onMove(index, index + 1)}
              aria-label={`Move ${option} down`}
            >
              <IconChevronDown size={14} />
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              style={{ cursor: 'grab' }}
              {...attributes}
              {...listeners}
              aria-label={`Drag ${option}`}
            >
              <IconGripVertical size={14} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </Paper>
  );
}

/**
 * Drag options into preference order.
 *
 * The answer is the order itself, stored as a comma-joined list, so an option
 * that is renamed in the builder simply drops out of an old answer rather than
 * corrupting it.
 */
export function RankingInput({
  options,
  value,
  onChange,
  readOnly,
  inputBg,
  inputBorder,
  textColor,
}: Props) {
  // An answer only covers options that still exist; anything added to the field
  // since is appended in its authored position rather than being lost.
  const ranked = value ? value.split(', ').filter((o) => options.includes(o)) : [];
  const order = [...ranked, ...options.filter((o) => !ranked.includes(o))];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function move(from: number, to: number) {
    if (readOnly || to < 0 || to >= order.length) return;
    onChange(arrayMove(order, from, to).join(', '));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <Stack gap={6}>
          {order.map((option, index) => (
            <Row
              key={option}
              option={option}
              index={index}
              readOnly={readOnly}
              inputBg={inputBg}
              inputBorder={inputBorder}
              textColor={textColor}
              onMove={move}
              isFirst={index === 0}
              isLast={index === order.length - 1}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}
