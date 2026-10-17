import type { FormTheme } from '@/types';
import type { FormTemplate, TemplateCategory } from './types';

export type TemplateScope = NonNullable<FormTheme['scope']>;

/** A template's theme placed where the form will actually live. */
export function themeForScope(theme: FormTheme | undefined, scope: TemplateScope): FormTheme {
  return { ...(theme ?? {}), scope };
}

/** Matches a template against the picker's search box and category. */
export function filterTemplates(
  templates: FormTemplate[],
  query: string,
  category: TemplateCategory | 'All'
): FormTemplate[] {
  const q = query.trim().toLowerCase();
  return templates.filter((tpl) => {
    if (category !== 'All' && tpl.category !== category) return false;
    if (!q) return true;
    const haystack = [tpl.name, tpl.description, tpl.category, ...(tpl.keywords ?? [])].join(' ').toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

/** Only the categories that actually have templates, for the filter bar. */
export function usedCategories(templates: FormTemplate[], all: readonly TemplateCategory[]): TemplateCategory[] {
  const present = new Set(templates.map((t) => t.category));
  return all.filter((c) => present.has(c));
}

/** Keeps the first template of each name, so a newer design replaces an older one with the same name. */
export function uniqueByName(templates: FormTemplate[]): FormTemplate[] {
  const seen = new Set<string>();
  return templates.filter((tpl) => {
    const key = tpl.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
