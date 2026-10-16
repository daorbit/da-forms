import { useEffect, useState } from 'react';
import type { FormField } from '@/types';
import type { FormTemplate } from '@/lib/templates';
import { switchedTheme, type SwitchMode } from '@/lib/templateSwitch';
import { notify } from '@/lib/notify';
import type { FormBuilderState } from './useFormBuilderState';

export interface TemplateSwitch {
  template: FormTemplate;
  mode: SwitchMode;
  fields: FormField[];
  added: string[];
}

const FRESH_MS = 2800;

export function useTemplateSwitch(state: FormBuilderState) {
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (freshIds.size === 0) return;
    const timer = window.setTimeout(() => setFreshIds(new Set()), FRESH_MS);
    return () => window.clearTimeout(timer);
  }, [freshIds]);

  function applyTemplate({ template, mode, fields, added }: TemplateSwitch) {
    state.setTheme((prev) => switchedTheme(prev, template));

    if (mode === 'full') {
      state.setFields(fields);
      state.setTitle(template.title);
      state.setDescription(template.formDescription ?? '');
      state.setSubmitLabel(template.submitLabel ?? '');
      state.setHideHeader(template.hideHeader ?? false);
      state.setSteps(template.steps ?? []);
      state.setShowStepHeadings(template.showStepHeadings ?? false);
      if (template.stepIndicator) state.setStepIndicator(template.stepIndicator);
      state.setOneQuestionAtATime(template.oneQuestionAtATime ?? false);
      if (template.thankYouMessage) state.setThankYouMessage(template.thankYouMessage);
      state.setSelectedId(null);
      state.setEditingId(null);
      setFreshIds(new Set(added));
    }

    notify.info(`Switched to ${template.name}. Press Ctrl+Z to undo`);
  }

  return { applyTemplate, freshIds };
}
