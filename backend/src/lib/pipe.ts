import type { FormField } from '../models/form.model.js';

/** Every field in document order, grids included — mirrors `flattenFields` in form.service. */
export function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

/**
 * Replaces `{{Field Label}}` with that field's answer, blank if unanswered and
 * left untouched if no field has that exact label.
 *
 * Matched by label rather than id: the composer inserts the name someone typed
 * for the field, not its internal id, so this is what has to resolve at render
 * time. A field renamed after the template was written silently stops matching
 * — accepted as the cost of a placeholder a human can actually read and type.
 *
 * An unmatched placeholder is returned verbatim rather than blanked, because
 * the two failures need to look different to whoever wrote the template: a
 * question nobody answered should read as empty, while `{{Naem}}` should stay
 * visible as the typo it is.
 *
 * Lifted out of the notification service once the thank-you message and the
 * form's own headings began wanting the same substitution. Three copies of this
 * regex would eventually disagree about whitespace, and the one that disagreed
 * would be the one a customer was looking at.
 */
export function fillPlaceholders(
  template: string,
  fields: FormField[],
  data: Record<string, string>
): string {
  const byLabel = new Map(flattenFields(fields).map((f) => [f.label?.trim(), f.id]));
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, label: string) => {
    const fieldId = byLabel.get(label.trim());
    return fieldId !== undefined ? data[fieldId] ?? '' : match;
  });
}
