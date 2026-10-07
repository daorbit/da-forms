import type { FormField, FormTheme } from '@/types';
import { studioPresets } from '@/lib/themes/studio';
import { field } from './types';

export function look(id: string, overrides: Partial<FormTheme> = {}, scope: FormTheme['scope'] = 'page'): FormTheme {
  const preset = studioPresets.find((p) => p.id === id);
  return { scope, ...preset?.theme, ...overrides };
}

export function fullName(label = 'Full name', required = true): FormField {
  return field('name', { label, required, placeholder: 'First name' });
}

export function email(label = 'Email', required = true, placeholder = 'you@example.com'): FormField {
  return field('email', { label, required, placeholder });
}

export function phone(label = 'Phone', required = false): FormField {
  return field('phone', { label, required, placeholder: '+1 555 010 2030' });
}

export function pick(label: string, options: string[], overrides: Partial<FormField> = {}): FormField {
  return field('select', { label, options, placeholder: 'Select', ...overrides });
}

export function pills(label: string, options: string[], overrides: Partial<FormField> = {}): FormField {
  return field('chips', { label, options, ...overrides });
}

export function multiPills(label: string, options: string[], overrides: Partial<FormField> = {}): FormField {
  return field('chips', { label, options, allowMultiple: true, ...overrides });
}

export function longText(label: string, placeholder: string, required = false): FormField {
  return field('textarea', { label, placeholder, required });
}
