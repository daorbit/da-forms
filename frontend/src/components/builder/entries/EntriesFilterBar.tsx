import type { ReactNode } from 'react';
import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
  CalendarIcon,
  CalendarRangeIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  LayoutListIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SquareKanbanIcon,
  TableIcon,
} from 'lucide-react';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { SearchField } from '@/components/ui/SearchField';
import toolbar from '@/components/ui/toolbar.module.css';
import {
  DAY_LABEL,
  STATUS_LABEL,
  type CustomRange,
  type DayFilter,
  type EntriesView,
  type StatusFilter,
} from './entriesTypes';
import classes from './EntriesFilterBar.module.css';

function rangeLabel(range: CustomRange): string {
  const [start, end] = range;
  if (!start) return DAY_LABEL.custom;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `From ${fmt(start)}`;
}

const STATUS_TABS = (Object.keys(STATUS_LABEL) as StatusFilter[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

const VIEW_TABS: { value: EntriesView; label: ReactNode; title: string }[] = [
  { value: 'list', title: 'List', label: <><LayoutListIcon size={14} /><span className={classes.viewText}>List</span></> },
  { value: 'kanban', title: 'Board', label: <><SquareKanbanIcon size={14} /><span className={classes.viewText}>Board</span></> },
  { value: 'excel', title: 'Sheet', label: <><TableIcon size={14} /><span className={classes.viewText}>Sheet</span></> },
];

interface Props {
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  view: EntriesView;
  loading: boolean;
  onFilter: (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => void;
  onCustomRangeChange: (range: CustomRange) => void;
  onSetView: (view: EntriesView) => void;
  onCopyShareLink?: () => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFiles?: () => void;
}

export function EntriesFilterBar({
  status,
  day,
  customRange,
  view,
  loading,
  onFilter,
  onCustomRangeChange,
  onSetView,
  onRefresh,
  onExportCsv,
  search,
  onSearchChange,
  onOpenFiles,
}: Props) {
  return (
    <div className={classes.root}>
      <div className={classes.start}>
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Search answers"
          ariaLabel="Search answers"
          className={classes.search}
        />

        {view === 'list' && (
          <SegmentedTabs
            ariaLabel="Filter by read state"
            value={status}
            onChange={(value) => onFilter({ status: value })}
            data={STATUS_TABS}
          />
        )}

        <Menu width={180} position="bottom-start">
          <Menu.Target>
            <Button
              variant="subtle"
              className={toolbar.pillButton}
              data-active={day !== 'all' || undefined}
              leftSection={<CalendarIcon size={15} />}
              rightSection={<ChevronDownIcon size={14} />}
            >
              {day === 'custom' ? rangeLabel(customRange) : DAY_LABEL[day]}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {(Object.keys(DAY_LABEL) as DayFilter[])
              .filter((key) => key !== 'custom')
              .map((key) => (
                <Menu.Item
                  key={key}
                  onClick={() => onFilter({ day: key })}
                  rightSection={day === key ? <CheckIcon size={14} /> : undefined}
                >
                  {DAY_LABEL[key]}
                </Menu.Item>
              ))}
          </Menu.Dropdown>
        </Menu>

        <Menu width="auto" closeOnItemClick={false}>
          <Menu.Target>
            <Tooltip label="Custom date range" withArrow>
              <ActionIcon
                variant="subtle"
                size={34}
                radius="xl"
                className={toolbar.iconButton}
                data-active={day === 'custom' || undefined}
                aria-label="Custom date range"
              >
                <CalendarRangeIcon size={16} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown p="sm">
            <DatePicker
              type="range"
              size="xs"
              value={customRange}
              onChange={(range) => {
                onCustomRangeChange(range);
                onFilter({ day: 'custom' });
              }}
              allowSingleDateInRange
              maxDate={new Date()}
            />
            {(customRange[0] || customRange[1]) && (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                fullWidth
                mt={4}
                onClick={() => {
                  onCustomRangeChange([null, null]);
                  onFilter({ day: 'all' });
                }}
              >
                Clear range
              </Button>
            )}
          </Menu.Dropdown>
        </Menu>
      </div>

      <div className={classes.end}>
        <SegmentedTabs ariaLabel="View" value={view} onChange={onSetView} data={VIEW_TABS} />
        <Tooltip label="Refresh responses" withArrow>
          <ActionIcon
            variant="subtle"
            size={34}
            radius="xl"
            className={toolbar.iconButton}
            onClick={onRefresh}
            aria-label="Refresh responses"
          >
            <RefreshCwIcon size={16} className={loading ? toolbar.spinning : undefined} />
          </ActionIcon>
        </Tooltip>
        {onOpenFiles && (
          <Tooltip label="Uploaded files" withArrow>
            <ActionIcon
              variant="subtle"
              size={34}
              radius="xl"
              className={toolbar.iconButton}
              onClick={onOpenFiles}
              aria-label="Uploaded files"
            >
              <PaperclipIcon size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        <Button variant="default" radius="xl" leftSection={<DownloadIcon size={15} />} onClick={onExportCsv}>
          Export
        </Button>
      </div>
    </div>
  );
}
