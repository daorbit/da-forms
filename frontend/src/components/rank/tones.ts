export type RankTone =
  | "teal"
  | "emerald"
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "rose"
  | "orange"
  | "amber"
  | "cyan";

const MANTINE_TO_TONE: Record<string, RankTone> = {
  grape: "violet",
  green: "emerald",
  red: "rose",
  yellow: "amber",
};

export function toRankTone(color: string | undefined, fallback: RankTone = "teal"): RankTone {
  if (!color) return fallback;
  return MANTINE_TO_TONE[color] ?? (color as RankTone);
}
