import { ActionIcon, Group, Menu, Text, Tooltip } from '@mantine/core';
import {
  IconChevronDown,
  IconShare2,
  IconFilter,
  IconFileExport,
  IconLayoutList,
  IconLayoutKanban,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react';
import { DAY_LABEL, STATUS_LABEL, type DayFilter, type StatusFilter } from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';

export function EntriesFilterBar({
  status,
  day,
  view,
  loading,
  onFilter,
  onSetView,
  onCopyShareLink,
  onRefresh,
  onExportCsv,
}: {
  status: StatusFilter;
  day: DayFilter;
  view: 'list' | 'kanban';
  loading: boolean;
  onFilter: (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => void;
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
                {DAY_LABEL[day]}
              </Text>
              <IconChevronDown size={14} />
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            {(Object.keys(DAY_LABEL) as DayFilter[]).map((key) => (
              <Menu.Item key={key} onClick={() => onFilter({ day: key })}>
                {DAY_LABEL[key]}
              </Menu.Item>
            ))}
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
