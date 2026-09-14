import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Textarea, Button, Group, Stack, Text, SegmentedControl, Box, UnstyledButton, Chip, ScrollArea, CloseButton, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconClipboard, IconSearch } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { formTemplates, templateCategories, type TemplateCategory } from '@/lib/templates';
import { filterTemplates, usedCategories, type ScopeFilter } from '@/lib/templates/search';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import { createForm, importFormConfig, ApiError } from '@/lib/api';
import { isPlanLimit } from '@/lib/planLimit';
import { ScopePicker } from './newForm/ScopePicker';
import { StartMethodCards } from './newForm/StartMethodCards';
import classes from './NewFormModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  /**
   * What the first step already collected, when reopening from the Orbit modal.
   *
   * Without it, coming back from Orbit would land on an empty name field and
   * ask for a decision already made.
   */
  resume?: { name: string; scope: NonNullable<FormTheme['scope']> } | null;
  /** Hand off to the Orbit modal, carrying the name and scope already chosen. */
  onUseAi: (name: string, scope: NonNullable<FormTheme['scope']>) => void;
}

export function NewFormModal({ opened, onClose, onUseAi, resume }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  // 4 is the paste step, reached only from the import card on step two.
  const [step, setStep] = useState<1 | 2 | 3 | 4>(resume ? 2 : 1);
  const [name, setName] = useState(resume?.name ?? '');
  const [scope, setScope] = useState<NonNullable<FormTheme['scope']>>(resume?.scope ?? 'page');
  const defaultTemplateId = formTemplates.find((t) => t.id !== 'blank')?.id ?? formTemplates[0].id;
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const [device, setDevice] = useState<DeviceId>('macbook');

  /** The pasted config, and whatever was wrong with it last time we tried. */
  const [configText, setConfigText] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

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
  // no longer in the list, fall through to the first visible one.
  const selected = results.find((t) => t.id === templateId);
  const activeTemplate = selected ?? results[0] ?? formTemplates.find((t) => t.id === templateId) ?? formTemplates[0];

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
    setConfigText('');
    setConfigError(null);
    setImporting(false);
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

  /**
   * Read the clipboard for them where the browser allows it.
   *
   * Permission is refused outright in some browsers and on insecure origins, so
   * a failure is silent: the textarea is still there and Ctrl+V still works.
   */
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setConfigText(text);
        setConfigError(null);
      }
    } catch {
      /* No clipboard permission — they can paste into the field themselves. */
    }
  }

  /**
   * Create a form from a pasted config.
   *
   * The JSON is parsed here only to give a useful message for a truncated or
   * mangled paste; what the config actually contains is the server's call,
   * since it is the side that decides what may cross a workspace boundary.
   */
  async function handleImport() {
    const text = configText.trim();
    if (!text) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setConfigError('That is not valid JSON — paste the whole config, including the braces.');
      return;
    }

    setImporting(true);
    setConfigError(null);
    try {
      const form = await importFormConfig(parsed, workspaceId);
      reset();
      onClose();
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setImporting(false);
      if (isPlanLimit(err)) {
        handleClose();
        return;
      }
      setConfigError(
        err instanceof ApiError ? err.message : 'Could not import that config.'
      );
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        step === 1
          ? 'Create a new form'
          : step === 2
            ? 'How do you want to start?'
            : step === 4
              ? 'Import a form config'
              : 'Choose a template'
      }
      centered
      // A click on the backdrop is far more often a miss than an intent to
      // leave, and it would throw away a typed name, a chosen template, or a
      // draft that cost an AI question. Escape and the explicit buttons still
      // close it.
      closeOnClickOutside={false}

      size={
        step === 3
          ? 'min(1180px, 94vw)'
          : step === 2
            ? 'min(760px, 94vw)'
            : 'min(820px, 94vw)'
      }
      radius="lg"
      styles={step === 3 ? { body: { overflow: 'hidden' } } : undefined}
    >
      {step === 2 ? (
        <Stack gap="md">
          {/* Repeats the title's question only to name the form: the title has
              to stand on its own, and this is where what was typed comes back
              so the step is clearly about that form and not forms in general. */}
          <Text size="sm" c="dimmed" mt={-4}>
            How would you like to start “{name.trim()}”?
          </Text>

          <StartMethodCards
            creating={creating || importing}
            creatingBlank={creating && templateId === blank?.id}
            importing={importing}
            onBlank={() => {
              if (!blank) return;
              setTemplateId(blank.id);
              handleCreate(blank);
            }}
            onTemplate={() => setStep(3)}
            onOrbit={() => onUseAi(name.trim(), scope)}
            onImport={() => {
              setConfigError(null);
              setStep(4);
              pasteFromClipboard();
            }}
          />

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : step === 4 ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed" mt={-4}>
            Open the form you want to copy in its own workspace, choose{' '}
            <b>Copy config</b>, and paste it here. It arrives as a draft named “
            {name.trim()}”.
          </Text>

          <Textarea
            label="Form config"
            description="The JSON copied from another form. Fields, layout, theme and settings travel; uploaded background images and webhook secrets do not."
            placeholder='{"kind":"da-forms/form-config", …}'
            value={configText}
            onChange={(e) => {
              setConfigText(e.currentTarget.value);
              setConfigError(null);
            }}
            error={configError}
            autosize
            minRows={7}
            maxRows={14}
            spellCheck={false}
            styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
            data-autofocus
            disabled={importing}
          />

          <Group gap="xs">
            <Button
              variant="light"
              color="gray"
              size="xs"
              leftSection={<IconClipboard size={14} />}
              onClick={pasteFromClipboard}
              disabled={importing}
            >
              Paste from clipboard
            </Button>
            {configText && (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={() => {
                  setConfigText('');
                  setConfigError(null);
                }}
                disabled={importing}
              >
                Clear
              </Button>
            )}
          </Group>

          {/* Payment fields keep the gateway they name, but the keys are the
              importing workspace's — worth saying before someone publishes a
              pasted checkout and wonders whose account it charges. */}
          <Alert color="gray" variant="light" radius="md">
            <Text size="xs">
              The form is imported as a draft. Payment fields keep their gateway,
              but charge through this workspace&apos;s own keys — connect it under
              Integrations before publishing.
            </Text>
          </Alert>

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => setStep(2)}
              disabled={importing}
            >
              Back
            </Button>
            <Group>
              <Button variant="default" onClick={handleClose} disabled={importing}>
                Cancel
              </Button>
              <Button
                color="emerald"
                onClick={handleImport}
                loading={importing}
                disabled={!configText.trim()}
              >
                Import form
              </Button>
            </Group>
          </Group>
        </Stack>
      ) : step === 1 ? (
        <form onSubmit={handleContinue}>
          <Stack gap="xl">
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
              <Text size="xs" c="dimmed" mb={10}>
                Changes what theming applies to later — the page background only matters for a
                standalone share link.
              </Text>
              <ScopePicker value={scope} onChange={setScope} />
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
                {/* No blank card here: starting from scratch is its own choice
                    on the previous step, and repeating it at the top of the
                    template list made it read as a template. */}
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
                    No templates match that. Try a different word, or go back and start from
                    scratch.
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
            <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => setStep(2)}>
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
