import { Box, NumberInput, SegmentedControl, Text, TextInput } from '@mantine/core';
import type { FieldSize } from '@/types';
import { FieldPair, PropertySection } from './PropertySection';
import type { SectionProps } from './types';

export function AppearanceSection({ field, set }: SectionProps) {
  return (
    <PropertySection title="Size & layout">
      <Box>
        <Text size="sm" fw={500} mb={6}>
          Field size
        </Text>
        <SegmentedControl
          fullWidth
          value={field.size ?? 'large'}
          onChange={(value) => set({ size: value as FieldSize })}
          disabled={!!field.customWidth}
          data={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />
      </Box>

      <FieldPair>
        <NumberInput
          label="Custom width"
          placeholder="Auto"
          suffix="px"
          min={40}
          value={field.customWidth ?? ''}
          onChange={(value) => set({ customWidth: value === '' ? undefined : Number(value) })}
        />
        <NumberInput
          label="Custom height"
          placeholder="Auto"
          suffix="px"
          min={24}
          value={field.customHeight ?? ''}
          onChange={(value) => set({ customHeight: value === '' ? undefined : Number(value) })}
        />
      </FieldPair>

      <TextInput
        label="CSS class"
        placeholder="Optional, for custom styling"
        value={field.cssClass ?? ''}
        onChange={(e) => set({ cssClass: e.target.value || undefined })}
      />
    </PropertySection>
  );
}
