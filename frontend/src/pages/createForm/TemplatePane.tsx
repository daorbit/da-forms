import { useState } from 'react';
import {
  Button,
  Chip,
  CloseButton,
  Group,
  ScrollArea,
  SegmentedControl,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { FormTheme } from '@/types';
import { formTemplates, templateCategories, type TemplateCategory } from '@/lib/templates';
import { filterTemplates, usedCategories, type ScopeFilter } from '@/lib/templates/search';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import classes from './createForm.module.css';

type Template = (typeof formTemplates)[number];

interface Props {
  /** Narrows the opening set to whatever the form is going to be used for. */
  scope: NonNullable<FormTheme['scope']>;
  creating: boolean;
  onCreate: (template: Template) => void;
}

/**
 * The template picker, as a pane of the create screen.
 *
 * Two panes of its own: the list and its filters on the left, the selected
 * template previewed in a device mock on the right. The same shape as the Orbit
 * workspace, so moving between the two ways of starting does not rearrange the
 * screen.
 */
export function TemplatePane({ scope, creating, onCreate }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  // Step one already asked where the form will live, so the picker opens on the
  // matching set rather than making the same choice twice.
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(scope === 'card' ? 'card' : 'page');
  const [templateId, setTemplateId] = useState(
    formTemplates.find((t) => t.id !== 'blank')?.id ?? formTemplates[0].id
  );
  const [device, setDevice] = useState<DeviceId>('macbook');

  const categories = usedCategories(formTemplates, templateCategories);
  // The blank card is a shortcut, not a template — it is its own card on the
  // hero and has no place in this list.
  const results = filterTemplates(
    formTemplates.filter((t) => t.id !== 'blank'),
    query,
    category,
    scopeFilter
  );

  // Filtering can hide whatever was selected. Rather than previewing a template
  // no longer in the list, fall through to the first visible one.
  const selected = results.find((t) => t.id === templateId);
  const active =
    selected ?? results[0] ?? formTemplates.find((t) => t.id === templateId) ?? formTemplates[0];

  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 48, y: 40 },
  });

  return (
    <div className={classes.build}>
      <section className={classes.orbitPane}>
        <div className={classes.pickerHead}>
          <TextInput
            placeholder="Search templates"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={15} />}
            rightSection={
              query ? (
                <CloseButton size="sm" onClick={() => setQuery('')} aria-label="Clear search" />
              ) : null
            }
            size="sm"
          />

          <SegmentedControl
            fullWidth
            size="xs"
            value={scopeFilter}
            onChange={(value) => setScopeFilter(value as ScopeFilter)}
            data={[
              { value: 'all', label: 'All' },
              { value: 'page', label: 'Standalone' },
              { value: 'card', label: 'Embedded' },
            ]}
          />
        </div>

        <ScrollArea className={classes.thread} type="hover" scrollbarSize={6} px="sm" pb="sm">
          <div className={classes.templateList}>
            {results.map((tpl) => (
              <UnstyledButton
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                className={`${classes.templateItem} ${
                  tpl.id === active.id ? classes.templateItemActive : ''
                }`}
              >
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {tpl.name}
                  </Text>
                  <Text size="10px" c="dimmed" className={classes.categoryTag}>
                    {tpl.category}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>
                  {tpl.description}
                </Text>
              </UnstyledButton>
            ))}

            {results.length === 0 && (
              <Text size="xs" c="dimmed" ta="center" py="lg">
                No templates match that. Try a different word, or start from scratch.
              </Text>
            )}
          </div>
        </ScrollArea>
      </section>

      <section className={classes.previewPane}>
        <div className={classes.previewBar}>
          {/* Horizontal chips rather than a wrapping block: with a dozen
              categories a wrapped bar costs the stage its height. */}
          <ScrollArea type="never" className={classes.filterBar}>
            <Chip.Group
              multiple={false}
              value={category}
              onChange={(value) => setCategory((value as TemplateCategory) || 'All')}
            >
              <Group gap={6} wrap="nowrap">
                <Chip value="All" size="xs" color="emerald" variant="outline">
                  All
                </Chip>
                {categories.map((c) => (
                  <Chip key={c} value={c} size="xs" color="emerald" variant="outline">
                    {c}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </ScrollArea>

          {/* A divider and its own gap: without them the last chip runs
              straight into the device switch and the two read as one row of
              controls. */}
          <Group gap={12} wrap="nowrap" className={classes.previewActions}>
            <DeviceSwitch device={device} onChange={setDevice} />
            <Button
              color="emerald"
              size="xs"
              onClick={() => onCreate(active)}
              loading={creating}
            >
              Use this template
            </Button>
          </Group>
        </div>

        <div className={classes.stage} ref={stageRef}>
          <DeviceFrame device={device} scale={scale} hidden={!measured}>
            <FormPage theme={active.theme} minHeight="100%">
              {/* Remounted per template and device so each preview starts from
                  page one at that device's layout. */}
              <FormRenderer
                key={`${active.id}-${device}`}
                title={active.title}
                description={active.formDescription}
                fields={active.fields}
                theme={active.theme}
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
