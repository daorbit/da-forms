export function relativeTime(iso: string): string {
  const then = new Date(iso);
  const s = Math.floor((Date.now() - then.getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function updatedAgoLabel(at: number): string {
  return `Updated ${relativeTime(new Date(at).toISOString())}`;
}
