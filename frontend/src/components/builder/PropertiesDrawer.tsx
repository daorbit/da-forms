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
  Anchor,
  Divider,
  Switch,
} from '@mantine/core';
import type { FormField, FieldSize } from '@/types';
import { optionTypes, numericTypes, textTypes, staticTypes } from '@/lib/fieldPalette';
import classes from './PropertiesDrawer.module.css';

interface Props {
  field: FormField | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<FormField>) => void;
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

  const isStatic = draft ? staticTypes.includes(draft.type) : false;

  return (
    <Drawer
      opened={!!field}
      onClose={onClose}
      position="right"
      size={700}
      title="Properties"
      classNames={{
        header: classes.header,
        title: classes.title,
        close: classes.close,
        body: classes.body,
        content: classes.content,
      }}
    >
      {draft && (
        <>
          <div className={classes.scrollArea}>
            <Stack gap="md">
              {isStatic ? (
                <Textarea
                  label={draft.type === 'divider' || draft.type === 'spacer' ? 'Note' : 'Content'}
                  value={draft.content ?? ''}
                  onChange={(e) => set({ content: e.target.value })}
                  autosize
                  minRows={2}
                  disabled={draft.type === 'divider' || draft.type === 'spacer'}
                />
              ) : (
                <>
                  <div>
                    <Group justify="space-between" mb={6}>
                      <Text size="sm" fw={500} c="dark.7">
                        Field Label
                      </Text>
                      <Anchor size="sm" c="teal" underline="always">
                        Rich Text
                      </Anchor>
                    </Group>
                    <TextInput value={draft.label} onChange={(e) => set({ label: e.target.value })} />
                  </div>

                  <Checkbox
                    label="Hide Field Label"
                    checked={draft.hideLabel ?? false}
                    onChange={(e) => set({ hideLabel: e.target.checked })}
                  />

                  <Textarea
                    label="Instructions"
                    value={draft.instructions ?? ''}
                    onChange={(e) => set({ instructions: e.target.value })}
                    autosize
                    minRows={4}
                  />

                  <div>
                    <Text size="sm" fw={500} mb={6} c="dark.7">
                      Field Size
                    </Text>
                    <SegmentedControl
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
                    label="Placeholder Text"
                    value={draft.placeholder ?? ''}
                    onChange={(e) => set({ placeholder: e.target.value })}
                  />

                  <TextInput
                    label="Hover Text"
                    value={draft.hoverText ?? ''}
                    onChange={(e) => set({ hoverText: e.target.value })}
                  />

                  <Divider my="xs" />

                  <TextInput
                    label="Initial Value"
                    value={draft.initialValue ?? ''}
                    onChange={(e) => set({ initialValue: e.target.value })}
                  />

                  {optionTypes.includes(draft.type) && (
                    <Textarea
                      label="Options"
                      description="One option per line"
                      value={(draft.options ?? []).join('\n')}
                      onChange={(e) => set({ options: e.target.value.split('\n').filter(Boolean) })}
                      autosize
                      minRows={3}
                    />
                  )}

                  {draft.type === 'regex' && (
                    <TextInput
                      label="Pattern"
                      description="Regular expression respondents must match"
                      value={draft.pattern ?? ''}
                      onChange={(e) => set({ pattern: e.target.value })}
                    />
                  )}

                  {textTypes.includes(draft.type) && (
                    <NumberInput
                      label="Character Limit"
                      description="Max"
                      w={200}
                      value={draft.maxLength ?? ''}
                      onChange={(value) => set({ maxLength: value === '' ? undefined : Number(value) })}
                    />
                  )}

                  {numericTypes.includes(draft.type) && (
                    <Group grow>
                      <NumberInput
                        label="Min"
                        value={draft.min ?? ''}
                        onChange={(value) => set({ min: value === '' ? undefined : Number(value) })}
                      />
                      <NumberInput
                        label="Max"
                        value={draft.max ?? ''}
                        onChange={(value) => set({ max: value === '' ? undefined : Number(value) })}
                      />
                    </Group>
                  )}

                  {draft.type === 'slider' && (
                    <NumberInput
                      label="Step"
                      w={200}
                      value={draft.step ?? 1}
                      onChange={(value) => set({ step: Number(value) || 1 })}
                    />
                  )}

                  {draft.type === 'rating' && (
                    <NumberInput
                      label="Number of stars"
                      w={200}
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
                      minRows={3}
                    />
                  )}

                  <Divider my="xs" />

                  <Switch
                    label="Required"
                    checked={draft.required}
                    onChange={(e) => set({ required: e.target.checked })}
                  />
                </>
              )}
            </Stack>
          </div>

          <div className={classes.footer}>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" radius="xl" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button color="teal" radius="xl" size="md" onClick={handleSave}>
                Save
              </Button>
            </Group>
          </div>
        </>
      )}
    </Drawer>
  );
}
