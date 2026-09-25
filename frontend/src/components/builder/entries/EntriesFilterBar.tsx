import type React from 'react';
import { ActionIcon, Button, Group, Menu, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
  IconChevronDown,
  IconFileExport,
  IconLayoutList,
  IconLayoutKanban,
  IconTable,
  IconCheck,
  IconRefresh,
  IconCalendar,
  IconCalendarEvent,
  IconSearch,
  IconX,
  IconPaperclip,
} from '@tabler/icons-react';
import {
  DAY_LABEL,
  STATUS_LABEL,
  type CustomRange,
  type DayFilter,
  type EntriesView,
  type StatusFilter,
} from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';

/** "Sep 1 – Sep 8", or just the start once only that's picked. `start`/`end`
 *  are ISO date strings (Mantine's range value shape), parsed here rather
 *  than assumed to already be `Date` objects. */
function rangeLabel(range: CustomRange): string {
  const [start, end] = range;
  if (!start) return DAY_LABEL.custom;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `From ${fmt(start)}`;
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
}: {
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  view: EntriesView;
  loading: boolean;
  onFilter: (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => void;
  onCustomRangeChange: (range: CustomRange) => void;
  onSetView: (view: EntriesView) => void;
  /** Unused here now — the topbar carries the share link. */
  onCopyShareLink?: () => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  /** Free text across every answer. Debounced by the page, not here. */
  search: string;
  onSearchChange: (value: string) => void;
  /** Absent on a form with no upload fields, which hides the button. */
  onOpenFiles?: () => void;
}) {
  return (
    <Group justify="space-between" className={classes.filterbar} wrap="wrap" gap="sm">
      <Group gap="sm" wrap="wrap" className={classes.filterLeft}>
        <TextInput
          size="sm"
          className={classes.filterSearch}
          placeholder="Search answers…"
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          rightSection={
            search ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <IconX size={12} />
              </ActionIcon>
            ) : null
          }
        />

        {/* Read state as tabs: three options is a choice to see, not to open. */}
        {view === 'list' && (
          <SegmentedControl
            size="sm"
            value={status}
            onChange={(value) => onFilter({ status: value as StatusFilter })}
            data={(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => ({
              value: key,
              label: STATUS_LABEL[key],
            }))}
          />
        )}

        <Menu shadow="md" width={170} position="bottom-start">
          <Menu.Target>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconCalendar size={15} />}
              rightSection={<IconChevronDown size={14} />}
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
                  rightSection={day === key ? <IconCheck size={14} /> : undefined}
                >
                  {DAY_LABEL[key]}
                </Menu.Item>
              ))}
          </Menu.Dropdown>
        </Menu>

        {/* Its own button, not another item in the day menu — a range picker
            needs to stay open across two clicks (start, then end), which fought
            the day-menu's own open/close state when the two shared one
            dropdown. */}
        <Menu shadow="md" width="auto" closeOnItemClick={false}>
          <Menu.Target>
            <Tooltip label="Custom date range" withArrow>
              <ActionIcon
                variant={day === 'custom' ? 'light' : 'default'}
                size="input-sm"
                aria-label="Custom date range"
              >
                <IconCalendarEvent size={16} />
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
              // Today, not further out — a form only has responses up to now.
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
      </Group>

      <Group gap="xs" wrap="nowrap">
        <SegmentedControl
          size="sm"
          value={view}
          onChange={(value) => onSetView(value as EntriesView)}
          aria-label="View"
          data={[
            { value: 'list', label: <ViewLabel icon={<IconLayoutList size={15} />} text="List" /> },
            { value: 'kanban', label: <ViewLabel icon={<IconLayoutKanban size={15} />} text="Board" /> },
            { value: 'excel', label: <ViewLabel icon={<IconTable size={15} />} text="Sheet" /> },
          ]}
        />
        <Tooltip label="Refresh responses" withArrow>
          <ActionIcon variant="default" size="input-sm" onClick={onRefresh} loading={loading} aria-label="Refresh responses">
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
        {/* Absent on a form that collects no files, rather than opening an
            empty list. */}
        {onOpenFiles && (
          <Tooltip label="Uploaded files" withArrow>
            <ActionIcon variant="default" size="input-sm" onClick={onOpenFiles} aria-label="Uploaded files">
              <IconPaperclip size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        <Button variant="default" size="sm" leftSection={<IconFileExport size={15} />} onClick={onExportCsv}>
          Export
        </Button>
      </Group>
    </Group>
  );
}

function ViewLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className={classes.viewLabel}>
      {icon}
      <span className={classes.viewText}>{text}</span>
    </span>
  );
}
