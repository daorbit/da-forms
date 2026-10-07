import type { FieldType } from '@/types';
import { fieldPalette, paletteKey, type PaletteItem } from './fieldPalette';

export interface SearchableField {
  key: string;
  item: PaletteItem;
  group: string;
}

const SYNONYMS: Partial<Record<FieldType, string>> = {
  text: 'short answer input single line',
  textarea: 'long answer paragraph message comments multi line',
  select: 'dropdown picker menu',
  radio: 'single choice option',
  checkbox: 'multiple choice tick',
  chips: 'pills tags buttons',
  file: 'upload attachment document',
  imageUpload: 'upload photo picture',
  rating: 'stars score review',
  nps: 'net promoter score recommend',
  date: 'calendar day',
  phone: 'mobile telephone number',
  email: 'mail address',
  name: 'first last full person',
  terms: 'consent agree policy',
  signature: 'sign',
  yesNo: 'boolean toggle',
  payment: 'pay checkout price money',
  pageBreak: 'step page section',
  heading: 'title section',
  description: 'paragraph text note',
};

const ALL: SearchableField[] = fieldPalette.flatMap((group) =>
  group.items.map((item) => ({ key: paletteKey(item), item, group: group.group }))
);

export const POPULAR_KEYS = ['text', 'textarea', 'email', 'name', 'phone', 'select', 'radio', 'chips', 'date', 'rating'];

export function searchFields(query: string): SearchableField[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const popular = POPULAR_KEYS.map((key) => ALL.find((f) => f.key === key)).filter(Boolean) as SearchableField[];
    return [...popular, ...ALL.filter((f) => !POPULAR_KEYS.includes(f.key))];
  }
  const words = q.split(/\s+/);
  return ALL.map((f) => {
    const label = f.item.label.toLowerCase();
    const hay = `${label} ${f.group.toLowerCase()} ${SYNONYMS[f.item.type] ?? ''}`;
    if (!words.every((w) => hay.includes(w))) return null;
    const score = label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2;
    return { f, score };
  })
    .filter((r): r is { f: SearchableField; score: number } => r !== null)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.f);
}
