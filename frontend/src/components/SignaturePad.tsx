import { useEffect, useRef, useState } from 'react';
import { Box, Button, Group, Text } from '@mantine/core';

interface Props {
  /** A PNG data URL, or '' when nothing has been drawn. */
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  inputBg?: string;
  inputBorder?: string;
  penColor?: string;
  error?: boolean;
}

/**
 * Draw-to-sign, stored as a PNG data URL.
 *
 * Pointer events rather than separate mouse and touch handlers: one code path
 * covers a mouse, a finger and a stylus, and pointer capture keeps a stroke
 * attached to the canvas when the hand leaves its edge mid-signature.
 *
 * The bitmap is sized to the element's real pixel size, so a signature drawn on
 * a phone is not a blurry upscale of a 300px canvas.
 */
export function SignaturePad({
  value,
  onChange,
  readOnly,
  inputBg,
  inputBorder,
  penColor,
  error,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  /** Sets the backing bitmap to the box's size and repaints what was there. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function fit() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = window.devicePixelRatio || 1;
      // Resizing a canvas clears it, so anything already signed is redrawn.
      const previous = value;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor || '#111827';
      if (previous) {
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = previous;
      }
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => observer.disconnect();
    // Deliberately not re-running on `value`: every stroke changes it, and
    // refitting mid-signature would wipe the stroke in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [penColor]);

  function positionOf(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = positionOf(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || readOnly) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = positionOf(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasInk(true);
    onChange(canvas.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange('');
  }

  return (
    <Box>
      <Box
        style={{
          position: 'relative',
          border: `1px solid ${error ? 'var(--mantine-color-red-6)' : inputBorder || 'var(--mantine-color-gray-4)'}`,
          borderRadius: 8,
          backgroundColor: inputBg || '#ffffff',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          style={{
            display: 'block',
            width: '100%',
            height: 140,
            // Without this a finger drag scrolls the page instead of signing.
            touchAction: 'none',
            cursor: readOnly ? 'default' : 'crosshair',
          }}
        />
        {!hasInk && (
          <Text
            size="xs"
            c="dimmed"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            Sign here
          </Text>
        )}
      </Box>
      {!readOnly && (
        <Group justify="flex-end" mt={4}>
          <Button size="compact-xs" variant="subtle" color="gray" onClick={clear} disabled={!hasInk}>
            Clear
          </Button>
        </Group>
      )}
    </Box>
  );
}
