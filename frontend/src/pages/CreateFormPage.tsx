import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Button,
  Center,
  CloseButton,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconArrowUp, IconCheck, IconPlus } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { OrbitMark } from '@/components/OrbitMark';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import { ApiError, createForm, generateFormDraft, importFormConfig } from '@/lib/api';
import { formTemplates } from '@/lib/templates';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import { pickSuggestionChips } from '@/lib/formSuggestions';
import { Aurora } from './createForm/Aurora';
import { TemplatePane } from './createForm/TemplatePane';
import { ImportPane } from './createForm/ImportPane';
import { useFieldReveal } from './createForm/useFieldReveal';
import classes from './createForm/createForm.module.css';

type Scope = NonNullable<FormTheme['scope']>;

/** One exchange: what was asked, and the form it produced. */
interface Turn {
  prompt: string;
  form: GeneratedForm | null;
}

interface DeckCard {
  key: string;
  art?: string;
  title: string;
  body: string;
  onClick: () => void;
  busy?: boolean;
}

/**
 * The create flow, as a page of its own rather than a modal.
 *
 * The name and the scope are already settled by the time anyone arrives — the
 * list page asks for both in a small dialog and passes them in the URL — so
 * this screen is only ever about the form itself.
 *
 * It has two faces. Before there is a draft it is a single prompt, centred,
 * with the other ways in beneath it. Once a form exists it becomes a
 * workspace: Orbit on the left to keep asking for changes, the form on the
 * right in a device mock, and a bar along the bottom to accept it.
 */
export function CreateFormPage() {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [searchParams] = useSearchParams();

  // Both come from the dialog on the list page. The fallbacks only matter if
  // someone reaches this URL directly, which should still work rather than
  // creating a form with no name at all.
  const formName = searchParams.get('name')?.trim() || 'Untitled form';
  const scope: Scope = searchParams.get('scope') === 'card' ? 'card' : 'page';

  /**
   * Which way in is on screen.
   *
   * 'hero' is the prompt and the deck of alternatives; the other two are the
   * panes those alternatives open. Orbit has no mode of its own — it takes over
   * as soon as there is a turn to show.
   */
  const [mode, setMode] = useState<'hero' | 'template' | 'import'>('hero');

  /** Drawn once per mount, so the list does not reshuffle on every keystroke. */
  const [suggestions] = useState(() => pickSuggestionChips(3));

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [device, setDevice] = useState<DeviceId>('macbook');
  /**
   * Every exchange so far, so the panel reads as a conversation and each answer
   * stays on screen after the next prompt instead of being overwritten.
   */
  const [turns, setTurns] = useState<Turn[]>([]);

  // The live draft is just the most recent turn that produced a form.
  const draft = useMemo(
    () => [...turns].reverse().find((t) => t.form)?.form ?? null,
    [turns]
  );
  const template = useMemo(() => (draft ? generatedToTemplate(draft) : null), [draft]);

  /**
   * The reveal plays for the first form only. Replaying it on every revision
   * would mean tearing the whole form down to watch it rebuild over a one-word
   * change.
   */
  const firstDraft = turns.filter((t) => t.form).length <= 1;
  const { shown, done } = useFieldReveal({
    total: template?.fields.length ?? 0,
    enabled: firstDraft,
  });

  // The preview only ever renders the fields that have arrived, so the form
  // visibly grows as it is written.
  const visibleFields = template ? template.fields.slice(0, shown) : [];
  const ready = Boolean(template) && !generating && done;

  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 48, y: 40 },
  });

  function backToList() {
    navigate(`/${workspaceId}/forms`);
  }

  async function run(text?: string) {
    const asked = (text ?? prompt).trim();
    if (!asked || generating) return;

    setGenerating(true);
    // The pending turn shows its ask immediately; its summary fills in when the
    // reply lands.
    setTurns((t) => [...t, { prompt: asked, form: null }]);
    setPrompt('');
    try {
      const next = await generateFormDraft(asked, workspaceId, draft ?? undefined);
      setTurns((t) => [...t.slice(0, -1), { prompt: asked, form: next }]);
    } catch (err) {
      setTurns((t) => t.slice(0, -1));
      // A spent AI allowance opens the upgrade dialog on its way out of the API
      // layer; there is nothing useful to say on top of it.
      if (isPlanLimit(err)) return;
      notifications.show({
        message: err instanceof Error ? err.message : 'Could not generate a form',
        color: 'red',
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreate() {
    if (!template || creating) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          title: template.title,
          description: template.formDescription,
          fields: template.fields,
          submitLabel: template.submitLabel,
          theme: { ...(template.theme ?? {}), scope },
        },
        workspaceId
      );
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      if (isPlanLimit(err)) return;
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  /** Start a blank form immediately, under the name already chosen. */
  async function handleBlank() {
    const blank = formTemplates.find((t) => t.id === 'blank');
    if (!blank || creating) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          title: formName,
          description: blank.formDescription,
          fields: blank.fields,
          submitLabel: blank.submitLabel,
          theme: blank.theme ?? { scope },
        },
        workspaceId
      );
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      if (isPlanLimit(err)) return;
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  /** Create from a picked template, under the name already chosen. */
  async function handleTemplate(tpl: (typeof formTemplates)[number]) {
    if (creating) return;
    setCreating(true);
    try {
      const form = await createForm(
        {
          name: formName,
          // A blank form has no heading of its own, so it falls back to the
          // name; every other template brings one.
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
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      if (isPlanLimit(err)) return;
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  /** Bring in a config copied from another form, as a draft. */
  async function handleImport(parsed: unknown) {
    if (importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const form = await importFormConfig(parsed, workspaceId);
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setImporting(false);
      if (isPlanLimit(err)) return;
      setImportError(
        err instanceof ApiError ? err.message : 'Could not import that config.'
      );
    }
  }

  /** The other ways in, shown under the prompt. */
  const deck: DeckCard[] = [
    {
      key: 'blank',
      title: 'Start from scratch',
      body: 'A blank slate is all you need',
      onClick: handleBlank,
      busy: creating,
    },
    {
      key: 'template',
      art: '/build-with-tempalte.webp',
      title: 'Use a template',
      body: `${formTemplates.length - 1} ready-made forms`,
      onClick: () => setMode('template'),
    },
    {
      key: 'import',
      art: '/build-with-config.webp',
      title: 'Import a config',
      body: 'Paste a config from another form',
      onClick: () => {
        setImportError(null);
        setMode('import');
      },
    },
  ];

  /**
   * One Textarea with the send button in its own right section, so the button
   * sits inside the input's border. In a sibling element it overflows the pane
   * at this width.
   */
  function composer({ compact }: { compact: boolean }) {
    return (
      <div className={compact ? classes.composerCompact : classes.composer}>
        <Textarea
          id={compact ? undefined : 'create-prompt'}
          placeholder={
            draft ? 'Ask for a change — “add a phone field”' : 'Describe the form you need'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          // Enter sends, shift+Enter breaks a line — the opposite trips everyone
          // who has ever used a chat.
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
          variant="unstyled"
          autosize
          minRows={compact ? 1 : 3}
          maxRows={compact ? 4 : 8}
          px={compact ? 'sm' : 'md'}
          pt={compact ? 6 : 'sm'}
          disabled={generating}
          data-autofocus={compact ? undefined : true}
          styles={{ input: { fontSize: compact ? 13 : 15, lineHeight: 1.55 } }}
        />

        <div className={classes.composerFoot}>
          <Text size="xs" c="dimmed">
            {generating ? 'Orbit is working…' : 'Enter to send'}
          </Text>
          <Tooltip label={draft ? 'Apply change' : 'Generate form'} withArrow>
            <ActionIcon
              variant={prompt.trim() ? 'filled' : 'subtle'}
              color={prompt.trim() ? 'emerald' : 'gray'}
              radius="xl"
              size={compact ? 'sm' : 'lg'}
              disabled={!prompt.trim() || generating}
              onClick={() => run()}
              aria-label={draft ? 'Apply change' : 'Generate form'}
            >
              <IconArrowUp size={compact ? 13 : 18} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <>
      <Aurora building={generating || turns.length > 0} />

      <div className={classes.page}>
        <header className={classes.topbar}>
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            leftSection={<IconArrowLeft size={16} />}
            // Inside one of the panes, Back is a step within this screen and
            // returns to the prompt; from the prompt itself there is nowhere
            // left to go but the list.
            onClick={mode === 'hero' ? backToList : () => setMode('hero')}
            disabled={creating || importing}
          >
            Back
          </Button>
          <Group gap={10}>
            <Text size="sm" fw={600}>
              {formName}
            </Text>
            <Text size="xs" c="dimmed">
              {scope === 'card' ? 'Embedded' : 'Standalone link'}
            </Text>
            <CloseButton size="lg" radius="xl" onClick={backToList} aria-label="Close" />
          </Group>
        </header>

        {mode === 'template' ? (
          <TemplatePane scope={scope} creating={creating} onCreate={handleTemplate} />
        ) : mode === 'import' ? (
          <ImportPane
            importing={importing}
            error={importError}
            onErrorChange={setImportError}
            onImport={handleImport}
          />
        ) : turns.length > 0 ? (
          /* ------------------------------------------------- workspace -- */
          <div className={classes.build}>
            <section className={classes.orbitPane}>
              <div className={classes.paneHead}>
                <OrbitMark size={18} />
                <Text size="sm" fw={600}>
                  Orbit
                </Text>
              </div>

              <ScrollArea className={classes.thread} type="hover" scrollbarSize={6} px="sm" py="sm">
                <Stack gap="sm">
                  {turns.map((turn, i) => {
                    const turnTemplate = turn.form ? generatedToTemplate(turn.form) : null;
                    const pending = generating && i === turns.length - 1 && !turn.form;
                    return (
                      <Stack key={i} gap="xs">
                        <div className={classes.askBubble}>
                          <Text size="xs" lh={1.45}>
                            {turn.prompt}
                          </Text>
                        </div>

                        {pending && (
                          <Group gap={8} wrap="nowrap">
                            <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                            <Text size="xs" c="emerald.4" fw={500} className={classes.thinking}>
                              {i === 0 ? 'Building your form' : 'Revising'}
                            </Text>
                          </Group>
                        )}

                        {turnTemplate && (
                          <div className={classes.fieldSummary}>
                            <Text size="xs" fw={600} mb={6}>
                              {turnTemplate.fields.length} field
                              {turnTemplate.fields.length === 1 ? '' : 's'}
                            </Text>
                            <Stack gap={3}>
                              {turnTemplate.fields.map((f) => (
                                <div key={f.id} className={classes.fieldRow}>
                                  <span className={classes.fieldType}>{f.type}</span>
                                  <Text size="xs" truncate style={{ flex: 1 }}>
                                    {f.label}
                                    {f.required && (
                                      <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>
                                    )}
                                  </Text>
                                </div>
                              ))}
                            </Stack>
                          </div>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              </ScrollArea>

              {composer({ compact: true })}
            </section>

            <section className={classes.previewPane}>
              <div className={classes.previewBar}>
                <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                  {generating ? (
                    <>
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" c="emerald.4" fw={500} className={classes.thinking}>
                        Revising
                      </Text>
                    </>
                  ) : done ? (
                    <>
                      <IconCheck size={13} color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" fw={500}>
                        Your form is ready
                      </Text>
                    </>
                  ) : (
                    <>
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" c="emerald.4" fw={500} className={classes.thinking}>
                        Building your form
                      </Text>
                    </>
                  )}
                </Group>
                <DeviceSwitch device={device} onChange={setDevice} />
              </div>

              <div className={classes.stage} ref={stageRef}>
                {template ? (
                  <DeviceFrame device={device} scale={scale} hidden={!measured}>
                    <FormPage theme={template.theme} minHeight="100%">
                      <div className={classes.revealed}>
                        <FormRenderer
                          // Remounted per revealed count and device, so each
                          // newly dealt field enters with the drop-in animation
                          // and the preview never keeps the previous layout.
                          key={`${shown}-${template.fields.length}-${device}`}
                          title={template.title}
                          description={template.formDescription}
                          fields={visibleFields}
                          theme={template.theme}
                          submitLabel={template.submitLabel}
                        />
                      </div>
                    </FormPage>
                  </DeviceFrame>
                ) : (
                  <Center h="100%">
                    <div className={classes.emptyStage}>
                      <OrbitMark size={40} />
                      <Text size="sm" c="dimmed">
                        Drafting your form…
                      </Text>
                    </div>
                  </Center>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* ------------------------------------------------------- hero -- */
          <>
            <div className={classes.hero}>
              <div className={classes.heroHead}>
                <span className={classes.heroMark}>
                  <OrbitMark size={84} />
                </span>
                <Stack gap={2}>
                  <Title order={2} fw={750}>
                    Describe your form
                  </Title>
                  <Text c="dimmed">Orbit creates it for you</Text>
                </Stack>
              </div>

              {composer({ compact: false })}

              <div className={classes.suggestions}>
                {suggestions.map((s) => (
                  <UnstyledButton
                    key={s.label}
                    className={classes.suggestion}
                    onClick={() => run(s.prompt)}
                    disabled={generating}
                    // The chip shows the short name; the sentence it actually
                    // sends is worth being able to read before clicking.
                    title={s.prompt}
                  >
                    {s.label}
                  </UnstyledButton>
                ))}
              </div>
            </div>

            <div className={classes.deck}>
              <div className={classes.deckGrid}>
                {deck.map((card) => (
                  <UnstyledButton
                    key={card.key}
                    className={classes.deckCard}
                    onClick={card.onClick}
                    disabled={creating || generating}
                  >
                    <span className={classes.deckArt}>
                      {card.art ? (
                        <img src={card.art} alt="" aria-hidden />
                      ) : card.busy ? (
                        <Loader size={26} color="emerald" />
                      ) : (
                        <IconPlus size={26} />
                      )}
                    </span>
                    <span className={classes.deckBody}>
                      <Text fw={600} size="sm">
                        {card.title}
                      </Text>
                      <Text size="xs" c="dimmed" mt={3}>
                        {card.body}
                      </Text>
                    </span>
                  </UnstyledButton>
                ))}
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------- ready bar -- */}
        {ready && (
          <div className={classes.readyBar}>
            <div className={classes.readyInner}>
              <Text size="sm" c="dimmed">
                Happy with it? Keep asking for changes on the left, or take it into the
                builder.
              </Text>
              <Button
                color="emerald"
                size="md"
                onClick={handleCreate}
                loading={creating}
                style={{ marginLeft: 'auto' }}
              >
                Create form
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
