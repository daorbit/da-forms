import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Badge, Paper, ScrollArea, Text } from '@mantine/core';
import { GripVerticalIcon, UserIcon } from 'lucide-react';
import type { FormField, PipelinePatch, Submission, SubmissionStage } from '@/types';
import { parseRepeaterRows } from '@/lib/repeater';
import { STAGES, stageOf, type StageMeta } from '@/lib/stages';
import classes from './EntriesKanban.module.css';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function cardTitle(submission: Submission, primaryField?: FormField) {
  if (!primaryField) return 'Entry';
  if (primaryField.type === 'repeater') {
    return `${parseRepeaterRows(submission.data[primaryField.id]).length} entries`;
  }
  return submission.data[primaryField.id] || 'Untitled entry';
}

function Card({
  submission,
  primaryField,
  onOpen,
}: {
  submission: Submission;
  primaryField?: FormField;
  onOpen?: (submission: Submission) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: submission._id,
  });
  const tags = submission.tags ?? [];

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      radius="md"
      p="sm"
      className={classes.card}
      data-dragging={isDragging || undefined}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      onClick={() => onOpen?.(submission)}
      {...listeners}
      {...attributes}
    >
      <div className={classes.cardHead}>
        <Text size="sm" fw={600} truncate>
          {cardTitle(submission, primaryField)}
        </Text>
        <GripVerticalIcon size={14} className={classes.grip} />
      </div>
      <Text size="xs" c="dimmed">
        {formatDateTime(submission.createdAt)}
      </Text>
      {(submission.leadScore !== undefined || submission.assignee || tags.length > 0) && (
        <div className={classes.meta}>
          {submission.leadScore !== undefined && (
            <Badge size="xs" variant="light" color="grape">
              Score {submission.leadScore}
            </Badge>
          )}
          {submission.assignee && (
            <span className={classes.assignee}>
              <UserIcon size={11} />
              {submission.assignee}
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} size="xs" variant="outline" color="gray">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Text size="xs" c="dimmed">
              +{tags.length - 2}
            </Text>
          )}
        </div>
      )}
    </Paper>
  );
}

function ColumnDropZone({
  stage,
  submissions,
  primaryField,
  onOpen,
}: {
  stage: StageMeta;
  submissions: Submission[];
  primaryField?: FormField;
  onOpen?: (submission: Submission) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div ref={setNodeRef} className={classes.column} data-over={isOver || undefined}>
      <div className={classes.columnHead}>
        <Text fw={600} size="sm">
          {stage.label}
        </Text>
        <Badge color={stage.color} variant="light">
          {submissions.length}
        </Badge>
      </div>
      <div className={classes.cards}>
        {submissions.map((s) => (
          <Card key={s._id} submission={s} primaryField={primaryField} onOpen={onOpen} />
        ))}
        {submissions.length === 0 && <div className={classes.empty}>No entries</div>}
      </div>
    </div>
  );
}

interface Props {
  submissions: Submission[];
  columns: (FormField & { retired?: boolean })[];
  onMove: (submissionId: string, patch: PipelinePatch) => void;
  onOpen?: (submission: Submission) => void;
}

export function EntriesKanban({ submissions, columns, onMove, onOpen }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const primaryField = columns[0];

  const grouped = useMemo(() => {
    const map: Record<SubmissionStage, Submission[]> = {
      new: [],
      contacted: [],
      qualified: [],
      won: [],
      lost: [],
    };
    for (const s of submissions) map[stageOf(s)].push(s);
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
    const target = over.id as SubmissionStage;
    if (stageOf(submission) === target) return;
    onMove(submission._id, { stage: target });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea>
        <div className={classes.board}>
          {STAGES.map((stage) => (
            <ColumnDropZone
              key={stage.id}
              stage={stage}
              submissions={grouped[stage.id]}
              primaryField={primaryField}
              onOpen={onOpen}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeSubmission ? <Card submission={activeSubmission} primaryField={primaryField} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
