import { useEffect, useState } from 'react';
import {
  Drawer,
  Stack,
  TextInput,
  Textarea,
  Checkbox,
  SegmentedControl,
  NumberInput,
  Group,
  Button,
  Text,
  Switch,
  Select,
} from '@mantine/core';
import type { FormField, FieldSize, FieldType } from '@/types';
import {
  optionTypes,
  numericTypes,
  textTypes,
  staticTypes,
  paletteByType,
  fieldPalette,
} from '@/lib/fieldPalette';
import classes from './PropertiesDrawer.module.css';

interface Props {
  field: FormField | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<FormField>) => void;
}

const typeOptions = fieldPalette.map((group) => ({
  group: group.group,
  items: group.items.map((item) => ({ value: item.type, label: item.label })),
}));

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={classes.section}>
      <span className={classes.sectionLabel}>{label}</span>
      <Stack gap="md">{children}</Stack>
    </section>
  );
}

export function PropertiesDrawer({ field, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<FormField | null>(field);

  useEffect(() => {
    setDraft(field);
  }, [field]);

  const set = (patch: Partial<FormField>) => draft && setDraft({ ...draft, ...patch });

  function handleSave() {
    if (!draft) return;
    onSave(draft.id, draft);
    onClose();
  }

  const meta = draft ? paletteByType[draft.type] : null;
  const isStatic = draft ? staticTypes.includes(draft.type) : false;

  return (
    <Drawer
      opened={!!field}
      onClose={onClose}
      position="right"
      size={480}
      title={
        meta && (
          <Group gap="sm">
            <Text fw={600} size="sm">
              Field properties
            </Text>
            <span className={classes.fieldTypeChip}>
              <meta.icon size={13} stroke={1.7} />
              {meta.label}
            </span>
          </Group>
        )
      }
      classNames={{
        header: classes.header,
        title: classes.title,
        body: classes.body,
        content: classes.content,
      }}
    >
      {draft && (
        <>
          <div className={classes.scrollArea}>
            {isStatic ? (
              <Section label="Content">
                <Textarea
                  label={draft.type === 'heading' ? 'Heading text' : 'Text'}
                  value={draft.content ?? ''}
                  onChange={(e) => set({ content: e.target.value })}
                  autosize
                  minRows={2}
                  disabled={draft.type === 'divider' || draft.type === 'spacer'}
                  description={
                    draft.type === 'divider' || draft.type === 'spacer'
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
                    value={draft.label}
                    onChange={(e) => set({ label: e.target.value })}
                  />

                  <Select
                    label="Field type"
                    value={draft.type}
                    data={typeOptions}
                    onChange={(value) => value && set({ type: value as FieldType })}
                    searchable
                  />

                  <Checkbox
                    label="Hide label on the form"
                    checked={draft.hideLabel ?? false}
                    onChange={(e) => set({ hideLabel: e.target.checked })}
                  />

                  <Switch
                    label="Required"
                    description="Respondents cannot submit without answering."
                    checked={draft.required}
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
                      value={draft.size ?? 'large'}
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
                    value={draft.placeholder ?? ''}
                    onChange={(e) => set({ placeholder: e.target.value })}
                  />

                  <Textarea
                    label="Instructions"
                    description="Helper text shown beneath the label."
                    value={draft.instructions ?? ''}
                    onChange={(e) => set({ instructions: e.target.value })}
                    autosize
                    minRows={2}
                  />

                  <TextInput
                    label="Hover text"
                    description="Tooltip shown on hover."
                    value={draft.hoverText ?? ''}
                    onChange={(e) => set({ hoverText: e.target.value })}
                  />
                </Section>

                {optionTypes.includes(draft.type) && (
                  <Section label="Options">
                    <Textarea
                      label="Choices"
                      description="One per line."
                      value={(draft.options ?? []).join('\n')}
                      onChange={(e) => set({ options: e.target.value.split('\n').filter(Boolean) })}
                      autosize
                      minRows={4}
                    />
                  </Section>
                )}

                <Section label="Validation & defaults">
                  <TextInput
                    label="Initial value"
                    description="Prefilled when the form opens."
                    value={draft.initialValue ?? ''}
                    onChange={(e) => set({ initialValue: e.target.value })}
                  />

                  {textTypes.includes(draft.type) && (
                    <NumberInput
                      label="Character limit"
                      w={180}
                      value={draft.maxLength ?? ''}
                      onChange={(value) => set({ maxLength: value === '' ? undefined : Number(value) })}
                    />
                  )}

                  {draft.type === 'regex' && (
                    <TextInput
                      label="Pattern"
                      description="Regular expression the answer must match."
                      value={draft.pattern ?? ''}
                      onChange={(e) => set({ pattern: e.target.value })}
                    />
                  )}

                  {numericTypes.includes(draft.type) && (
                    <Group grow>
                      <NumberInput
                        label="Minimum"
                        value={draft.min ?? ''}
                        onChange={(value) => set({ min: value === '' ? undefined : Number(value) })}
                      />
                      <NumberInput
                        label="Maximum"
                        value={draft.max ?? ''}
                        onChange={(value) => set({ max: value === '' ? undefined : Number(value) })}
                      />
                    </Group>
                  )}

                  {draft.type === 'slider' && (
                    <NumberInput
                      label="Step"
                      w={180}
                      value={draft.step ?? 1}
                      onChange={(value) => set({ step: Number(value) || 1 })}
                    />
                  )}

                  {draft.type === 'rating' && (
                    <NumberInput
                      label="Number of stars"
                      w={180}
                      min={2}
                      max={10}
                      value={draft.maxRating ?? 5}
                      onChange={(value) => set({ maxRating: Number(value) || 5 })}
                    />
                  )}

                  {(draft.type === 'terms' || draft.type === 'decisionBox') && (
                    <Textarea
                      label={draft.type === 'terms' ? 'Terms text' : 'Consent text'}
                      value={draft.content ?? ''}
                      onChange={(e) => set({ content: e.target.value })}
                      autosize
                      minRows={4}
                    />
                  )}
                </Section>
              </>
            )}
          </div>

          <div className={classes.footer}>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save changes</Button>
            </Group>
          </div>
        </>
      )}
    </Drawer>
  );
}
