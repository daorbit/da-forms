import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Group, Stack, Text, SegmentedControl, Box, UnstyledButton, Loader, Chip, ScrollArea, CloseButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconArrowRight, IconMessage, IconPlus, IconSearch } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { formTemplates, templateCategories, type TemplateCategory } from '@/lib/templates';
import type { FormTemplate } from '@/lib/templates/types';
import { filterTemplates, usedCategories, type ScopeFilter } from '@/lib/templates/search';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import { createForm, generateFormDraft } from '@/lib/api';
import { generatedToTemplate } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import classes from './NewFormModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function NewFormModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<NonNullable<FormTheme['scope']>>('page');
  const defaultTemplateId = formTemplates.find((t) => t.id !== 'blank')?.id ?? formTemplates[0].id;
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const [device, setDevice] = useState<DeviceId>('macbook');

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  /**
   * The last generated form, held as a template.
   *
   * Kept beside the built-in list rather than merged into it: it is not a
   * template anyone can search for, it does not survive the modal closing, and
   * a second generation replaces it. Selecting it works exactly as selecting a
   * real template does, which is the whole point of converting it.
   */
  const [aiTemplate, setAiTemplate] = useState<FormTemplate | null>(null);

  const categories = usedCategories(formTemplates, templateCategories);
  // The blank card is a shortcut, not a template — it stays pinned at the top
  // of the list rather than appearing and disappearing with the filters.
  const blank = formTemplates.find((t) => t.id === 'blank');
  const results = filterTemplates(
    formTemplates.filter((t) => t.id !== 'blank'),
    query,
    category,
    scopeFilter
  );

  // Filtering can hide whatever was selected. Rather than previewing a template
  // no longer in the list, fall through to the first visible one. The generated
  // one is checked first — it is never in `results`, and it is what someone who
  // just generated a form is looking at.
  const selected =
    aiTemplate && templateId === aiTemplate.id ? aiTemplate : results.find((t) => t.id === templateId);
  const activeTemplate =
    selected ?? results[0] ?? formTemplates.find((t) => t.id === templateId) ?? formTemplates[0];

  // The frame renders at the device's true CSS width and is scaled down to
  // whatever room the modal leaves, so the layout inside is the real one.
  const size = frameSize(device);
  // Generous padding because the laptop's base sticks out past its lid on both
  // sides and its foot sits below the chassis: a fit that leaves no margin puts
  // those against the stage's edge, where `overflow: hidden` shears them off.
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 96, y: 72 },
  });

  function reset() {
    setStep(1);
    setName('');
    setScope('page');
    setTemplateId(defaultTemplateId);
    setDevice('macbook');
    setCreating(false);
    setQuery('');
    setCategory('All');
    setScopeFilter('all');
    setPrompt('');
    setGenerating(false);
    setAiTemplate(null);
  }

  /**
   * Draft a form from the prompt and select it.
   *
   * Selected rather than created: the result lands in the preview beside the
   * templates, so it is judged the same way they are and discarded by picking
   * something else. Nothing is stored until Create form is pressed.
   */
  async function handleGenerate() {
    const asked = prompt.trim();
    if (!asked || generating) return;

    setGenerating(true);
    try {
      const draft = await generateFormDraft(asked, workspaceId);
      const template = generatedToTemplate(draft);
      setAiTemplate(template);
      setTemplateId(template.id);
      // The generated form is not in the filtered list, and leaving a filter on
      // would hide every alternative behind it for no reason.
      setQuery('');
      setCategory('All');
      setScopeFilter('all');
    } catch (err) {
      // A spent AI allowance opens the upgrade dialog on its way out of the API
      // layer, same as a form cap does.
      if (isPlanLimit(err)) {
        handleClose();
        return;
      }
      notifications.show({
        message: err instanceof Error ? err.message : 'Could not generate a form',
        color: 'red',
      });
    } finally {
      setGenerating(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    // Step one already asked where the form will live, so the picker opens on
    // the matching set instead of making the same choice twice.
    setScopeFilter(scope === 'card' ? 'card' : 'page');
    setStep(2);
  }

  async function handleCreate(template: (typeof formTemplates)[number] = activeTemplate) {
    const formName = name.trim();
    if (!formName) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          // The heading shown on the form is the template's own — a blank form
          // has none of its own, so it falls back to what the user typed.
          title: template.id === 'blank' ? formName : template.title,
          description: template.formDescription,
          fields: template.fields,
          hideHeader: template.hideHeader,
          submitLabel: template.submitLabel,
          theme: template.theme ?? { scope },
          steps: template.steps,
          stepIndicator: template.stepIndicator,
          showStepHeadings: template.showStepHeadings,
        },
        workspaceId
      );
      reset();
      onClose();
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      // A plan cap already opened the upgrade dialog on its way out of the API
      // layer. A red toast under it would read as a second, separate failure.
      if (isPlanLimit(err)) {
        handleClose();
        return;
      }
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={step === 1 ? 'Create a new form' : 'Choose a starting point'}
      centered
      // A fixed 960 left the preview cramped on a large screen and overflowing
      // on a small one. The picker step tracks the viewport with a ceiling, so
      // a long template (RSVP, feedback survey) is readable without scrolling
      // the modal itself.
      size={step === 2 ? 'min(1180px, 94vw)' : 'md'}
      radius="lg"
      styles={step === 2 ? { body: { overflow: 'hidden' } } : undefined}
    >
      {step === 1 ? (
        <form onSubmit={handleContinue}>
          <Stack gap="md">
            <TextInput
              label="Form name"
              placeholder="Client Details"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-autofocus
              required
            />

            <div>
              <Text size="sm" fw={500} mb={4}>
                Where will this form live?
              </Text>
              <Text size="xs" c="dimmed" mb={8}>
                Changes what theming applies to later — the page background only matters for a
                standalone share link.
              </Text>
              <SegmentedControl
                fullWidth
                value={scope}
                onChange={(value) => setScope(value as NonNullable<FormTheme['scope']>)}
                data={[
                  { value: 'page', label: 'Standalone link' },
                  { value: 'card', label: 'Embedded on a site' },
                ]}
              />
            </div>

            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" color="emerald" disabled={!name.trim()}>
                Continue
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack gap="md">
          <Box className={classes.stepBody}>
            <div className={classes.templateColumn}>
              {/* Above the search, because describing what you want is the
                  faster path when none of the templates is what you want. */}
              <TextInput
                placeholder="Describe a form to build…"
                value={prompt}
                onChange={(e) => setPrompt(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && prompt.trim() && !generating) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={generating}
                leftSection={<IconMessage size={15} />}
                rightSection={
                  generating ? (
                    <Loader size={14} />
                  ) : prompt.trim() ? (
                    <UnstyledButton
                      onClick={handleGenerate}
                      aria-label="Generate form"
                      style={{ display: 'flex' }}
                    >
                      <IconArrowRight size={15} />
                    </UnstyledButton>
                  ) : null
                }
                size="sm"
              />

              <TextInput
                placeholder="Search templates"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                leftSection={<IconSearch size={15} />}
                rightSection={
                  query ? <CloseButton size="sm" onClick={() => setQuery('')} aria-label="Clear search" /> : null
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

              <div className={classes.templateList}>
                {blank && (
                  <UnstyledButton
                    onClick={() => {
                      setTemplateId(blank.id);
                      handleCreate(blank);
                    }}
                    disabled={creating}
                    className={`${classes.templateItem} ${classes.blankItem} ${blank.id === templateId ? classes.templateItemActive : ''}`}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {creating && templateId === blank.id ? (
                      <Loader size="sm" color="emerald" />
                    ) : (
                      <IconPlus size={20} color="var(--mantine-color-emerald-6)" />
                    )}
                    <Text size="sm" fw={600}>
                      {blank.name}
                    </Text>
                  </UnstyledButton>
                )}

                {/* Directly under the blank card and above the templates: it is
                    the freshest thing here and the reason the person typed. */}
                {aiTemplate && (
                  <UnstyledButton
                    onClick={() => setTemplateId(aiTemplate.id)}
                    className={`${classes.templateItem} ${aiTemplate.id === activeTemplate.id ? classes.templateItemActive : ''}`}
                    style={{ display: 'block', width: '100%', textAlign: 'left', boxSizing: 'border-box' }}
                  >
                    <Group justify="space-between" gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600}>
                        {aiTemplate.name}
                      </Text>
                      <Text size="10px" c="dimmed" className={classes.categoryTag}>
                        GENERATED
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={2}>
                      {aiTemplate.fields.length} field{aiTemplate.fields.length === 1 ? '' : 's'} — edit
                      anything after creating.
                    </Text>
                  </UnstyledButton>
                )}

                {results.map((tpl) => (
                  <UnstyledButton
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={`${classes.templateItem} ${tpl.id === activeTemplate.id ? classes.templateItemActive : ''}`}
                    style={{ display: 'block', width: '100%', textAlign: 'left', boxSizing: 'border-box' }}
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
                    No templates match that. Try a different word, or start from a blank form.
                  </Text>
                )}
              </div>
            </div>

            {activeTemplate.id !== 'blank' && (
              <Box className={classes.previewPane}>
                {/* A thin bar of its own rather than floating over the stage,
                    where it collided with the modal's close button and its
                    tooltip opened off the top edge. */}
                <Box className={classes.previewBar}>
                  {/* Horizontal chips rather than a wrapping block: with a dozen
                      categories a wrapped bar cost the stage its height. */}
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

                  <DeviceSwitch device={device} onChange={setDevice} />
                </Box>

                <Box className={classes.stage} ref={stageRef}>
                  <DeviceFrame device={device} scale={scale} hidden={!measured}>
                    <FormPage theme={activeTemplate.theme} minHeight="100%">
                      {/* Remounted per device so each preview starts from page
                          one at that device's layout. */}
                      <FormRenderer
                        key={`${activeTemplate.id}-${device}`}
                        title={activeTemplate.title}
                        description={activeTemplate.formDescription}
                        fields={activeTemplate.fields}
                        theme={activeTemplate.theme}
                        submitLabel={activeTemplate.submitLabel}
                        hideHeader={activeTemplate.hideHeader}
                      />
                    </FormPage>
                  </DeviceFrame>
                </Box>
              </Box>
            )}
          </Box>

          <Group justify="space-between">
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Group>
              <Button variant="default" onClick={handleClose} disabled={creating}>
                Cancel
              </Button>
              <Button color="emerald" onClick={() => handleCreate()} loading={creating}>
                Create form
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
