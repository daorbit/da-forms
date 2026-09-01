import { ActionIcon, Button, Group, Menu, Text, Tooltip } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
  IconChevronDown,
  IconShare2,
  IconFilter,
  IconFileExport,
  IconLayoutList,
  IconLayoutKanban,
  IconCheck,
  IconRefresh,
  IconCalendar,
} from '@tabler/icons-react';
import { DAY_LABEL, STATUS_LABEL, type CustomRange, type DayFilter, type StatusFilter } from './entriesTypes';
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
  onCopyShareLink,
  onRefresh,
  onExportCsv,
}: {
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  view: 'list' | 'kanban';
  loading: boolean;
  onFilter: (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => void;
  onCustomRangeChange: (range: CustomRange) => void;
  onSetView: (view: 'list' | 'kanban') => void;
  onCopyShareLink: () => void;
  onRefresh: () => void;
  onExportCsv: () => void;
}) {
  return (
    <Group justify="space-between" px="md" py="xs" className={classes.filterbar} wrap="wrap">
      <Group gap="lg">
        <Menu shadow="md" width={160}>
          <Menu.Target>
            <Group gap={4} className={classes.filterItem}>
              <Text fw={600} size="sm">
                {STATUS_LABEL[status]}
              </Text>
              <IconChevronDown size={14} />
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
              <Menu.Item key={key} onClick={() => onFilter({ status: key })}>
                {STATUS_LABEL[key]}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        <Text c="dimmed">|</Text>

        <Menu shadow="md" width={160}>
          <Menu.Target>
            <Group gap={4} className={classes.filterItem}>
              <Text fw={600} size="sm">
                {day === 'custom' ? rangeLabel(customRange) : DAY_LABEL[day]}
              </Text>
              <IconChevronDown size={14} />
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            {(Object.keys(DAY_LABEL) as DayFilter[])
              .filter((key) => key !== 'custom')
              .map((key) => (
                <Menu.Item key={key} onClick={() => onFilter({ day: key })}>
                  {DAY_LABEL[key]}
                </Menu.Item>
              ))}
          </Menu.Dropdown>
        </Menu>

        {/* Its own button, not another item in the "All Days" menu — a range
            picker needs to stay open across two clicks (start, then end),
            which fought the day-menu's own open/close state when the two
            shared one dropdown. `DatePicker`, not `DatePickerInput`: the
            input variant opens onto a text field that then has to be clicked
            a second time to reach the actual calendar — this drops straight
            into the grid on the one click that opened the menu. */}
        <Menu shadow="md" width="auto" closeOnItemClick={false}>
          <Menu.Target>
            <Tooltip label="Custom date range" withArrow>
              <ActionIcon
                variant={day === 'custom' ? 'light' : 'subtle'}
                color={day === 'custom' ? 'emerald' : 'gray'}
                aria-label="Custom date range"
              >
                <IconCalendar size={17} />
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
            {/* The bare `DatePicker` (grid only, no text field) has no built-in
                clear button the way `DatePickerInput` does — this is that
                control. Resets the day filter back to "All Days" too, not
                just the picked dates, so the list actually goes back to
                unfiltered rather than silently staying on an emptied range. */}
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

      <Group gap="xs">
        <Menu shadow="md" width={160} position="bottom-end">
          <Menu.Target>
            <Tooltip label="View" withArrow>
              <ActionIcon variant="subtle" color="gray">
                {view === 'list' ? <IconLayoutList size={17} /> : <IconLayoutKanban size={17} />}
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconLayoutList size={15} />}
              rightSection={view === 'list' ? <IconCheck size={14} color="var(--mantine-color-emerald-6)" /> : undefined}
              onClick={() => onSetView('list')}
            >
              List View
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLayoutKanban size={15} />}
              rightSection={view === 'kanban' ? <IconCheck size={14} color="var(--mantine-color-emerald-6)" /> : undefined}
              onClick={() => onSetView('kanban')}
            >
              Kanban View
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Copy share link" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={onCopyShareLink}>
            <IconShare2 size={17} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Refresh responses" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={onRefresh} loading={loading} aria-label="Refresh responses">
            <IconRefresh size={17} />
          </ActionIcon>
        </Tooltip>
        <Menu shadow="md" width={160}>
          <Menu.Target>
            <Tooltip label="Filter" withArrow>
              <ActionIcon variant="subtle" color="gray">
                <IconFilter size={17} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
              <Menu.Item key={key} onClick={() => onFilter({ status: key })}>
                {STATUS_LABEL[key]}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Export CSV" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={onExportCsv}>
            <IconFileExport size={17} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
