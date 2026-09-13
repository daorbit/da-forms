import { applyEditOps, toEditSnapshotFields } from './src/lib/editOps';
import type { FormField } from './src/types';

const f = (id: string, type: string, label: string, required = false) =>
  ({ id, type, label, required, size: 'large' }) as FormField;

// The form from the screenshot: two 2-column grids, one full-width textarea.
const form: FormField[] = [
  { id: 'g1', type: 'grid', label: '', required: false, size: 'large',
    columns: [[f('n', 'name', 'Your name', true)], [f('e', 'email', 'Email', true)]] } as FormField,
  { id: 'g2', type: 'grid', label: '', required: false, size: 'large',
    columns: [[f('c', 'text', 'Company')], [f('s', 'select', 'What is this about?', true)]] } as FormField,
  f('m', 'textarea', 'Message', true),
];

const snap = toEditSnapshotFields(form);
console.log('snapshot ids:', snap.map((x) => x.id).join(','));

const grids = (fs: FormField[]) => fs.filter((x) => x.type === 'grid').length;
const count = (fs: FormField[]): number =>
  fs.reduce((n, x) => n + (x.type === 'grid' ? (x.columns ?? []).reduce((m, c) => m + count(c), 0) : 1), 0);

// 1. Theme only — the case that broke.
let r = applyEditOps([{ op: 'setTheme', patch: { cardBg: '#0b0f14', accentColor: '#22c55e' } }], form);
console.log('theme-only   fields:', count(r.fields), 'grids:', grids(r.fields), 'applied:', r.applied, 'theme:', JSON.stringify(r.theme));

// 2. Remove a field nested inside a grid.
r = applyEditOps([{ op: 'removeField', id: 'c' }], form);
console.log('remove c     fields:', count(r.fields), 'grids:', grids(r.fields), 'labels:', toEditSnapshotFields(r.fields).map(x=>x.label).join('|'));

// 3. Update a nested field.
r = applyEditOps([{ op: 'updateField', id: 'e', patch: { required: false, label: 'Work email' } }], form);
const e = toEditSnapshotFields(r.fields).find((x) => x.id === 'e');
console.log('update e     required:', e?.required, 'label:', e?.label, 'grids:', grids(r.fields));

// 4. Add a phone after the email — should land INSIDE the grid column.
r = applyEditOps([{ op: 'addField', after: 'e', field: { type: 'phone', label: 'Phone' } }], form);
const g1 = r.fields[0];
console.log('add after e  col1:', (g1.columns?.[1] ?? []).map((x) => x.label).join('|'), 'grids:', grids(r.fields));

// 5. Combined edit.
r = applyEditOps([
  { op: 'removeField', id: 'c' },
  { op: 'addField', after: 'm', field: { type: 'decisionBox', label: 'Subscribe' } },
  { op: 'setForm', patch: { title: 'Talk to us' } },
  { op: 'setTheme', patch: { cardBg: '#0b0f14' } },
], form);
console.log('combined     fields:', count(r.fields), 'grids:', grids(r.fields), 'title:', r.form.title, 'applied:', r.applied);

// 6. Unknown id / bad type are skipped, not fatal.
r = applyEditOps([
  { op: 'removeField', id: 'nope' },
  { op: 'addField', field: { type: 'notAType', label: 'X' } },
  { op: 'updateField', id: 'm', patch: { required: false } },
], form);
console.log('junk ops     applied:', r.applied, 'fields:', count(r.fields));

console.log('original untouched:', count(form), 'grids:', grids(form));
