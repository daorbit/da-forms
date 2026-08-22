import {
  Drawer,
  Stack,
  TextInput,
  Textarea,
  Checkbox,
  SegmentedControl,
  NumberInput,
  Group,
  Text,
  Switch,
} from '@mantine/core';
import type { FormField, FieldSize } from '@/types';
import {
  optionTypes,
  numericTypes,
  textTypes,
  staticTypes,
  paletteByType,
} from '@/lib/fieldPalette';
import classes from './PropertiesDrawer.module.css';

interface Props {
  field: FormField | null;
  onClose: () => void;
  /** Applied immediately — the canvas reflects every keystroke. */
  onChange: (id: string, patch: Partial<FormField>) => void;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={classes.section}>
      <span className={classes.sectionLabel}>{label}</span>
      <Stack gap="md">{children}</Stack>
    </section>
  );
}

export function PropertiesDrawer({ field, onClose, onChange }: Props) {
  const meta = field ? paletteByType[field.type] : null;
  const set = (patch: Partial<FormField>) => field && onChange(field.id, patch);

  return (
    <Drawer
      opened={!!field}
      onClose={onClose}
      position="right"
      size={520}
      // Mantine writes this onto the content element, which then drives the
      // header and body insets — setting the prop to 0 flattens both.
      padding="lg"
      // The canvas must stay visible and clickable while properties are edited,
      // so changes can be watched as they are typed.
      withOverlay={false}
      lockScroll={false}
      trapFocus={false}
      shadow="lg"
      title={
        meta && (
          <div className={classes.headerBar}>
            <span className={classes.headerTitle}>Properties</span>
            <span className={classes.fieldTypeChip}>
              <meta.icon size={13} stroke={1.7} />
              {meta.label}
            </span>
          </div>
        )
      }
      classNames={{
        header: classes.header,
        title: classes.title,
        body: classes.body,
        content: classes.content,
      }}
    >
      {field && (
        <>
          {staticTypes.includes(field.type) ? (
            <Section label="Content">
              <Textarea
                label={field.type === 'heading' ? 'Heading text' : 'Text'}
                value={field.content ?? ''}
                onChange={(e) => set({ content: e.target.value })}
                autosize
                minRows={2}
                disabled={field.type === 'divider' || field.type === 'spacer'}
                description={
                  field.type === 'divider' || field.type === 'spacer'
                    ? 'This element has no editable content.'
                    : undefined
                }
              />
            </Section>
          ) : (
            <>
              <Section label="Basics">
                <TextInput
                  label="Field label"
                  value={field.label}
                  onChange={(e) => set({ label: e.target.value })}
                />

                <Checkbox
                  label="Hide label on the form"
                  checked={field.hideLabel ?? false}
                  onChange={(e) => set({ hideLabel: e.target.checked })}
                />

                <Switch
                  label="Required"
                  description="Respondents cannot submit without answering."
                  checked={field.required}
                  onChange={(e) => set({ required: e.target.checked })}
                />
              </Section>

              <Section label="Appearance">
                <div>
                  <Text size="sm" fw={500} mb={6}>
                    Field size
                  </Text>
                  <SegmentedControl
                    fullWidth
                    value={field.size ?? 'large'}
                    onChange={(value) => set({ size: value as FieldSize })}
                    data={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                  />
                </div>

                <TextInput
                  label="Placeholder"
                  value={field.placeholder ?? ''}
                  onChange={(e) => set({ placeholder: e.target.value })}
                />

                <Textarea
                  label="Instructions"
                  description="Helper text shown beneath the label."
                  value={field.instructions ?? ''}
                  onChange={(e) => set({ instructions: e.target.value })}
                  autosize
                  minRows={2}
                />

                <TextInput
                  label="Hover text"
                  description="Tooltip shown on hover."
                  value={field.hoverText ?? ''}
                  onChange={(e) => set({ hoverText: e.target.value })}
                />
              </Section>

              {optionTypes.includes(field.type) && (
                <Section label="Options">
                  <Textarea
                    label="Choices"
                    description="One per line."
                    value={(field.options ?? []).join('\n')}
                    onChange={(e) => set({ options: e.target.value.split('\n') })}
                    autosize
                    minRows={4}
                  />
                </Section>
              )}

              <Section label="Validation & defaults">
                <TextInput
                  label="Initial value"
                  description="Prefilled when the form opens."
                  value={field.initialValue ?? ''}
                  onChange={(e) => set({ initialValue: e.target.value })}
                />

                {textTypes.includes(field.type) && (
                  <NumberInput
                    label="Character limit"
                    w={180}
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

                {numericTypes.includes(field.type) && (
                  <Group grow>
                    <NumberInput
                      label="Minimum"
                      value={field.min ?? ''}
                      onChange={(value) => set({ min: value === '' ? undefined : Number(value) })}
                    />
                    <NumberInput
                      label="Maximum"
                      value={field.max ?? ''}
                      onChange={(value) => set({ max: value === '' ? undefined : Number(value) })}
                    />
                  </Group>
                )}

                {field.type === 'slider' && (
                  <NumberInput
                    label="Step"
                    w={180}
                    value={field.step ?? 1}
                    onChange={(value) => set({ step: Number(value) || 1 })}
                  />
                )}

                {field.type === 'rating' && (
                  <NumberInput
                    label="Number of stars"
                    w={180}
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
              </Section>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
