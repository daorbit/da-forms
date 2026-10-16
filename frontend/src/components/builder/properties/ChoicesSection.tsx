import { Switch } from '@mantine/core';
import { ChoiceEditor } from '@/components/builder/ChoiceEditor';
import { PropertySection } from './PropertySection';
import { ChoiceCardsSettings } from './ChoiceCardsSettings';
import type { SectionProps } from './types';

export function ChoicesSection({ field, set }: SectionProps) {
  return (
    <>
      <PropertySection title={field.type === 'matrix' ? 'Answer columns' : 'Options'}>
        <ChoiceEditor options={field.options ?? []} onChange={(options) => set({ options })} />
        {field.type === 'chips' && (
          <Switch
            label="Allow multiple selections"
            description="Respondents can pick more than one chip."
            checked={field.allowMultiple ?? false}
            onChange={(e) => set({ allowMultiple: e.currentTarget.checked })}
          />
        )}
      </PropertySection>

      {(field.type === 'radio' || field.type === 'checkbox') && (
        <PropertySection title="Display">
          <ChoiceCardsSettings field={field} set={set} />
        </PropertySection>
      )}

      {field.type === 'matrix' && (
        <PropertySection title="Rows" description="The statements each column is answered against.">
          <ChoiceEditor options={field.rows ?? []} onChange={(rows) => set({ rows })} />
        </PropertySection>
      )}
    </>
  );
}
