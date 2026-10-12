import { STAGE_BY_ID } from '@/lib/stages';
import {
  DAY_LABEL,
  STATUS_LABEL,
  UNASSIGNED,
  type CustomRange,
  type DayFilter,
  type PipelineFilterState,
  type StatusFilter,
} from '../entriesTypes';
import type { ActiveFilter } from './ActiveFilters';

interface Input {
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  pipeline: PipelineFilterState;
  showStatus: boolean;
  showDate: boolean;
  showStage: boolean;
  onStatus: (status: StatusFilter) => void;
  onDay: (day: DayFilter) => void;
  onCustomRange: (range: CustomRange) => void;
  onPipeline: (patch: Partial<PipelineFilterState>) => void;
}

function rangeLabel([start, end]: CustomRange): string {
  if (!start) return DAY_LABEL.custom;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `From ${fmt(start)}`;
}

export function activeFilterList(input: Input): ActiveFilter[] {
  const { status, day, customRange, pipeline } = input;
  const list: ActiveFilter[] = [];

  if (input.showStatus && status !== 'all') {
    list.push({ key: 'status', label: STATUS_LABEL[status], onRemove: () => input.onStatus('all') });
  }
  if (input.showDate && day !== 'all') {
    list.push({
      key: 'day',
      label: day === 'custom' ? rangeLabel(customRange) : DAY_LABEL[day],
      onRemove: () => {
        input.onCustomRange([null, null]);
        input.onDay('all');
      },
    });
  }
  if (input.showStage && pipeline.stage) {
    list.push({
      key: 'stage',
      label: `Stage: ${STAGE_BY_ID[pipeline.stage].label}`,
      onRemove: () => input.onPipeline({ stage: undefined }),
    });
  }
  if (pipeline.assignee) {
    list.push({
      key: 'assignee',
      label: `Assignee: ${pipeline.assignee === UNASSIGNED ? 'Unassigned' : pipeline.assignee}`,
      onRemove: () => input.onPipeline({ assignee: undefined }),
    });
  }
  if (pipeline.tag) {
    list.push({ key: 'tag', label: `Tag: ${pipeline.tag}`, onRemove: () => input.onPipeline({ tag: undefined }) });
  }
  return list;
}
