import { Button, CloseButton, ScrollArea, SegmentedControl, Select, Text, TextInput } from '@mantine/core';
import { LayoutTemplateIcon, SearchIcon } from 'lucide-react';
import type { FormTemplate, TemplateCategory } from '@/lib/templates';
import type { ScopeFilter } from '@/lib/templates/search';
import { TemplateRow } from './TemplateRow';
import { groupByCategory } from './templateMeta';
import classes from './TemplatePicker.module.css';

const ALL = 'All';

interface Props {
  results: FormTemplate[];
  total: number;
  categories: TemplateCategory[];
  query: string;
  onQueryChange: (value: string) => void;
  category: TemplateCategory | 'All';
  onCategoryChange: (value: TemplateCategory | 'All') => void;
  scope: ScopeFilter;
  onScopeChange: (value: ScopeFilter) => void;
  activeId: string;
  onSelect: (id: string) => void;
  onReset: () => void;
}

export function TemplateList({
  results,
  total,
  categories,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  scope,
  onScopeChange,
  activeId,
  onSelect,
  onReset,
}: Props) {
  const groups = groupByCategory(results, categories);

  return (
    <section className={classes.listPane}>
      <header className={classes.listHead}>
        <div className={classes.listTitle}>
          <Text fw={600} size="md">
            Templates
          </Text>
          <Text size="xs" c="dimmed">
            {results.length === total ? `${total} ready to use` : `${results.length} of ${total}`}
          </Text>
        </div>

        <div className={classes.filterRow}>
          <TextInput
            className={classes.search}
            placeholder="Search templates"
            value={query}
            onChange={(e) => onQueryChange(e.currentTarget.value)}
            leftSection={<SearchIcon size={15} />}
            rightSection={
              query ? (
                <CloseButton size="sm" onClick={() => onQueryChange('')} aria-label="Clear search" />
              ) : null
            }
            size="sm"
          />
          <Select
            className={classes.categorySelect}
            size="sm"
            value={category}
            onChange={(value) => onCategoryChange((value as TemplateCategory | null) ?? ALL)}
            data={[{ value: ALL, label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
            aria-label="Category"
          />
        </div>

        <SegmentedControl
          fullWidth
          size="xs"
          value={scope}
          onChange={(value) => onScopeChange(value as ScopeFilter)}
          data={[
            { value: 'all', label: 'All' },
            { value: 'page', label: 'Standalone' },
            { value: 'card', label: 'Embedded' },
          ]}
        />
      </header>

      <ScrollArea className={classes.listScroll} type="hover" scrollbarSize={6}>
        {groups.map((group) => (
          <div key={group.category} className={classes.group}>
            <div className={classes.groupHead}>
              <span>{group.category}</span>
              <span className={classes.groupCount}>{group.templates.length}</span>
            </div>
            {group.templates.map((tpl) => (
              <TemplateRow key={tpl.id} template={tpl} active={tpl.id === activeId} onSelect={onSelect} />
            ))}
          </div>
        ))}

        {results.length === 0 && (
          <div className={classes.empty}>
            <span className={classes.emptyIcon}>
              <LayoutTemplateIcon size={20} />
            </span>
            <Text size="sm" fw={600}>
              No templates found
            </Text>
            <Text size="xs" c="dimmed">
              Try another word or clear the filters.
            </Text>
            <Button size="xs" variant="default" radius="xl" onClick={onReset}>
              Clear filters
            </Button>
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
