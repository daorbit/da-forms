import type { EditOp } from '@/lib/editOps';

export interface OrbitEditTurn {
  prompt: string;
  changes?: number;
  summary?: string;
  themeColors?: [string, string][];
}

export const ORBIT_EDIT_STARTERS = [
  'Make every field required',
  'Add a phone number field after the email',
  'Give the form a calm dark theme',
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export function themeColorsOf(ops: EditOp[]): [string, string][] | undefined {
  const theme = ops.find((o): o is Extract<EditOp, { op: 'setTheme' }> => o.op === 'setTheme');
  if (!theme) return undefined;
  const colors = Object.entries(theme.patch).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && HEX.test(entry[1]),
  );
  return colors.length ? colors : undefined;
}

export function replyText(turn: OrbitEditTurn): string {
  if (turn.changes === 0) return 'Nothing to change for that — try naming the field.';
  if (turn.summary) return turn.summary;
  return `Applied to the canvas — ${turn.changes} change${turn.changes === 1 ? '' : 's'}.`;
}
