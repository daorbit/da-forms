import { Box, Container } from '@mantine/core';
import type { FormTheme } from '@/types';
import { cardSurfaceStyle, pageSurfaceStyle } from '@/lib/formBackground';

interface Props {
  theme?: FormTheme;
  /**
   * Fills the viewport on the real public page; fills the frame in preview.
   * Defaults per scope — see below.
   */
  minHeight?: string;
  children: React.ReactNode;
}

/**
 * The page a respondent lands on: the themed background, and the card
 * centered on it. Shared by the public share link and the builder's preview,
 * so the two can never disagree about what a form's page looks like.
 *
 * "Embedded on a site" means only the card is meant to have a look at all —
 * centering it in a page-sized container would add a margin no host page asked
 * for. The wrapper still borrows the card's own colour past its height, since
 * there is no host page behind it here.
 */
export function FormPage({ theme, minHeight, children }: Props) {
  const cardScope = theme?.scope === 'card';

  // An embedded form is as tall as its card. Stretching it to the viewport
  // would leave the host's iframe padded with the card's own colour below the
  // last field — the gap embedders see. Only a standalone page, which owns the
  // whole viewport, fills it.
  const height = minHeight ?? (cardScope ? 'auto' : '100vh');

  return (
    <Box
      className="da-forms-light-surface"
      data-mantine-color-scheme="light"
      style={{
        minHeight: height,
        ...(cardScope
          ? { backgroundColor: cardSurfaceStyle(theme).backgroundColor }
          : pageSurfaceStyle(theme)),
      }}
    >
      <Container size={cardScope ? '100%' : 'sm'} py={cardScope ? 0 : 'xl'} px={cardScope ? 0 : 'md'}>
        {children}
      </Container>
    </Box>
  );
}
