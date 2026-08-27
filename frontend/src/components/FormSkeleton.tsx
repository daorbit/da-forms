import { Paper, Skeleton, Stack, Group } from '@mantine/core';
import type { FormTheme } from '@/types';
import { cardSurfaceStyle } from '@/lib/formBackground';

interface Props {
  theme?: FormTheme;
}

/**
 * The form's shape, while the form itself is being fetched.
 *
 * A spinner says only "wait"; this says what is coming — a card, a heading, and
 * a stack of fields — so the page it resolves into is the one the reader was
 * already looking at rather than a sudden replacement. It sits in the same
 * `Paper` the real renderer uses, so the card, its border and the theme's own
 * surface are already correct before the data lands.
 *
 * Deliberately generic: the field count and header are unknown until the form
 * arrives, so this draws a plausible short form rather than guessing at the
 * real one and being wrong in a way the reader notices.
 */
export function FormSkeleton({ theme }: Props) {
  return (
    <Paper withBorder radius="md" p="xl" style={cardSurfaceStyle(theme)}>
      <Stack gap="xl">
        {/* Title and description. */}
        <Stack gap={10}>
          <Skeleton height={26} width="55%" radius="sm" />
          <Skeleton height={13} width="80%" radius="sm" />
        </Stack>

        {/* Three fields: a label above an input, which is what most of a form is. */}
        <Stack gap="lg">
          {[0, 1, 2].map((i) => (
            <Stack key={i} gap={8}>
              <Skeleton height={11} width={i === 1 ? 92 : 116} radius="sm" />
              <Skeleton height={38} radius="sm" />
            </Stack>
          ))}

          {/* A taller block, standing in for the message field most forms end on. */}
          <Stack gap={8}>
            <Skeleton height={11} width={104} radius="sm" />
            <Skeleton height={92} radius="sm" />
          </Stack>
        </Stack>

        {/* The submit button, at the width the real one usually takes. */}
        <Group justify="center">
          <Skeleton height={40} width="100%" radius="sm" />
        </Group>
      </Stack>
    </Paper>
  );
}
