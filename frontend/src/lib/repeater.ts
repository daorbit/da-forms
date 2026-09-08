import type { FormField } from '@/types';
import { parseRepeaterRows } from '@/lib/formValidation';

export { parseRepeaterRows };

export function isRepeater(field: FormField): boolean {
  return field.type === 'repeater';
}

/** One compact line per row, sub-fields joined — for a table cell or a CSV column. */
export function repeaterSummaryText(field: FormField, raw: string): string {
  const subFields = field.subFields ?? [];
  const rows = parseRepeaterRows(raw);
  if (rows.length === 0) return '';
  return rows
    .map((row) =>
      subFields
        .map((sf) => `${sf.label}: ${row[sf.id] ?? ''}`)
        .join(', ')
    )
    .join(' | ');
}

export interface RepeaterDisplayRow {
  cells: { label: string; value: string }[];
}

/** Structured rows for the response modal and the PDF. */
export function repeaterDisplayRows(field: FormField, raw: string): RepeaterDisplayRow[] {
  const subFields = field.subFields ?? [];
  return parseRepeaterRows(raw).map((row) => ({
    cells: subFields.map((sf) => ({ label: sf.label, value: row[sf.id] ?? '' })),
  }));
}
