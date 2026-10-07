import type { FormField, FormTheme } from '@/types';
import type { FormTemplate } from './types';

const FULL_WIDTH_TYPES = new Set<FormField['type']>(['name', 'address']);

function modernTheme(theme: FormTheme | undefined): FormTheme {
  const base = theme ?? { scope: 'page' as const };
  return {
    ...base,
    fieldStyle: base.fieldStyle ?? 'outline',
    fieldRadius: base.fieldRadius ?? Math.min(12, Math.max(6, Math.round((base.cardRadius ?? 12) * 0.6))),
    density: base.density ?? 'comfortable',
    titleSize: base.titleSize ?? 'md',
  };
}

function tidyName(f: FormField): FormField {
  return f.type === 'name' ? { ...f, placeholder: 'First name' } : f;
}

function unwrapWideFields(fields: FormField[]): FormField[] {
  return fields.map(tidyName).flatMap((f) => {
    if (f.type !== 'grid' || !f.columns) return [f];
    const wide = f.columns.flat().filter((c) => FULL_WIDTH_TYPES.has(c.type)).map(tidyName);
    if (wide.length === 0) return [f];
    const columns = f.columns
      .map((column) => column.filter((c) => !FULL_WIDTH_TYPES.has(c.type)))
      .filter((column) => column.length > 0);
    const rest = columns.length > 1 ? [{ ...f, columns }] : columns.flat();
    return [...wide, ...rest];
  });
}

export function modernize(templates: FormTemplate[]): FormTemplate[] {
  return templates.map((tpl) =>
    tpl.id === 'blank'
      ? tpl
      : { ...tpl, fields: unwrapWideFields(tpl.fields), theme: modernTheme(tpl.theme) }
  );
}
