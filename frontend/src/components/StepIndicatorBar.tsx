import { Box, Group, Progress, Stack, Text } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import type { FormStep, StepIndicator } from '@/types';
import { contrastOn } from '@/lib/formTheme';
import classes from './StepIndicatorBar.module.css';

interface Props {
  variant: StepIndicator;
  steps: Required<FormStep>[];
  current: number;
  accent?: string;
  /** The form's resolved body text color, so the indicator reads on any card background. */
  textColor?: string;
  questions?: boolean;
}

const DEFAULT_ACCENT = 'var(--mantine-color-emerald-6)';

/**
 * Where the respondent is in a multi-step form. Every variant is driven by the
 * same `current`/`steps` pair, so switching between them never changes what
 * counts as a step.
 */
export function StepIndicatorBar({ variant, steps, current, accent, textColor, questions }: Props) {
  if (variant === 'none' || steps.length < 2) return null;

  const color = accent || DEFAULT_ACCENT;
  const muted = textColor ? { color: textColor, opacity: 0.7 } : undefined;
  const percent = ((current + 1) / steps.length) * 100;

  if (variant === 'counter') {
    return (
      <Text size="sm" fw={500} mt="md" mb="xs" c={textColor ? undefined : 'dimmed'} style={muted}>
        {questions
          ? `Question ${current + 1} of ${steps.length}`
          : `Step ${current + 1} of ${steps.length} — ${steps[current].title}`}
      </Text>
    );
  }

  if (variant === 'dots') {
    return (
      <Group gap={8} justify="center" mt="md" mb="xs">
        {steps.map((step, index) => (
          <Box
            key={index}
            title={step.title}
            style={{
              width: index === current ? 22 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: index <= current ? color : 'rgba(128,128,128,0.35)',
              transition: 'width 150ms ease, background-color 150ms ease',
            }}
          />
        ))}
      </Group>
    );
  }

  if (variant === 'stepper' || variant === 'stepperCompact') {
    const withTitles = variant === 'stepper';
    const vars = {
      ...(accent ? { '--step-accent': accent, '--step-on-accent': contrastOn(accent) } : {}),
      ...(textColor ? { '--step-text': textColor } : {}),
    } as React.CSSProperties;
    return (
      <ol className={classes.stepper} style={vars} aria-label="Progress">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={index}
              className={classes.step}
              data-reached={index <= current || undefined}
              data-active={active || undefined}
              aria-current={active ? 'step' : undefined}
              aria-label={withTitles ? undefined : step.title}
              title={withTitles ? undefined : step.title}
            >
              <span className={classes.circle}>
                {done ? <CheckIcon size={14} strokeWidth={3} /> : index + 1}
              </span>
              {withTitles && <span className={classes.title}>{step.title}</span>}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <Stack gap={4} mt="md" mb="xs">
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Text size="xs" fw={500} c={textColor ? undefined : 'dimmed'} style={muted} lineClamp={1}>
          {steps[current].title}
        </Text>
        <Text size="xs" c={textColor ? undefined : 'dimmed'} style={muted}>
          {current + 1} / {steps.length}
        </Text>
      </Group>
      <Progress
        value={percent}
        size={6}
        radius="xl"
        color={accent ? undefined : 'emerald'}
        styles={{
          root: { backgroundColor: 'rgba(128,128,128,0.22)' },
          section: accent ? { backgroundColor: accent } : undefined,
        }}
      />
    </Stack>
  );
}
