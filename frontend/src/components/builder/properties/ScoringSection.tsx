import { Checkbox, NumberInput } from '@mantine/core';
import { DOCS } from '@/lib/docs';
import { DocsLink } from '@/components/ui/DocsLink';
import { PropertySection } from './PropertySection';
import type { SectionProps } from './types';
import classes from './ScoringSection.module.css';

export function ScoringSection({ field, set }: SectionProps) {
  return (
    <PropertySection
      title="Scoring & answer key"
      description="Tick correct options to make this a quiz question. Values feed formulas and each response's lead score."
      aside={<DocsLink path={DOCS.scoring} label="Guide" />}
    >
      <div className={classes.table}>
        <div className={classes.headRow}>
          <span>Correct</span>
          <span>Option</span>
          <span>Value</span>
        </div>
        {(field.options ?? []).map((option) => (
          <div key={option} className={classes.row}>
            <span className={classes.correct}>
              <Checkbox
                checked={field.correctOptions?.includes(option) ?? false}
                onChange={(e) => {
                  const current = field.correctOptions ?? [];
                  const next = e.currentTarget.checked ? [...current, option] : current.filter((o) => o !== option);
                  set({ correctOptions: next.length ? next : undefined });
                }}
                aria-label={`${option} is correct`}
              />
            </span>
            <span className={classes.option} title={option}>
              {option}
            </span>
            <NumberInput
              size="xs"
              placeholder="0"
              value={field.optionValues?.[option] ?? ''}
              onChange={(value) => {
                const next = { ...(field.optionValues ?? {}) };
                if (typeof value === 'number') next[option] = value;
                else delete next[option];
                set({ optionValues: Object.keys(next).length ? next : undefined });
              }}
              aria-label={`${option} value`}
            />
          </div>
        ))}
      </div>
    </PropertySection>
  );
}
