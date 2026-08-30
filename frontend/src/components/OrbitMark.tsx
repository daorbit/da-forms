import { useComputedColorScheme } from '@mantine/core';

/**
 * The Orbit mark.
 *
 * The same artwork Quantalog uses, because it is the same assistant — the forms
 * builder reaches Orbit through Quantalog's API and spends the same allowance,
 * so showing it under a different name or icon would invent a second product.
 *
 * Two files rather than one: the artwork is not transparent, each is drawn on
 * its own ground, and the dark one on a light panel is a black square in the
 * corner. `useComputedColorScheme` resolves 'auto' to whichever the person is
 * actually seeing, which is what has to match.
 */
export function OrbitMark({ size = 20 }: { size?: number }) {
  // `getInitialValueInEffect: false` — the default defers to an effect, which
  // flashes the light mark on a dark page for a frame on first paint.
  const scheme = useComputedColorScheme('dark', { getInitialValueInEffect: false });

  return (
    <img
      src={scheme === 'dark' ? '/da-ai-dark-mode.png' : '/da-ai-light-mode.png'}
      alt=""
      // Decorative everywhere it is used — each place already carries a text
      // label or an aria-label, and "Orbit AI Orbit AI" is what a screen reader
      // would otherwise announce.
      aria-hidden="true"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        display: 'block',
        flexShrink: 0,
        objectFit: 'cover',
      }}
    />
  );
}
