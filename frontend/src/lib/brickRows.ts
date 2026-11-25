export type BrickRow = {
  height: number;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  split?: 'lead' | 'trail';
};

export function brickRows(count: number, height: number): BrickRow[] {
  return Array.from({ length: count }, () => ({ height }));
}
