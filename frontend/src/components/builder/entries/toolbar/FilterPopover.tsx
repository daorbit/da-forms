import type { ReactNode } from 'react';
import { Button, Popover, Select, UnstyledButton } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { ListFilterIcon } from 'lucide-react';
import type { PipelineFacets, SubmissionStage } from '@/types';
import { STAGES } from '@/lib/stages';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import {
  DAY_LABEL,
  STATUS_LABEL,
  UNASSIGNED,
  type CustomRange,
  type DayFilter,
  type PipelineFilterState,
  type StatusFilter,
} from '../entriesTypes';
import classes from './EntriesToolbar.module.css';

const STATUS_TABS = (Object.keys(STATUS_LABEL) as StatusFilter[]).map((value) => ({ value, label: STATUS_LABEL[value] }));
const DAYS = Object.keys(DAY_LABEL) as DayFilter[];

interface Props {
  count: number;
  showStatus: boolean;
  showStage: boolean;
  showDate: boolean;
  status: StatusFilter;
  day: DayFilter;
  customRange: CustomRange;
  pipeline: PipelineFilterState;
  facets: PipelineFacets;
  onStatus: (status: StatusFilter) => void;
  onDay: (day: DayFilter) => void;
  onCustomRange: (range: CustomRange) => void;
  onPipeline: (patch: Partial<PipelineFilterState>) => void;
  onClear: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={classes.section}>
      <span className={classes.sectionTitle}>{title}</span>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <UnstyledButton className={classes.pill} data-active={active || undefined} onClick={onClick}>
      {children}
    </UnstyledButton>
  );
}

export function FilterPopover(props: Props) {
  const { count, facets, pipeline } = props;

  return (
    <Popover width={340} position="bottom-end" radius="lg" shadow="lg" offset={8} trapFocus={false}>
      <Popover.Target>
        <Button
          variant="default"
          radius="xl"
          className={classes.filterButton}
          data-active={count > 0 || undefined}
          leftSection={<ListFilterIcon size={15} />}
          rightSection={count > 0 ? <span className={classes.badge}>{count}</span> : undefined}
        >
          Filter
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <div className={classes.panel}>
          {props.showStatus && (
            <Section title="Status">
              <SegmentedTabs ariaLabel="Read state" size="sm" fullWidth value={props.status} onChange={props.onStatus} data={STATUS_TABS} />
            </Section>
          )}

          {props.showDate && (
            <Section title="Submitted">
              <div className={classes.pills}>
                {DAYS.map((day) => (
                  <Pill key={day} active={props.day === day} onClick={() => props.onDay(day)}>
                    {day === 'custom' ? 'Custom' : DAY_LABEL[day]}
                  </Pill>
                ))}
              </div>
              {props.day === 'custom' && (
                <div className={classes.calendar}>
                  <DatePicker
                    type="range"
                    size="xs"
                    value={props.customRange}
                    onChange={props.onCustomRange}
                    allowSingleDateInRange
                    maxDate={new Date()}
                  />
                </div>
              )}
            </Section>
          )}

          {props.showStage && (
            <Section title="Stage">
              <div className={classes.pills}>
                <Pill active={!pipeline.stage} onClick={() => props.onPipeline({ stage: undefined })}>
                  Any
                </Pill>
                {STAGES.map((stage) => (
                  <Pill
                    key={stage.id}
                    active={pipeline.stage === stage.id}
                    onClick={() => props.onPipeline({ stage: stage.id as SubmissionStage })}
                  >
                    <span className={classes.stageDot} data-color={stage.color} />
                    {stage.label}
                  </Pill>
                ))}
              </div>
            </Section>
          )}

          {facets.assignees.length > 0 && (
            <Section title="Assignee">
              <Select
                size="sm"
                radius="md"
                placeholder="Anyone"
                clearable
                comboboxProps={{ withinPortal: false }}
                value={pipeline.assignee ?? null}
                onChange={(assignee) => props.onPipeline({ assignee: assignee ?? undefined })}
                data={[{ value: UNASSIGNED, label: 'Unassigned' }, ...facets.assignees.map((name) => ({ value: name, label: name }))]}
              />
            </Section>
          )}

          {facets.tags.length > 0 && (
            <Section title="Tag">
              <Select
                size="sm"
                radius="md"
                placeholder="Any tag"
                clearable
                searchable
                comboboxProps={{ withinPortal: false }}
                value={pipeline.tag ?? null}
                onChange={(tag) => props.onPipeline({ tag: tag ?? undefined })}
                data={facets.tags}
              />
            </Section>
          )}
        </div>
        <div className={classes.panelFooter}>
          <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={props.onClear} disabled={count === 0}>
            Clear all
          </Button>
          <span className={classes.panelCount}>{count === 0 ? 'No filters' : `${count} active`}</span>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
