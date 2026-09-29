export const HEX_COLOR = /^#?[0-9a-fA-F]{6}$/;

export function hexToRgb(hex: string) {
  const value = parseInt(hex.replace('#', ''), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value + (target - value) * t)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

const SCALE_STEPS = [0.92, 0.8, 0.64, 0.44, 0.22, 0.08, -0.14, -0.3, -0.46, -0.6];

export function buildScale(hex: string, anchor: number): string[] {
  const at = SCALE_STEPS[anchor];
  return SCALE_STEPS.map((s, i) => {
    if (i === anchor) return hex;
    const rel = s > at ? (s - at) / (SCALE_STEPS[0] - at) : (s - at) / (at - SCALE_STEPS[9]);
    return shade(hex, rel * (s > at ? 0.92 : 0.72));
  });
}

export function normalizeHex(hex: string): string {
  return `#${hex.replace('#', '').toLowerCase()}`;
}
