import { makeField } from '@/lib/fieldPalette';
import {
  flattenFields,
  findField,
  locateField,
  removeFromTree,
  updateInTree,
  insertIntoColumn,
  valueFields,
} from '@/lib/fieldTree';
import type { FieldType, FormField } from '@/types';

/**
 * An AI edit, applied to the form the canvas is already holding.
 *
 * The generator answers a prompt by writing a whole form, which is right for a
 * first draft and wrong for an edit: dropping a generated form onto a live
 * canvas replaces everything, including what the author never asked about. The
 * grids are the clearest casualty — a grid holds its children in columns, the
 * generator's wire shape is a flat list with no way to say so, and no field
 * type for a grid either, so a form with any layout in it came back flattened
 * and several fields shorter.
 *
 * Operations avoid all of that by never describing the form. Each names a field
 * by the id it already has, and everything unnamed is left untouched — not
 * rebuilt identically, but genuinely not touched. A grid is never serialised,
 * so it cannot be lost.
 */

export interface RemoveFieldOp {
  op: 'removeField';
  id: string;
}

export interface UpdateFieldOp {
  op: 'updateField';
  id: string;
  patch: Partial<FormField>;
}

export interface AddFieldOp {
  op: 'addField';
  field: {
    type: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    content?: string;
    options?: string[];
    rows?: string[];
    maxRating?: number;
    min?: number;
    max?: number;
  };
  after?: string;
}

export interface MoveFieldOp {
  op: 'moveField';
  id: string;
  after?: string;
}

export interface SetFormOp {
  op: 'setForm';
  patch: { title?: string; formDescription?: string; submitLabel?: string };
}

export interface SetThemeOp {
  op: 'setTheme';
  patch: Record<string, unknown>;
}

export type EditOp =
  | RemoveFieldOp
  | UpdateFieldOp
  | AddFieldOp
  | MoveFieldOp
  | SetFormOp
  | SetThemeOp;

/** What applying a list of operations produced. */
export interface AppliedEdit {
  fields: FormField[];
  form: { title?: string; formDescription?: string; submitLabel?: string };
  theme?: Record<string, unknown>;
  /** How many operations actually changed something, for the summary line. */
  applied: number;
}

/**
 * Insert `field` directly after `afterId`, wherever that sits.
 *
 * A field inside a grid column keeps its neighbour company rather than being
 * exiled to the bottom of the form: "add a phone number after the email" means
 * beside the email, and the email may well be in the left half of a two-column
 * row.
 */
function insertAfter(
  fields: FormField[],
  afterId: string | undefined,
  field: FormField
): FormField[] {
  if (!afterId) return [...fields, field];

  const at = locateField(fields, afterId);
  if (!at) return [...fields, field];

  if ('gridId' in at) {
    return insertIntoColumn(fields, at.gridId, at.columnIndex, field, at.index + 1);
  }

  const next = [...fields];
  next.splice(at.index + 1, 0, field);
  return next;
}

/** A new field built from the palette, so it carries the same defaults a dragged one would. */
function buildField(spec: AddFieldOp['field']): FormField | null {
  let base: FormField;
  try {
    base = makeField(spec.type as FieldType);
  } catch {
    // A type the builder does not have. Dropping the one operation is better
    // than failing the whole edit around it.
    return null;
  }

  const field: FormField = { ...base, required: spec.required === true };
  if (spec.label) field.label = spec.label;
  if (spec.placeholder) field.placeholder = spec.placeholder;
  if (spec.helpText) field.helpText = spec.helpText;
  if (spec.content) field.content = spec.content;
  if (spec.options?.length) field.options = spec.options;
  if (spec.rows?.length) field.rows = spec.rows;
  if (typeof spec.maxRating === 'number') field.maxRating = spec.maxRating;
  if (typeof spec.min === 'number') field.min = spec.min;
  if (typeof spec.max === 'number') field.max = spec.max;

  return field;
}

/**
 * Run the operations against the current form.
 *
 * Order is the model's, and each operation sees the result of the one before —
 * so "remove the company field and add a note after the email" behaves the way
 * it reads. An operation naming a field that is no longer there is skipped
 * rather than failing the rest: by then it has usually been removed by an
 * earlier operation in the same list, and the author would rather have three of
 * four changes than none.
 */
export function applyEditOps(
  ops: EditOp[],
  current: FormField[]
): AppliedEdit {
  let fields = current;
  const form: AppliedEdit['form'] = {};
  let theme: Record<string, unknown> | undefined;
  let applied = 0;

  for (const op of ops) {
    switch (op.op) {
      case 'removeField': {
        if (!findField(fields, op.id)) break;
        fields = removeFromTree(fields, op.id);
        applied += 1;
        break;
      }

      case 'updateField': {
        if (!findField(fields, op.id)) break;
        // `type` and `id` are never patched: changing what a field collects is
        // a different field, and the id is what everything else addresses it by.
        const { type: _type, id: _id, ...patch } = op.patch as Partial<FormField>;
        if (!Object.keys(patch).length) break;
        fields = updateInTree(fields, op.id, patch);
        applied += 1;
        break;
      }

      case 'addField': {
        const field = buildField(op.field);
        if (!field) break;
        fields = insertAfter(fields, op.after, field);
        applied += 1;
        break;
      }

      case 'moveField': {
        const moving = findField(fields, op.id);
        if (!moving || op.after === op.id) break;
        // Lifted out first, so the anchor's position is read from the tree the
        // field is actually landing in.
        const without = removeFromTree(fields, op.id);
        if (op.after && !findField(without, op.after)) break;
        fields = insertAfter(without, op.after, moving);
        applied += 1;
        break;
      }

      case 'setForm': {
        if (op.patch.title) form.title = op.patch.title;
        if (op.patch.formDescription) form.formDescription = op.patch.formDescription;
        if (op.patch.submitLabel) form.submitLabel = op.patch.submitLabel;
        applied += 1;
        break;
      }

      case 'setTheme': {
        theme = { ...theme, ...op.patch };
        applied += 1;
        break;
      }
    }
  }

  return { fields, form, theme, applied };
}

/** One field as the model is shown it — enough to identify, not to rebuild. */
export interface EditSnapshotField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

export interface EditSnapshot {
  title?: string;
  formDescription?: string;
  submitLabel?: string;
  fields: EditSnapshotField[];
  theme?: Record<string, unknown>;
}

/**
 * The form described for the model: every field that collects a value, with its id.
 *
 * Grids are left out. They ask nothing, so the model has no reason to name one,
 * and their children are listed in document order — which is the order they
 * read on the page, whatever column they sit in.
 */
export function toEditSnapshotFields(fields: FormField[]): EditSnapshotField[] {
  return valueFields(fields).map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required,
    options: f.options,
  }));
}

/** Every id the model may name, grids included so a move can target one. */
export function knownIds(fields: FormField[]): string[] {
  return flattenFields(fields).map((f) => f.id);
}
