import type { ReactNode } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import {
  ArrowDownUpIcon,
  CalendarDaysIcon,
  LayoutListIcon,
  RefreshCwIcon,
  SquareKanbanIcon,
  TableIcon,
} from 'lucide-react';
import type { PipelineFacets, PipelineSort } from '@/types';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { SearchField } from '@/components/ui/SearchField';
import toolbar from '@/components/ui/toolbar.module.css';
import { FilterMenu } from './FilterMenu';
import { FilterPopover } from './toolbar/FilterPopover';
import { ActiveFilters } from './toolbar/ActiveFilters';
import { activeFilterList } from './toolbar/filterSummary';
import {
  SORT_LABEL,
  type CustomRange,
  type DayFilter,
  type EntriesView,
  type PipelineFilterState,
  type StatusFilter,
} from './entriesTypes';
import classes from './toolbar/EntriesToolbar.module.css';

const VIEW_TABS: { value: EntriesView; label: ReactNode; title: string }[] = [
  { value: 'list', title: 'List', label: <><LayoutListIcon size={15} /><span className={classes.viewText}>List</span></> },
  { value: 'kanban', title: 'Board', label: <><SquareKanbanIcon size={15} /><span className={classes.viewText}>Board</span></> },
  { value: 'excel', title: 'Sheet', label: <><TableIcon size={15} /><span className={classes.viewText}>Sheet</span></> },
  { value: 'calendar', title: 'Calendar', label: <><CalendarDaysIcon size={15} /><span className={classes.viewText}>Calendar</span></> },
];

interface Props {
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  view: EntriesView;
  loading: boolean;
  search: string;
  pipeline: PipelineFilterState;
  facets: PipelineFacets;
  scored: boolean;
  calendarAvailable?: boolean;
  onFilter: (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => void;
  onCustomRangeChange: (range: CustomRange) => void;
  onPipelineChange: (patch: Partial<PipelineFilterState>) => void;
  onSetView: (view: EntriesView) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function EntriesFilterBar(props: Props) {
  const { view, pipeline } = props;
  const viewTabs = props.calendarAvailable ? VIEW_TABS : VIEW_TABS.filter((tab) => tab.value !== 'calendar');
  const showStatus = view === 'list';
  const showDate = view !== 'calendar';
  const showStage = view !== 'kanban';

  const onStatus = (status: StatusFilter) => props.onFilter({ status });
  const onDay = (day: DayFilter) => props.onFilter({ day });

  const active = activeFilterList({
    status: props.status,
    day: props.day,
    customRange: props.customRange,
    pipeline,
    showStatus,
    showDate,
    showStage,
    onStatus,
    onDay,
    onCustomRange: props.onCustomRangeChange,
    onPipeline: props.onPipelineChange,
  });

  const clearAll = () => {
    props.onCustomRangeChange([null, null]);
    props.onFilter({ status: 'all', day: 'all' });
    props.onPipelineChange({ stage: undefined, assignee: undefined, tag: undefined });
  };

  const sortOptions = (Object.keys(SORT_LABEL) as PipelineSort[])
    .filter((sort) => props.scored || sort !== 'score')
    .map((sort) => ({ value: sort, label: SORT_LABEL[sort] }));

  return (
    <div className={classes.toolbar}>
      <div className={classes.row}>
        <SegmentedTabs ariaLabel="View" value={view} onChange={props.onSetView} data={viewTabs} />

        <div className={classes.controls}>
          <SearchField
            value={props.search}
            onChange={props.onSearchChange}
            placeholder="Search responses"
            ariaLabel="Search responses"
            className={classes.search}
          />
          <FilterPopover
            count={active.length}
            showStatus={showStatus}
            showDate={showDate}
            showStage={showStage}
            status={props.status}
            day={props.day}
            customRange={props.customRange}
            pipeline={pipeline}
            facets={props.facets}
            onStatus={onStatus}
            onDay={onDay}
            onCustomRange={(range) => {
              props.onCustomRangeChange(range);
              onDay('custom');
            }}
            onPipeline={props.onPipelineChange}
            onClear={clearAll}
          />
          {view !== 'calendar' && (
            <FilterMenu
              icon={<ArrowDownUpIcon size={15} />}
              allLabel={SORT_LABEL.newest}
              value={pipeline.sort}
              options={sortOptions}
              clearable={false}
              onSelect={(sort) => props.onPipelineChange({ sort: (sort as PipelineSort | undefined) ?? 'newest' })}
            />
          )}
          <Tooltip label="Refresh" withArrow>
            <ActionIcon
              variant="subtle"
              size={34}
              radius="xl"
              className={toolbar.iconButton}
              onClick={props.onRefresh}
              aria-label="Refresh responses"
            >
              <RefreshCwIcon size={16} className={props.loading ? toolbar.spinning : undefined} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      <ActiveFilters filters={active} onClear={clearAll} />
    </div>
  );
}
