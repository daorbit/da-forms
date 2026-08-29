import type { FormTemplate, TemplateCategory } from './types';

export type ScopeFilter = 'all' | 'page' | 'card';

/** Where a template is meant to live. Untemed templates follow the page default. */
export function templateScope(tpl: FormTemplate): 'page' | 'card' {
  return tpl.theme?.scope === 'card' ? 'card' : 'page';
}

/** Matches a template against the picker's search box, category, and scope. */
export function filterTemplates(
  templates: FormTemplate[],
  query: string,
  category: TemplateCategory | 'All',
  scope: ScopeFilter = 'all'
): FormTemplate[] {
  const q = query.trim().toLowerCase();
  return templates.filter((tpl) => {
    if (category !== 'All' && tpl.category !== category) return false;
    if (scope !== 'all' && templateScope(tpl) !== scope) return false;
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
