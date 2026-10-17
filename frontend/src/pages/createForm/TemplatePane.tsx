import { useMemo, useState } from 'react';
import type { FormTheme } from '@/types';
import { formTemplates, templateCategories } from '@/lib/templates';
import { themeForScope, usedCategories } from '@/lib/templates/search';
import { useTemplateFilters } from '@/hooks/useTemplateFilters';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { useFitScale } from '@/hooks/useFitScale';
import { TemplateList } from './templatePicker/TemplateList';
import { TemplatePreviewBar } from './templatePicker/TemplatePreviewBar';
import classes from './createForm.module.css';
import pickerClasses from './templatePicker/TemplatePicker.module.css';

type Template = (typeof formTemplates)[number];

const PICKABLE = formTemplates.filter((t) => t.id !== 'blank');
const CATEGORIES = usedCategories(PICKABLE, templateCategories);

interface Props {
  scope: NonNullable<FormTheme['scope']>;
  creating: boolean;
  onCreate: (template: Template) => void;
}

export function TemplatePane({ scope, creating, onCreate }: Props) {
  const filters = useTemplateFilters(PICKABLE);
  const [templateId, setTemplateId] = useState(PICKABLE[0]?.id ?? formTemplates[0].id);
  const [device, setDevice] = useState<DeviceId>('macbook');

  const { results } = filters;
  const active =
    results.find((t) => t.id === templateId) ??
    results[0] ??
    formTemplates.find((t) => t.id === templateId) ??
    formTemplates[0];
  const theme = useMemo(() => themeForScope(active.theme, scope), [active, scope]);

  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 56, y: 48 },
  });

  return (
    <div className={classes.build}>
      <TemplateList
        results={results}
        total={PICKABLE.length}
        categories={CATEGORIES}
        query={filters.query}
        onQueryChange={filters.setQuery}
        category={filters.category}
        onCategoryChange={filters.setCategory}
        activeId={active.id}
        onSelect={setTemplateId}
        onReset={filters.reset}
      />

      <section className={classes.previewPane}>
        <TemplatePreviewBar
          template={active}
          device={device}
          onDeviceChange={setDevice}
          creating={creating}
          onUse={() => onCreate(active)}
        />

        <div className={`${classes.stage} ${pickerClasses.canvas}`} ref={stageRef}>
          <DeviceFrame device={device} scale={scale} hidden={!measured}>
            <FormPage theme={theme} minHeight="100%">
              <FormRenderer
                key={`${active.id}-${device}-${scope}`}
                title={active.title}
                description={active.formDescription}
                fields={active.fields}
                theme={theme}
                submitLabel={active.submitLabel}
                hideHeader={active.hideHeader}
              />
            </FormPage>
          </DeviceFrame>
        </div>
      </section>
    </div>
  );
}
