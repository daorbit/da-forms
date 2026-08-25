import { Box, Container } from '@mantine/core';
import type { FormTheme } from '@/types';
import { cardSurfaceStyle, pageSurfaceStyle } from '@/lib/formBackground';

interface Props {
  theme?: FormTheme;
  /** Fills the viewport on the real public page; fills the frame in preview. */
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
export function FormPage({ theme, minHeight = '100vh', children }: Props) {
  const cardScope = theme?.scope === 'card';

  return (
    <Box
      className="da-forms-light-surface"
      data-mantine-color-scheme="light"
      style={{
        minHeight,
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
