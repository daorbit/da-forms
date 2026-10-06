import type { FormField } from '../models/form.model.js';
import { flattenFields } from './pipe.js';

function chosenOptions(field: FormField, answer: string): string[] {
  if (field.optionValues?.[answer] !== undefined) return [answer];
  return answer
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

export function leadScoreOf(fields: FormField[], data: Record<string, string>): number | undefined {
  const scored = flattenFields(fields).filter(
    (field) => field.optionValues && Object.keys(field.optionValues).length
  );
  if (!scored.length) return undefined;

  let total = 0;
  for (const field of scored) {
    const answer = data[field.id];
    if (!answer) continue;
    for (const option of chosenOptions(field, String(answer))) {
      total += field.optionValues![option] ?? 0;
    }
  }
  return total;
}
