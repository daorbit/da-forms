import { Types } from 'mongoose';

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 400;

function parse(value: unknown): number {
  return typeof value === 'string' ? Date.parse(value) : Number.NaN;
}

export function readRange(fromValue: unknown, toValue: unknown) {
  const now = Date.now();
  const toRaw = parse(toValue);
  const to = new Date(Number.isNaN(toRaw) ? now : Math.min(toRaw, now));
  const fromRaw = parse(fromValue);
  const fallback = to.getTime() - 30 * DAY_MS;
  const from = new Date(Math.max(Math.min(Number.isNaN(fromRaw) ? fallback : fromRaw, to.getTime()), to.getTime() - MAX_RANGE_DAYS * DAY_MS));
  return { from, to };
}

export function idRange(from: Date, to: Date) {
  return {
    $gte: Types.ObjectId.createFromTime(Math.floor(from.getTime() / 1000)),
    $lt: Types.ObjectId.createFromTime(Math.floor(to.getTime() / 1000)),
  };
}