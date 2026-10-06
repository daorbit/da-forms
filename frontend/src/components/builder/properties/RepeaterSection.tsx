import { NumberInput } from '@mantine/core';
import { RepeaterFieldsEditor } from '@/components/builder/RepeaterFieldsEditor';
import { FieldPair, PropertySection } from './PropertySection';
import type { SectionProps } from './types';

export function RepeaterSection({ field, set }: SectionProps) {
  return (
    <>
      <PropertySection title="Fields in each row" description="Respondents fill these once per row they add.">
        <RepeaterFieldsEditor subFields={field.subFields ?? []} onChange={(subFields) => set({ subFields })} />
      </PropertySection>
      <PropertySection title="Rows">
        <FieldPair>
          <NumberInput
            label="Minimum rows"
            min={0}
            value={field.minRows ?? ''}
            onChange={(v) => set({ minRows: v === '' ? undefined : Number(v) })}
          />
          <NumberInput
            label="Maximum rows"
            min={1}
            value={field.maxRows ?? ''}
            onChange={(v) => set({ maxRows: v === '' ? undefined : Number(v) })}
          />
        </FieldPair>
      </PropertySection>
    </>
  );
}
