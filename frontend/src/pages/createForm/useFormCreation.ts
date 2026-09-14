import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { ApiError, createForm, importFormConfig } from '@/lib/api';
import { isPlanLimit } from '@/lib/planLimit';
import { formTemplates } from '@/lib/templates';
import type { Draft, Scope } from './types';

type Template = (typeof formTemplates)[number];

interface Options {
  workspaceId: string;
  formName: string;
  scope: Scope;
}

export function useFormCreation({ workspaceId, formName, scope }: Options) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function openInBuilder(id: string) {
    navigate(`/${workspaceId}/forms/${id}/edit`);
  }

  function reportFailure(err: unknown) {
    setCreating(false);
    if (isPlanLimit(err)) return;
    notifications.show({ message: 'Could not create form', color: 'red' });
  }

  async function createFromDraft(draft: Draft) {
    if (creating) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          title: draft.title,
          description: draft.formDescription,
          fields: draft.fields,
          submitLabel: draft.submitLabel,
          theme: { ...(draft.theme ?? {}), scope },
        },
        workspaceId
      );
      openInBuilder(form._id);
    } catch (err) {
      reportFailure(err);
    }
  }

  async function createFromTemplate(tpl: Template) {
    if (creating) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          title: tpl.id === 'blank' ? formName : tpl.title,
          description: tpl.formDescription,
          fields: tpl.fields,
          hideHeader: tpl.hideHeader,
          submitLabel: tpl.submitLabel,
          theme: tpl.theme ?? { scope },
          steps: tpl.steps,
          stepIndicator: tpl.stepIndicator,
          showStepHeadings: tpl.showStepHeadings,
        },
        workspaceId
      );
      openInBuilder(form._id);
    } catch (err) {
      reportFailure(err);
    }
  }

  async function createBlank() {
    const blank = formTemplates.find((t) => t.id === 'blank');
    if (blank) await createFromTemplate(blank);
  }

  async function importConfig(parsed: unknown) {
    if (importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const form = await importFormConfig(parsed, workspaceId);
      openInBuilder(form._id);
    } catch (err) {
      setImporting(false);
      if (isPlanLimit(err)) return;
      setImportError(err instanceof ApiError ? err.message : 'Could not import that config.');
    }
  }

  return {
    creating,
    importing,
    importError,
    setImportError,
    createFromDraft,
    createFromTemplate,
    createBlank,
    importConfig,
  };
}
