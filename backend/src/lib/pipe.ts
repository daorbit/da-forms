import type { FormField } from '../models/form.model.js';

export function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}
 
export function repeaterText(field: FormField, raw: string): string {
  if (!raw) return '';
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!Array.isArray(rows)) return raw;
  const subFields = field.subFields ?? [];
  return rows
    .map((row, i) => {
      const record = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
      const cells = subFields
        .map((sf) => `${sf.label}: ${record[sf.id] == null ? '' : String(record[sf.id])}`)
        .join(', ');
      return `${i + 1}. ${cells}`;
    })
    .join('\n');
}

 
export function fillPlaceholders(
  template: string,
  fields: FormField[],
  data: Record<string, string>
): string {
  const byLabel = new Map(flattenFields(fields).map((f) => [f.label?.trim(), f]));
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, label: string) => {
    const field = byLabel.get(label.trim());
    if (!field) return match;
    const raw = data[field.id] ?? '';
    return field.type === 'repeater' ? repeaterText(field, raw) : raw;
  });
}
