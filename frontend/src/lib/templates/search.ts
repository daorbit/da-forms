import type { FormTemplate, TemplateCategory } from './types';

/** Matches a template against the picker's search box and category chips. */
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
