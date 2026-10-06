import { Textarea, TextInput } from '@mantine/core';
import { FieldPair, PropertySection, ToggleList, ToggleRow } from './PropertySection';
import type { SectionProps } from './types';

export function BasicsSection({ field, set }: SectionProps) {
  return (
    <>
      <PropertySection title="Question">
        <TextInput label="Label" value={field.label} onChange={(e) => set({ label: e.target.value })} />
        <Textarea
          label="Help text"
          placeholder="Optional guidance shown under the label"
          value={field.instructions ?? ''}
          onChange={(e) => set({ instructions: e.target.value })}
          autosize
          minRows={1}
        />
        <FieldPair>
          <TextInput
            label="Placeholder"
            placeholder="None"
            value={field.placeholder ?? ''}
            onChange={(e) => set({ placeholder: e.target.value })}
          />
          <TextInput
            label="Tooltip"
            placeholder="Shown on hover"
            value={field.hoverText ?? ''}
            onChange={(e) => set({ hoverText: e.target.value })}
          />
        </FieldPair>
      </PropertySection>

      <PropertySection title="Behaviour">
        <ToggleList>
          <ToggleRow
            label="Required"
            hint="Respondents cannot submit without answering."
            checked={field.required}
            onChange={(required) => set({ required })}
          />
          {field.type !== 'repeater' && (
            <ToggleRow
              label="Must be unique"
              hint="Rejects an answer that matches an earlier response."
              checked={field.unique ?? false}
              onChange={(unique) => set({ unique })}
            />
          )}
          <ToggleRow
            label="Hide label"
            hint="Show the input without its label on the form."
            checked={field.hideLabel ?? false}
            onChange={(hideLabel) => set({ hideLabel })}
          />
        </ToggleList>
      </PropertySection>
    </>
  );
}
