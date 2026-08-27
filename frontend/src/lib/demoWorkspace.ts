import type { Form } from '@/types';
import { formTemplates } from '@/lib/templates';
import { DEFAULT_WORKSPACE } from '@/lib/api';

/**
 * The demo workspace: what a visitor sees with no host product supplying a
 * workspace of their own.
 *
 * Its forms are the shipped templates rendered as saved forms, not rows in the
 * database. That keeps the showcase identical for everyone who opens the URL,
 * and means nothing anyone does here leaves anything behind — the backend
 * refuses writes to this workspace regardless.
 */
export function isDemoWorkspace(workspaceId: string) {
  return workspaceId === DEFAULT_WORKSPACE;
}

const DEMO_ID_PREFIX = 'demo-';

export function isDemoFormId(id: string) {
  return id.startsWith(DEMO_ID_PREFIX);
}

/** Fixed timestamps: a sample list should not reshuffle by age between visits. */
const CREATED_AT = '2026-01-06T09:00:00.000Z';

function toDemoForm(template: (typeof formTemplates)[number], index: number): Form {
  return {
    _id: `${DEMO_ID_PREFIX}${template.id}`,
    name: template.name,
    title: template.title,
    description: template.formDescription,
    workspaceId: DEFAULT_WORKSPACE,
    fields: template.fields,
    // Alternated so the list, its status filter and the status tint all have
    // something real to show.
    status: index % 3 === 0 ? 'draft' : 'published',
    hideHeader: template.hideHeader,
    submitLabel: template.submitLabel,
    theme: template.theme,
    steps: template.steps,
    stepIndicator: template.stepIndicator,
    showStepHeadings: template.showStepHeadings,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

/** Built once — the templates are static, and the ids must stay stable across renders. */
const demoForms: Form[] = formTemplates
  .filter((t) => t.id !== 'blank')
  .map(toDemoForm);

export function getDemoForm(id: string): Form | undefined {
  return demoForms.find((f) => f._id === id);
}

export interface DemoListOptions {
  page?: number;
  limit?: number;
  q?: string;
  sort?: 'date' | 'dateAsc' | 'name' | 'nameDesc' | 'status';
  status?: 'published' | 'draft';
}

/**
 * Mirrors what the API does for a real workspace — search, status filter, sort
 * and paging — so the list page needs no separate code path for the demo.
 */
export function listDemoForms(options: DemoListOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);

  let items = demoForms;
  if (options.q) {
    const q = options.q.toLowerCase();
    items = items.filter((f) => f.name.toLowerCase().includes(q));
  }
  if (options.status) items = items.filter((f) => f.status === options.status);

  const sorted = [...items].sort((a, b) => {
    switch (options.sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'status':
        return a.status.localeCompare(b.status);
      // Every demo form shares a creation date, so the date sorts fall back to
      // the template order — newest-first reversing it, as on a real list.
      case 'dateAsc':
        return 0;
      default:
        return 0;
    }
  });
  if (options.sort === 'date') sorted.reverse();

  return {
    items: sorted.slice((page - 1) * limit, page * limit),
    total: sorted.length,
    page,
    limit,
  };
}
