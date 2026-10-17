import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { SegmentedControl } from '@mantine/core';
import type { FormField, FormTheme } from '@/types';
import { formTemplates, templateCategories } from '@/lib/templates';
import { usedCategories } from '@/lib/templates/search';
import { diffTemplate, switchedFields, switchedTheme, type SwitchMode } from '@/lib/templateSwitch';
import { useTemplateFilters } from '@/hooks/useTemplateFilters';
import { StudioModal, studioClasses } from '@/components/studio/StudioModal';
import { StudioTopbar } from '@/components/studio/StudioTopbar';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import type { DeviceId } from '@/components/builder/DeviceFrame';
import { TemplateList } from '@/pages/createForm/templatePicker/TemplateList';
import type { TemplateSwitch } from '@/pages/formBuilder/useTemplateSwitch';
import { SwitchPreview, type CompareSide, type FormView } from './SwitchPreview';
import { SwitchPanel } from './SwitchPanel';
import classes from './templateSwitch.module.css';

const PICKABLE = formTemplates.filter((t) => t.id !== 'blank');
const CATEGORIES = usedCategories(PICKABLE, templateCategories);

interface Props {
  onClose: () => void;
  current: FormView;
  fields: FormField[];
  theme: FormTheme;
  onApply: (change: TemplateSwitch) => void;
}

export function TemplateSwitcher({ onClose, current, fields, theme, onApply }: Props) {
  const filters = useTemplateFilters(PICKABLE);
  const [templateId, setTemplateId] = useState(PICKABLE[0].id);
  const [side, setSide] = useState<CompareSide>('after');
  const [device, setDevice] = useState<DeviceId>('macbook');
  const [keepExtra, setKeepExtra] = useState(false);

  const active = filters.results.find((t) => t.id === templateId) ?? filters.results[0] ?? PICKABLE[0];
  const shown = useDeferredValue(active);
  const diff = useMemo(() => diffTemplate(fields, shown.fields), [fields, shown]);
  const [chosenMode, setMode] = useState<SwitchMode>('design');
  const mode: SwitchMode = diff.empty ? 'full' : chosenMode;

  const nextFields = useMemo(() => switchedFields(diff, keepExtra), [diff, keepExtra]);
  const after = useMemo<FormView>(() => {
    const nextTheme = switchedTheme(theme, shown);
    if (mode === 'design') return { ...current, theme: nextTheme };
    return {
      ...current,
      title: shown.title,
      description: shown.formDescription,
      fields: nextFields,
      submitLabel: shown.submitLabel,
      hideHeader: shown.hideHeader ?? false,
      steps: shown.steps,
      stepIndicator: shown.stepIndicator ?? current.stepIndicator,
      showStepHeadings: shown.showStepHeadings ?? false,
      theme: nextTheme,
    };
  }, [current, theme, shown, mode, nextFields]);
  const views = useMemo(() => ({ before: current, after }), [current, after]);

  const select = useCallback((id: string) => {
    setTemplateId(id);
    setSide('after');
  }, []);

  const apply = () => {
    onApply({ template: shown, mode, fields: nextFields, added: mode === 'full' ? diff.added.map((field) => field.id) : [] });
    onClose();
  };

  return (
    <StudioModal opened onClose={onClose}>
      <StudioTopbar
        title="Templates"
        subtitle="Preview before you switch"
        onClose={onClose}
        center={
          <SegmentedControl
            radius="xl"
            size="sm"
            value={side}
            onChange={(value) => setSide(value as CompareSide)}
            data={[
              { value: 'before', label: 'Before' },
              { value: 'after', label: 'After' },
            ]}
            aria-label="Compare"
          />
        }
        actions={<DeviceSwitch device={device} onChange={setDevice} />}
      />

      <div className={studioClasses.body}>
        <div className={classes.listColumn}>
          <TemplateList
            results={filters.results}
            total={PICKABLE.length}
            categories={CATEGORIES}
            query={filters.query}
            onQueryChange={filters.setQuery}
            category={filters.category}
            onCategoryChange={filters.setCategory}
            activeId={active.id}
            onSelect={select}
            onReset={filters.reset}
          />
        </div>

        <SwitchPreview
          views={views}
          side={side}
          device={device}
          revision={`${shown.id}-${mode}-${keepExtra}`}
          templateName={shown.name}
          pending={shown !== active}
        />

        <SwitchPanel
          template={shown}
          diff={diff}
          mode={mode}
          onModeChange={setMode}
          keepExtra={keepExtra}
          onKeepExtraChange={setKeepExtra}
          onApply={apply}
        />
      </div>
    </StudioModal>
  );
}
