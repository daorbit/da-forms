import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core';
import { CheckIcon, ChevronDownIcon, RefreshCwIcon } from 'lucide-react';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { SearchField } from '@/components/ui/SearchField';
import toolbar from '@/components/ui/toolbar.module.css';
import { SORT_LABEL, STATUS_TABS, type SortOption, type StatusFilter } from './constants';
import classes from './FormListToolbar.module.css';

interface Props {
  search: string;
  status: StatusFilter;
  sort: SortOption;
  loading: boolean;
  narrow: boolean;
  onSearch: (q: string) => void;
  onStatus: (status: StatusFilter) => void;
  onSort: (sort: SortOption) => void;
  onRefresh: () => void;
}

export function FormListToolbar({
  search,
  status,
  sort,
  loading,
  narrow,
  onSearch,
  onStatus,
  onSort,
  onRefresh,
}: Props) {
  return (
    <div className={classes.root}>
      <SegmentedTabs
        ariaLabel="Filter forms by status"
        value={status}
        onChange={onStatus}
        data={STATUS_TABS}
        fullWidth={narrow}
      />

      <div className={classes.end}>
        <SearchField value={search} onChange={onSearch} ariaLabel="Search forms" className={classes.search} />

        <Menu position="bottom-end" width={190}>
          <Menu.Target>
            <Button variant="subtle" className={toolbar.pillButton} rightSection={<ChevronDownIcon size={14} />}>
              {SORT_LABEL[sort]}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Sort by</Menu.Label>
            {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
              <Menu.Item
                key={key}
                onClick={() => onSort(key)}
                rightSection={sort === key ? <CheckIcon size={14} /> : undefined}
              >
                {SORT_LABEL[key]}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        <Tooltip label="Refresh" withArrow>
          <ActionIcon variant="subtle" className={toolbar.iconButton} size={34} radius="xl" onClick={onRefresh} aria-label="Refresh">
            <RefreshCwIcon size={16} className={loading ? toolbar.spinning : undefined} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}
