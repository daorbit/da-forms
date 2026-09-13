import { Box, Container } from '@mantine/core';
import type { FormTheme } from '@/types';
import { cardSurfaceStyle, pageSurfaceStyle } from '@/lib/formBackground';

interface Props {
  theme?: FormTheme;
  minHeight?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function FormPage({ theme, minHeight, children, footer }: Props) {
  const cardScope = theme?.scope === 'card';
  const height = minHeight ?? (cardScope ? 'auto' : '100vh');

  const surface = (
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
        {!cardScope && footer}
      </Container>
    </Box>
  );

  if (!cardScope) return surface;

  return (
    <Box className="da-forms-light-surface" data-mantine-color-scheme="light">
      {surface}
      {footer}
    </Box>
  );
}
