import { ArrowDownUpIcon, FlagIcon, TagIcon, UserIcon } from 'lucide-react';
import type { PipelineFacets, PipelineSort, SubmissionStage } from '@/types';
import { STAGES } from '@/lib/stages';
import { FilterMenu } from './FilterMenu';
import { SORT_LABEL, UNASSIGNED, type PipelineFilterState } from './entriesTypes';

interface Props {
  value: PipelineFilterState;
  facets: PipelineFacets;
  showStage: boolean;
  scored: boolean;
  onChange: (patch: Partial<PipelineFilterState>) => void;
}

const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage.id, label: stage.label }));

export function PipelineFilters({ value, facets, showStage, scored, onChange }: Props) {
  const sortOptions = (Object.keys(SORT_LABEL) as PipelineSort[])
    .filter((sort) => scored || sort !== 'score')
    .map((sort) => ({ value: sort, label: SORT_LABEL[sort] }));

  return (
    <>
      {showStage && (
        <FilterMenu
          icon={<FlagIcon size={15} />}
          allLabel="All stages"
          value={value.stage}
          options={STAGE_OPTIONS}
          onSelect={(stage) => onChange({ stage: stage as SubmissionStage | undefined })}
        />
      )}

      {facets.assignees.length > 0 && (
        <FilterMenu
          icon={<UserIcon size={15} />}
          allLabel="Anyone"
          value={value.assignee}
          options={[
            { value: UNASSIGNED, label: 'Unassigned' },
            ...facets.assignees.map((name) => ({ value: name, label: name })),
          ]}
          onSelect={(assignee) => onChange({ assignee })}
        />
      )}

      {facets.tags.length > 0 && (
        <FilterMenu
          icon={<TagIcon size={15} />}
          allLabel="Any tag"
          value={value.tag}
          options={facets.tags.map((tag) => ({ value: tag, label: tag }))}
          onSelect={(tag) => onChange({ tag })}
        />
      )}

      <FilterMenu
        icon={<ArrowDownUpIcon size={15} />}
        allLabel={SORT_LABEL.newest}
        value={value.sort}
        options={sortOptions}
        clearable={false}
        onSelect={(sort) => onChange({ sort: (sort as PipelineSort | undefined) ?? 'newest' })}
      />
    </>
  );
}
