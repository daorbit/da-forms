import type { Form, FormTheme } from '@/types';

type FormScope = NonNullable<FormTheme['scope']>;

const LAYOUT_PARAM = 'layout';
const LAYOUTS: Record<string, FormScope> = { page: 'page', card: 'card' };

export function layoutFromSearch(search: URLSearchParams): FormScope | null {
  return LAYOUTS[search.get(LAYOUT_PARAM) ?? ''] ?? null;
}

export function withLayout(form: Form | null, layout: FormScope | null): Form | null {
  if (!form || !layout || (form.theme?.scope ?? 'page') === layout) return form;
  return { ...form, theme: { ...form.theme, scope: layout } as FormTheme };
}
