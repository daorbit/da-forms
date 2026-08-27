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
): number | null {
  // Null until the container has been measured. Starting at 1 would paint one
  // frame at full size before the correction landed — which inside a modal
  // that mounts already open is a visible flash of an oversized, overflowing
  // preview, because the container cannot be measured until the modal has been
  // laid out. Callers render nothing until this is a number.
  const [scale, setScale] = useState<number | null>(null);
  const padX = padding?.x ?? 0;
  const padY = padding?.y ?? 0;

  useLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    /**
     * Returns false while the container has no usable size — which is the
     * state on the first pass when this runs inside a modal that is still
     * opening, and where treating the zero as a scale of 1 would render the
     * content full-size and overflowing.
     */
    const fit = () => {
      const width = element.clientWidth - padX;
      const height = element.clientHeight - padY;
      if (width <= 0 || height <= 0) return false;
      const next = Math.min(1, width / contentWidth, height / contentHeight);
      if (!Number.isFinite(next) || next <= 0) return false;
      setScale(next);
      return true;
    };

    // A ResizeObserver on the container alone is not enough here: inside a
    // modal that mounts already open, the container is laid out by an ancestor
    // transition, and its own box may never change again afterwards — so the
    // observer's one initial zero-size callback would be the only one it ever
    // got. Retrying on animation frames until the first real measurement
    // covers that, and the observer then handles genuine resizes.
    const retry = () => {
      if (fit()) return;
      frame = requestAnimationFrame(retry);
    };
    retry();

    const observer = new ResizeObserver(() => fit());
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, enabled, contentWidth, contentHeight, padX, padY]);

  return scale;
}
