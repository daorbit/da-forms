import { NumberInput, Select, Switch, Textarea, TextInput } from '@mantine/core';
import type { FormField } from '@/types';
import { numericTypes, textTypes } from '@/lib/fieldPalette';
import { FieldPair, PropertySection } from './PropertySection';
import type { SectionProps } from './types';

const DATE_DEFAULT_TYPES: FormField['type'][] = ['date', 'time', 'datetime', 'monthYear'];

const DATE_DEFAULT_SENTINEL: Record<string, string> = {
  date: '__today__',
  time: '__now__',
  datetime: '__now__',
  monthYear: '__today__',
};

const DATE_DEFAULT_LABEL: Record<string, string> = {
  date: "Today's date",
  time: 'Current time',
  datetime: 'Current date & time',
  monthYear: 'Current month',
};

function DefaultValue({ field, set }: SectionProps) {
  if (DATE_DEFAULT_TYPES.includes(field.type)) {
    return (
      <Select
        label="Default value"
        description="Prefilled when the form opens."
        placeholder="None"
        clearable
        data={[{ value: DATE_DEFAULT_SENTINEL[field.type], label: DATE_DEFAULT_LABEL[field.type] }]}
        value={field.initialValue ?? null}
        onChange={(v) => set({ initialValue: v ?? undefined })}
      />
    );
  }
  if (field.type === 'yesNo') {
    return (
      <Select
        label="Default answer"
        description="Prefilled when the form opens."
        placeholder="None"
        clearable
        data={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        value={field.initialValue ?? null}
        onChange={(v) => set({ initialValue: v ?? undefined })}
      />
    );
  }
  if (field.type === 'terms' || field.type === 'decisionBox') {
    return (
      <Switch
        label="Checked by default"
        checked={field.initialValue === 'true'}
        onChange={(e) => set({ initialValue: e.currentTarget.checked ? 'true' : undefined })}
      />
    );
  }
  return (
    <TextInput
      label="Default value"
      description="Prefilled when the form opens."
      value={field.initialValue ?? ''}
      onChange={(e) => set({ initialValue: e.target.value })}
    />
  );
}

export function ValidationSection({ field, set }: SectionProps) {
  const numeric = numericTypes.includes(field.type) || field.type === 'nps';

  return (
    <PropertySection title="Validation & defaults">
      <DefaultValue field={field} set={set} />

      {textTypes.includes(field.type) && (
        <NumberInput
          label="Character limit"
          placeholder="No limit"
          value={field.maxLength ?? ''}
          onChange={(value) => set({ maxLength: value === '' ? undefined : Number(value) })}
        />
      )}

      {field.type === 'regex' && (
        <TextInput
          label="Pattern"
          description="Regular expression the answer must match."
          value={field.pattern ?? ''}
          onChange={(e) => set({ pattern: e.target.value })}
        />
      )}

      {numeric && (
        <FieldPair>
          <NumberInput
            label={field.type === 'nps' ? 'Scale from' : 'Minimum'}
            value={field.min ?? ''}
            onChange={(value) => set({ min: value === '' ? undefined : Number(value) })}
          />
          <NumberInput
            label={field.type === 'nps' ? 'Scale to' : 'Maximum'}
            value={field.max ?? ''}
            onChange={(value) => set({ max: value === '' ? undefined : Number(value) })}
          />
        </FieldPair>
      )}

      {field.type === 'slider' && (
        <NumberInput label="Step" value={field.step ?? 1} onChange={(value) => set({ step: Number(value) || 1 })} />
      )}

      {field.type === 'rating' && (
        <NumberInput
          label="Number of stars"
          min={2}
          max={10}
          value={field.maxRating ?? 5}
          onChange={(value) => set({ maxRating: Number(value) || 5 })}
        />
      )}

      {(field.type === 'terms' || field.type === 'decisionBox') && (
        <Textarea
          label={field.type === 'terms' ? 'Terms text' : 'Consent text'}
          value={field.content ?? ''}
          onChange={(e) => set({ content: e.target.value })}
          autosize
          minRows={4}
        />
      )}
    </PropertySection>
  );
}
