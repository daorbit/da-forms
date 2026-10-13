import type { FormField } from '@/types';
import type { FormTemplate } from '@/lib/templates';
import { switchedTheme, type SwitchMode } from '@/lib/templateSwitch';
import { notify } from '@/lib/notify';
import type { FormBuilderState } from './useFormBuilderState';

export interface TemplateSwitch {
  template: FormTemplate;
  mode: SwitchMode;
  fields: FormField[];
}

export function useTemplateSwitch(state: FormBuilderState) {
  function applyTemplate({ template, mode, fields }: TemplateSwitch) {
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
      state.setSelectedId(null);
      state.setEditingId(null);
    }

    notify.info(`Switched to ${template.name}. Press Ctrl+Z to undo`);
  }

  return { applyTemplate };
}
