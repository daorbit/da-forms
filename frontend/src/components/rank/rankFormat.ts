export function num(n: number): string {
  return n.toLocaleString();
}

export function share(count: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}
