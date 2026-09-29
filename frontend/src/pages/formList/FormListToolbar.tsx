import { ActionIcon, Button, Menu, TextInput, Tooltip } from '@mantine/core';
import { CheckIcon, ChevronDownIcon, RefreshCwIcon, SearchIcon, XIcon } from 'lucide-react';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
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
        <TextInput
          placeholder="Search"
          value={search}
          onChange={(e) => onSearch(e.currentTarget.value)}
          leftSection={<SearchIcon size={15} />}
          rightSection={
            search ? (
              <ActionIcon variant="transparent" className={classes.clear} onClick={() => onSearch('')} aria-label="Clear search">
                <XIcon size={13} />
              </ActionIcon>
            ) : undefined
          }
          aria-label="Search forms"
          classNames={{ root: classes.search, input: classes.searchInput, section: classes.searchSection }}
        />

        <Menu position="bottom-end" width={190}>
          <Menu.Target>
            <Button variant="subtle" className={classes.sort} rightSection={<ChevronDownIcon size={14} />}>
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
          <ActionIcon
            variant="subtle"
            className={classes.iconButton}
            size={34}
            radius="xl"
            onClick={onRefresh}
            aria-label="Refresh"
          >
            <RefreshCwIcon size={16} className={loading ? classes.spinning : undefined} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}
