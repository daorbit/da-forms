import { Alert, Box, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import { InfoIcon, ListOrderedIcon } from 'lucide-react';
import type { FormField, FormStep, StepIndicator } from '@/types';
import { StepIndicatorBar } from '@/components/StepIndicatorBar';
import { PanelDrawer } from '@/components/ui/PanelDrawer';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import { pageCount, resolveSteps } from '@/lib/formSteps';
import { questionIndicator, questionSteps, splitIntoQuestions } from '@/lib/questionPages';
import classes from './StepsDrawer.module.css';

export interface StepSettings {
  steps: FormStep[];
  stepIndicator: StepIndicator;
  showStepHeadings: boolean;
  oneQuestionAtATime: boolean;
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

const QUESTION_INDICATORS = INDICATORS.filter((i) => ['progress', 'counter', 'none'].includes(i.value));

/**
 * Names and progress style for a multi-step form. Steps are derived from the
 * canvas's page breaks — this panel only names them, so adding a step is still
 * a matter of dropping a Page Break where it belongs.
 */
export function StepsDrawer({ opened, onClose, fields, settings, onChange, accent }: Props) {
  const oneQuestion = settings.oneQuestionAtATime;
  const count = pageCount(fields);
  const questions = oneQuestion ? questionSteps(splitIntoQuestions(fields).pages) : [];
  const preview = oneQuestion ? questions : resolveSteps(fields, settings.steps);
  const indicator = questionIndicator(settings.stepIndicator, oneQuestion);
  const showsProgress = oneQuestion ? questions.length > 1 : count > 1;

  function setStep(index: number, patch: Partial<FormStep>) {
    // Padded to `index` so naming step 3 before step 2 doesn't leave a hole.
    const next: FormStep[] = Array.from({ length: Math.max(count, settings.steps.length) }, (_, i) => ({
      ...(settings.steps[i] ?? {}),
    }));
    next[index] = { ...next[index], ...patch };
    onChange({ steps: next });
  }

  return (
    <PanelDrawer
      opened={opened}
      onClose={onClose}
      title="Steps & progress"
      subtitle="Name each step and pick how progress is shown"
      icon={<ListOrderedIcon size={16} />}
      size={480}
    >
      <Stack gap="xl">
        <Stack gap={6}>
          <Switch
            label="One question at a time"
            description="Each question gets its own screen with a larger label. Choice, yes/no, rating and NPS questions move on as soon as they're answered."
            checked={oneQuestion}
            onChange={(e) => onChange({ oneQuestionAtATime: e.currentTarget.checked })}
          />
          <DocsLink path={DOCS.oneQuestion} />
        </Stack>

        {!showsProgress ? (
          <Alert icon={<InfoIcon size={18} />} color="gray" variant="light">
            {oneQuestion ? (
              'Add a second question to see progress here.'
            ) : (
              <>
                This form is a single page. Drop a <b>Page Break</b> onto the canvas to split it into steps — then
                come back here to name them.
              </>
            )}
          </Alert>
        ) : (
          <>
            <div>
              <div className={classes.label}>Progress indicator</div>
              <SegmentedControl
                fullWidth
                value={indicator}
                onChange={(value) => onChange({ stepIndicator: value as StepIndicator })}
                data={oneQuestion ? QUESTION_INDICATORS : INDICATORS}
              />
              <Box mt="md" className={classes.preview}>
                <StepIndicatorBar
                  variant={indicator}
                  questions={oneQuestion}
                  steps={preview}
                  current={Math.min(1, preview.length - 1)}
                  accent={accent}
                />
                {indicator === 'none' && (
                  <Text size="xs" c="dimmed" ta="center">
                    No indicator shown.
                  </Text>
                )}
              </Box>
            </div>

            {!oneQuestion && (
              <>
                <Switch
                  label="Show step name above the fields"
                  description="The title and description below appear at the top of each step."
                  checked={settings.showStepHeadings}
                  onChange={(e) => onChange({ showStepHeadings: e.currentTarget.checked })}
                />

                <Stack gap="lg">
                  <div className={classes.label}>Step names</div>
                  {Array.from({ length: count }, (_, index) => (
                    <Stack key={index} gap={6}>
                      <span className={classes.stepLabel}>Step {index + 1}</span>
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
              </>
            )}
          </>
        )}
      </Stack>
    </PanelDrawer>
  );
}
