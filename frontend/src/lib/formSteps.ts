import type { FormField, FormStep } from '@/types';

/** Top-level `pageBreak` fields split the form; a break never nests inside a grid. */
export function splitIntoPages(fields: FormField[]): FormField[][] {
  const pages: FormField[][] = [[]];
  for (const field of fields) {
    if (field.type === 'pageBreak') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(field);
    }
  }
  return pages;
}

/** How many pages a field list produces — one more than its top-level page breaks. */
export function pageCount(fields: FormField[]): number {
  return fields.filter((f) => f.type === 'pageBreak').length + 1;
}

/**
 * The step names actually rendered: whatever the form defines, padded out to
 * the real page count so a step added after the names were written still gets
 * a sensible label instead of an empty one.
 */
export function resolveSteps(fields: FormField[], steps: FormStep[] | undefined): Required<FormStep>[] {
  const count = pageCount(fields);
  return Array.from({ length: count }, (_, index) => ({
    title: steps?.[index]?.title?.trim() || `Step ${index + 1}`,
    description: steps?.[index]?.description?.trim() || '',
  }));
}
