import { Box, Group, Progress, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { FormStep, StepIndicator } from '@/types';

interface Props {
  variant: StepIndicator;
  steps: Required<FormStep>[];
  current: number;
  accent?: string;
  /** The form's resolved body text color, so the indicator reads on any card background. */
  textColor?: string;
}

const DEFAULT_ACCENT = 'var(--mantine-color-emerald-6)';

/**
 * Where the respondent is in a multi-step form. Every variant is driven by the
 * same `current`/`steps` pair, so switching between them never changes what
 * counts as a step.
 */
export function StepIndicatorBar({ variant, steps, current, accent, textColor }: Props) {
  if (variant === 'none' || steps.length < 2) return null;

  const color = accent || DEFAULT_ACCENT;
  const muted = textColor ? { color: textColor, opacity: 0.7 } : undefined;
  const percent = ((current + 1) / steps.length) * 100;

  if (variant === 'counter') {
    return (
      <Text size="sm" fw={500} mt="md" mb="xs" c={textColor ? undefined : 'dimmed'} style={muted}>
        Step {current + 1} of {steps.length} — {steps[current].title}
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

  if (variant === 'stepper') {
    return (
      <Group gap={0} align="flex-start" wrap="nowrap" mt="md" mb="xs">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <Group key={index} gap={0} align="flex-start" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Stack gap={6} align="center" style={{ flex: 1, minWidth: 0 }}>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: done || active ? '#fff' : undefined,
                    backgroundColor: done || active ? color : 'rgba(128,128,128,0.22)',
                    border: active ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >
                  {done ? <IconCheck size={15} stroke={3} /> : index + 1}
                </Box>
                <Text
                  size="xs"
                  ta="center"
                  fw={active ? 600 : 400}
                  lineClamp={2}
                  c={textColor ? undefined : active ? undefined : 'dimmed'}
                  style={textColor ? { color: textColor, opacity: active ? 1 : 0.7 } : undefined}
                >
                  {step.title}
                </Text>
              </Stack>
              {/* Connector between circles — never after the last one. */}
              {index < steps.length - 1 && (
                <Box
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: 13,
                    minWidth: 12,
                    backgroundColor: index < current ? color : 'rgba(128,128,128,0.25)',
                  }}
                />
              )}
            </Group>
          );
        })}
      </Group>
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
        size="sm"
        color={accent ? undefined : 'emerald'}
        styles={accent ? { section: { backgroundColor: accent } } : undefined}
      />
    </Stack>
  );
}
