import { Button, NumberInput, SegmentedControl, Textarea, TextInput } from '@mantine/core';
import type { FormField } from '@/types';
import { flattenFields } from '@/lib/fieldTree';
import { staticTypes } from '@/lib/fieldPalette';
import { evaluateFormula } from '@/lib/formula';
import { FieldPair, PropertySection } from './PropertySection';
import type { SectionProps } from './types';
import classes from './FormulaSection.module.css';

export function FormulaSection({ field, set, allFields }: SectionProps & { allFields: FormField[] }) {
  const referable = flattenFields(allFields).filter(
    (candidate) =>
      candidate.id !== field.id &&
      candidate.type !== 'grid' &&
      candidate.type !== 'repeater' &&
      !staticTypes.includes(candidate.type) &&
      Boolean(candidate.label?.trim())
  );

  const formulaError = field.formula?.trim()
    ? (() => {
        const result = evaluateFormula(field.formula, new Map());
        return result.ok ? undefined : result.reason;
      })()
    : undefined;

  return (
    <PropertySection title="Formula" description="Worked out from other answers as the respondent types.">
      <Textarea
        label="Expression"
        description="Refer to questions by name, e.g. {{Quantity}} * {{Unit price}}. Supports + - * / % and brackets."
        placeholder="{{Quantity}} * {{Unit price}}"
        autosize
        minRows={2}
        value={field.formula ?? ''}
        onChange={(e) => set({ formula: e.target.value || undefined })}
        error={formulaError}
      />

      {referable.length > 0 && (
        <div className={classes.refs}>
          <span className={classes.refsLabel}>Click to insert</span>
          <div className={classes.refList}>
            {referable.map((f) => (
              <Button
                key={f.id}
                size="compact-xs"
                variant="light"
                color="gray"
                onClick={() => set({ formula: `${field.formula ?? ''}{{${f.label}}}` })}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <SegmentedControl
        fullWidth
        value={field.formulaFormat ?? 'number'}
        onChange={(value) => set({ formulaFormat: value as 'number' | 'currency' })}
        data={[
          { value: 'number', label: 'Number' },
          { value: 'currency', label: 'Currency' },
        ]}
      />

      <FieldPair>
        {field.formulaFormat === 'currency' && (
          <TextInput
            label="Currency symbol"
            placeholder="₹"
            value={field.formulaCurrency ?? ''}
            onChange={(e) => set({ formulaCurrency: e.target.value || undefined })}
          />
        )}
        <NumberInput
          label="Decimal places"
          min={0}
          max={6}
          value={field.formulaPrecision ?? (field.formulaFormat === 'currency' ? 2 : 0)}
          onChange={(value) => set({ formulaPrecision: typeof value === 'number' ? value : undefined })}
        />
      </FieldPair>
    </PropertySection>
  );
}
