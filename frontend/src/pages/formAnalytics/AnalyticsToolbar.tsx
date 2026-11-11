import { Select } from '@mantine/core';
import { FileTextIcon } from 'lucide-react';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useStuck } from '@/hooks/useStuck';
import type { AnalyticsFormRef, AnalyticsRange } from '@/types/formsAnalytics';
import classes from './FormAnalytics.module.css';

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const ALL = 'all';

interface Props {
  range: AnalyticsRange;
  onRange: (range: AnalyticsRange) => void;
  formId: string | null;
  onForm: (formId: string | null) => void;
  forms: AnalyticsFormRef[];
}

export function AnalyticsToolbar({ range, onRange, formId, onForm, forms }: Props) {
  const { sentinel, stuck } = useStuck<HTMLDivElement>();
  const options = [
    { value: ALL, label: 'All forms' },
    ...forms.map((f) => ({ value: f.id, label: f.title || 'Untitled form' })),
  ];

  return (
    <>
      <div ref={sentinel} className={classes.stickSentinel} aria-hidden="true" />
      <div className={classes.toolbar} data-stuck={stuck || undefined}>
        <SegmentedTabs value={range} onChange={onRange} data={RANGES} ariaLabel="Date range" />
        <Select
          className={classes.formSelect}
          classNames={{ input: classes.formSelectInput, section: classes.formSelectIcon }}
          aria-label="Form"
          data={options}
          value={formId ?? ALL}
          onChange={(v) => onForm(!v || v === ALL ? null : v)}
          allowDeselect={false}
          searchable
          leftSection={<FileTextIcon size={14} />}
          comboboxProps={{ radius: 'md' }}
        />
      </div>
    </>
  );
}
