import type { CSSProperties } from 'react';
import type { FormTemplate, TemplateCategory } from '@/lib/templates';
import { staticTypes } from '@/lib/fieldPalette';
import { valueFields } from '@/lib/fieldTree';
import { pageCount } from '@/lib/formSteps';
import { templateScope } from '@/lib/templates/search';

export interface TemplateGroup {
  category: TemplateCategory;
  templates: FormTemplate[];
}

export function groupByCategory(
  templates: FormTemplate[],
  order: readonly TemplateCategory[]
): TemplateGroup[] {
  return order
    .map((category) => ({
      category,
      templates: templates.filter((t) => t.category === category),
    }))
    .filter((group) => group.templates.length > 0);
}

export function questionCount(tpl: FormTemplate): number {
  return valueFields(tpl.fields).filter((f) => !staticTypes.includes(f.type)).length;
}

export function templateMetaLine(tpl: FormTemplate): string[] {
  const questions = questionCount(tpl);
  const pages = pageCount(tpl.fields);
  const parts = [`${questions} ${questions === 1 ? 'question' : 'questions'}`];
  if (pages > 1) parts.push(`${pages} steps`);
  return parts;
}

export function scopeLabel(tpl: FormTemplate): string {
  return templateScope(tpl) === 'card' ? 'Embedded' : 'Standalone';
}

export function swatchVars(tpl: FormTemplate): CSSProperties {
  const theme = tpl.theme;
  return {
    '--sw-page': theme?.pageBg ?? '#f1f3f5',
    '--sw-card': theme?.cardBg ?? '#ffffff',
    '--sw-line': theme?.inputBorder ?? theme?.cardBorder ?? '#dee2e6',
    '--sw-accent': theme?.accentColor ?? '#1a1b1e',
  } as CSSProperties;
}
