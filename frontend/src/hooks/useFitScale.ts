import { useLayoutEffect, useState, type RefObject } from 'react';

interface Options {
  /** Skips measuring while the container is not on screen. */
  enabled: boolean;
  /** The content's natural width and height, before scaling. */
  contentWidth: number;
  contentHeight: number;
  /** Room left around the content inside the container. */
  padding?: { x: number; y: number };
}

/**
 * The largest scale at which `contentWidth × contentHeight` fits inside the
 * ref'd element, capped at 1:1 — content is shrunk to fit but never blown up,
 * which would misrepresent what it looks like at its real size.
 */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  { enabled, contentWidth, contentHeight, padding }: Options
): number {
  const [scale, setScale] = useState(1);
  const padX = padding?.x ?? 0;
  const padY = padding?.y ?? 0;

  useLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      const byWidth = (element.clientWidth - padX) / contentWidth;
      const byHeight = (element.clientHeight - padY) / contentHeight;
      const next = Math.min(1, byWidth, byHeight);
      // A container that has not been laid out yet measures zero, which is not
      // a scale — treating it as one would render the content unscaled and
      // overflowing until something else happened to trigger a re-measure.
      // The observer below fires again once it has a real size.
      if (!Number.isFinite(next) || next <= 0) return;
      setScale(next);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, contentWidth, contentHeight, padX, padY]);

  return scale;
}
