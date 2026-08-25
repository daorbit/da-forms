import { Alert, Box, Drawer, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { FormField, FormStep, StepIndicator } from '@/types';
import { StepIndicatorBar } from '@/components/StepIndicatorBar';
import { pageCount, resolveSteps } from '@/lib/formSteps';
import classes from './drawer.module.css';

export interface StepSettings {
  steps: FormStep[];
  stepIndicator: StepIndicator;
  showStepHeadings: boolean;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  fields: FormField[];
  settings: StepSettings;
  onChange: (patch: Partial<StepSettings>) => void;
  accent?: string;
}

const INDICATORS: { value: StepIndicator; label: string }[] = [
  { value: 'progress', label: 'Bar' },
  { value: 'stepper', label: 'Stepper' },
  { value: 'dots', label: 'Dots' },
  { value: 'counter', label: 'Text' },
  { value: 'none', label: 'None' },
];

/**
 * Names and progress style for a multi-step form. Steps are derived from the
 * canvas's page breaks — this panel only names them, so adding a step is still
 * a matter of dropping a Page Break where it belongs.
 */
export function StepsDrawer({ opened, onClose, fields, settings, onChange, accent }: Props) {
  const count = pageCount(fields);
  const preview = resolveSteps(fields, settings.steps);

  function setStep(index: number, patch: Partial<FormStep>) {
    // Padded to `index` so naming step 3 before step 2 doesn't leave a hole.
    const next: FormStep[] = Array.from({ length: Math.max(count, settings.steps.length) }, (_, i) => ({
      ...(settings.steps[i] ?? {}),
    }));
    next[index] = { ...next[index], ...patch };
    onChange({ steps: next });
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Steps & progress"
      padding="lg"
      classNames={classes}
    >
      {count < 2 ? (
        <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
          This form is a single page. Drop a <b>Page Break</b> onto the canvas to split it into steps — then come back
          here to name them.
        </Alert>
      ) : (
        <Stack gap="xl">
          <div>
            <Text size="sm" fw={500} mb={8}>
              Progress indicator
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.stepIndicator}
              onChange={(value) => onChange({ stepIndicator: value as StepIndicator })}
              data={INDICATORS}
            />
            <Box mt="md" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
              <StepIndicatorBar
                variant={settings.stepIndicator}
                steps={preview}
                current={Math.min(1, count - 1)}
                accent={accent}
              />
              {settings.stepIndicator === 'none' && (
                <Text size="xs" c="dimmed" ta="center">
                  No indicator shown.
                </Text>
              )}
            </Box>
          </div>

          <Switch
            label="Show step name above the fields"
            description="The title and description below appear at the top of each step."
            checked={settings.showStepHeadings}
            onChange={(e) => onChange({ showStepHeadings: e.currentTarget.checked })}
          />

          <Stack gap="lg">
            <Text size="sm" fw={600}>
              Step names
            </Text>
            {Array.from({ length: count }, (_, index) => (
              <Stack key={index} gap={6}>
                <Text size="xs" fw={600} c="dimmed">
                  STEP {index + 1}
                </Text>
                <TextInput
                  placeholder={`Step ${index + 1}`}
                  value={settings.steps[index]?.title ?? ''}
                  onChange={(e) => setStep(index, { title: e.currentTarget.value })}
                />
                <TextInput
                  placeholder="Short description (optional)"
                  value={settings.steps[index]?.description ?? ''}
                  onChange={(e) => setStep(index, { description: e.currentTarget.value })}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
