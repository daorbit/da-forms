import { useEffect, useMemo, useState } from 'react';
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
import type { FormField, FormTheme } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { OrbitMark } from '@/components/OrbitMark';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import {
  ApiError,
  createForm,
  generateFormDraft,
  importFormConfig,
  requestFormEdit,
} from '@/lib/api';
import { applyEditOps, toEditSnapshotFields, type EditSnapshot } from '@/lib/editOps';
import { formTemplates } from '@/lib/templates';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import { pickSuggestionChips } from '@/lib/formSuggestions';
import { Aurora } from './createForm/Aurora';
import { DraftingStage } from './createForm/DraftingStage';
import { TemplatePane } from './createForm/TemplatePane';
import { ImportPane } from './createForm/ImportPane';
import { useFieldReveal } from './createForm/useFieldReveal';
import classes from './createForm/createForm.module.css';

type Scope = NonNullable<FormTheme['scope']>;

/**
 * The form as it currently stands.
 *
 * Held as a template rather than as the wire shape the model answers with,
 * because edits arrive as operations against the fields already on screen — so
 * the fields, with their ids, are the thing being carried forward.
 */
interface Draft {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: FormField[];
  theme?: FormTheme;
}

/** One exchange: what was asked, and the form as it stood after it. */
interface Turn {
  prompt: string;
  draft: Draft | null;
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

  /**
   * The ask being answered while the hero is still on screen, or null.
   *
   * Set only for the first ask: it holds the hero in place through the wait so
   * the transition into the workspace is a handover rather than a cut.
   */
  const [drafting, setDrafting] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [device, setDevice] = useState<DeviceId>('macbook');
  /**
   * Every exchange so far, so the panel reads as a conversation and each answer
   * stays on screen after the next prompt instead of being overwritten.
   */
  const [turns, setTurns] = useState<Turn[]>([]);

  // The live form is just the most recent turn that produced one.
  const template = useMemo(
    () => [...turns].reverse().find((t) => t.draft)?.draft ?? null,
    [turns]
  );

  /**
   * The reveal plays for the first form only. Replaying it on every revision
   * would mean tearing the whole form down to watch it rebuild over a one-word
   * change.
   */
  const firstDraft = turns.filter((t) => t.draft).length <= 1;
  const { shown, done } = useFieldReveal({
    total: template?.fields.length ?? 0,
    enabled: firstDraft,
  });

  // The preview only ever renders the fields that have arrived, so the form
  // visibly grows as it is written.
  const visibleFields = template ? template.fields.slice(0, shown) : [];

  /*
   * The ready bar appears once and then stays.
   *
   * Gating it on the live state meant it unmounted for the length of every
   * revision and animated back in afterwards, which moved the page under the
   * cursor each time. Once a form exists there is always something to create,
   * so the bar has no reason to leave — the button disables itself while a
   * revision is in flight instead.
   */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (template && done && !generating) setReady(true);
  }, [template, done, generating]);

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

    // The very first ask stays on the hero while it is answered, so the screen
    // does not cut to an empty workspace the instant Send is pressed. Later
    // asks are made from inside the workspace, where the panel already shows
    // what is happening.
    const first = turns.length === 0;
    if (first) setDrafting(asked);

    setGenerating(true);
    // The pending turn shows its ask immediately; its summary fills in when the
    // reply lands.
    setTurns((t) => [...t, { prompt: asked, draft: null }]);
    setPrompt('');
    try {
      let next: Draft;

      if (template) {
        /*
         * An existing form is edited, not regenerated.
         *
         * The model answers with operations against the ids it was shown, and
         * those are applied to the fields already on screen. Asking for a whole
         * form back instead means everything the prompt did not mention is
         * rewritten from scratch — which is how "add an email field" ended up
         * replacing the fields that were already there.
         */
        const snapshot: EditSnapshot = {
          title: template.title,
          formDescription: template.formDescription,
          submitLabel: template.submitLabel,
          theme: template.theme as unknown as Record<string, unknown>,
          fields: toEditSnapshotFields(template.fields),
        };

        const { ops } = await requestFormEdit(asked, snapshot, workspaceId);
        const result = applyEditOps(ops, template.fields);

        if (!result.applied) {
          setTurns((t) => t.slice(0, -1));
          notifications.show({
            message: 'Orbit did not find anything to change',
            color: 'yellow',
          });
          return;
        }

        next = {
          title: result.form.title ?? template.title,
          formDescription:
            result.form.formDescription !== undefined
              ? result.form.formDescription
              : template.formDescription,
          submitLabel:
            result.form.submitLabel !== undefined
              ? result.form.submitLabel
              : template.submitLabel,
          fields: result.fields,
          theme: result.theme
            ? { ...(template.theme ?? {}), ...(result.theme as FormTheme) }
            : template.theme,
        };
      } else {
        const generated = await generateFormDraft(asked, workspaceId);
        const built = generatedToTemplate(generated);
        next = {
          title: built.title,
          formDescription: built.formDescription,
          submitLabel: built.submitLabel,
          fields: built.fields,
          theme: built.theme,
        };
      }

      setTurns((t) => [...t.slice(0, -1), { prompt: asked, draft: next }]);
    } catch (err) {
      setTurns((t) => t.slice(0, -1));
      setDrafting(null);
      // A spent AI allowance opens the upgrade dialog on its way out of the API
      // layer; there is nothing useful to say on top of it.
      if (isPlanLimit(err)) return;
      notifications.show({
        message: err instanceof Error ? err.message : 'Could not generate a form',
        color: 'red',
      });
      return;
    } finally {
      setGenerating(false);
    }

    /*
     * A beat on the hero after the reply lands, before the workspace opens.
     *
     * The last progress line gets to finish rather than being cut off
     * mid-sentence by the layout changing underneath it — the answer is already
     * in state, so nothing is being waited on here but the eye catching up.
     */
    if (first) {
      await new Promise((resolve) => setTimeout(resolve, 620));
      setDrafting(null);
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
            template ? 'Ask for a change — “add a phone field”' : 'Describe the form you need'
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

          {/* A labelled button on the hero, where it is the one thing to press;
              a bare arrow in the side panel, where the label would crowd a
              280px column. */}
          {compact ? (
            <Tooltip label="Apply change" withArrow>
              <ActionIcon
                variant={prompt.trim() ? 'filled' : 'subtle'}
                color={prompt.trim() ? 'emerald' : 'gray'}
                radius="xl"
                size="sm"
                disabled={!prompt.trim() || generating}
                onClick={() => run()}
                aria-label="Apply change"
              >
                <IconArrowUp size={13} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              color="emerald"
              radius="xl"
              size="sm"
              leftSection={<IconArrowUp size={15} />}
              disabled={!prompt.trim() || generating}
              loading={generating}
              onClick={() => run()}
            >
              Send
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Aurora building={generating || Boolean(drafting) || turns.length > 0} />

      <div className={classes.page}>
        <header className={classes.topbar}>
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            leftSection={<IconArrowLeft size={16} />}
            /*
             * Back is a step within this screen wherever there is one to take.
             *
             * The workspace is not a `mode` — it is whatever `turns` says — so
             * checking the mode alone left Back exiting to the list from the
             * one screen people most want to step back from.
             */
            onClick={() => {
              if (mode !== 'hero') {
                setMode('hero');
                return;
              }
              if (turns.length > 0) {
                // Throwing away a generated form on a stray Back click would
                // cost an AI question and give nothing back, so it is worth
                // asking first.
                const ok = window.confirm(
                  'Start over? The form Orbit drafted will be discarded.'
                );
                if (!ok) return;
                setTurns([]);
                setReady(false);
                setPrompt('');
                return;
              }
              backToList();
            }}
            disabled={creating || importing || generating}
          >
            Back
          </Button>
          <CloseButton size="lg" radius="xl" onClick={backToList} aria-label="Close" />
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
        ) : drafting ? (
          /* -------------------------------------------------- drafting -- */
          <div className={classes.hero}>
            <DraftingStage prompt={drafting} done={Boolean(template)} />
          </div>
        ) : turns.length > 0 ? (
          /* ------------------------------------------------- workspace -- */
          <div className={classes.build}>
            <section className={`${classes.orbitPane} ${classes.paneEnterLeft}`}>
              <div className={classes.paneHead}>
                <OrbitMark size={18} />
                <Text size="sm" fw={600}>
                  Orbit
                </Text>
                <Text size="10px" c="dimmed" className={classes.turnCount}>
                  {turns.length} {turns.length === 1 ? 'ask' : 'asks'}
                </Text>
              </div>

              <ScrollArea className={classes.thread} type="hover" scrollbarSize={6} px="sm" py="sm">
                <Stack gap="lg">
                  {turns.map((turn, i) => {
                    const turnTemplate = turn.draft;
                    const pending = generating && i === turns.length - 1 && !turn.draft;
                    return (
                      <Stack key={i} gap={10} className={classes.turn}>
                        <div className={classes.askRow}>
                          <div className={classes.askBubble}>
                            <Text size="xs" lh={1.5}>
                              {turn.prompt}
                            </Text>
                          </div>
                        </div>

                        {pending && (
                          <div className={classes.replyRow}>
                            <span className={classes.replyMark}>
                              <OrbitMark size={16} />
                            </span>
                            <Group gap={8} wrap="nowrap" className={classes.pendingBubble}>
                              <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                              <Text size="xs" c="emerald.4" fw={500} className={classes.thinking}>
                                {i === 0 ? 'Building your form' : 'Revising'}
                              </Text>
                            </Group>
                          </div>
                        )}

                        {turnTemplate && (
                          <div className={classes.replyRow}>
                            <span className={classes.replyMark}>
                              <OrbitMark size={16} />
                            </span>
                            <div className={classes.fieldSummary}>
                              <div className={classes.summaryHead}>
                                <Text size="xs" fw={600}>
                                  {turnTemplate.title}
                                </Text>
                                <Text size="10px" c="dimmed">
                                  {turnTemplate.fields.length} field
                                  {turnTemplate.fields.length === 1 ? '' : 's'}
                                </Text>
                              </div>
                              <Stack gap={0}>
                                {turnTemplate.fields.map((f) => (
                                  <div key={f.id} className={classes.fieldRow}>
                                    <span className={classes.fieldDot} aria-hidden />
                                    <Text size="xs" truncate style={{ flex: 1 }}>
                                      {f.label}
                                      {f.required && (
                                        <span className={classes.required}> *</span>
                                      )}
                                    </Text>
                                    <span className={classes.fieldType}>{f.type}</span>
                                  </div>
                                ))}
                              </Stack>
                            </div>
                          </div>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              </ScrollArea>

              {composer({ compact: true })}
            </section>

            <section className={`${classes.previewPane} ${classes.paneEnterRight}`}>
              <div className={classes.previewBar}>
                {/* The status is the payoff of the whole screen, so it gets a
                    pill of its own rather than a line of small text in a
                    corner. */}
                <div
                  className={`${classes.status} ${
                    !generating && done ? classes.statusReady : ''
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" fw={600} className={classes.thinking}>
                        Revising
                      </Text>
                    </>
                  ) : done ? (
                    <>
                      <span className={classes.statusTick}>
                        <IconCheck size={11} stroke={3} />
                      </span>
                      <Text size="xs" fw={600}>
                        Your form is ready
                      </Text>
                    </>
                  ) : (
                    <>
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" fw={600} className={classes.thinking}>
                        Building your form
                      </Text>
                    </>
                  )}
                </div>

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

                        {/* A placeholder for the field currently being written.
                            Without it the form grows in silent jumps; with it
                            there is always something in motion at the point the
                            next field is about to appear. */}
                        {!done && (
                          <div className={classes.ghostField} aria-hidden>
                            <span className={`${classes.ghostBar} ${classes.ghostLabel}`} />
                            <span className={`${classes.ghostBar} ${classes.ghostInput}`} />
                          </div>
                        )}
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
            {/* Each block enters a beat after the one above it. The delays are
                set inline because they are positional, not stylistic — a class
                per index would be four rules saying the same thing. */}
            <div className={classes.hero}>
              <div
                className={`${classes.heroHead} ${classes.rise}`}
                style={{ animationDelay: '40ms' }}
              >
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

              <div className={classes.rise} style={{ animationDelay: '120ms', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {composer({ compact: false })}
              </div>

              <div className={classes.suggestions}>
                {suggestions.map((s, i) => (
                  <UnstyledButton
                    key={s.label}
                    className={`${classes.suggestion} ${classes.rise}`}
                    style={{ animationDelay: `${200 + i * 60}ms` }}
                    // Fills the box rather than sending outright. The chip is a
                    // starting point, and the sentence behind it is usually
                    // worth a word or two of the person's own before it goes.
                    onClick={() => {
                      setPrompt(s.prompt);
                      document.querySelector<HTMLTextAreaElement>('#create-prompt')?.focus();
                    }}
                    disabled={generating}
                    // The chip shows the short name; the sentence it fills in is
                    // worth being able to read before clicking.
                    title={s.prompt}
                  >
                    {s.label}
                  </UnstyledButton>
                ))}
              </div>
            </div>

            <div className={classes.deck}>
              <div className={classes.deckGrid}>
                {deck.map((card, i) => (
                  <UnstyledButton
                    key={card.key}
                    className={`${classes.deckCard} ${classes.rise}`}
                    style={{ animationDelay: `${320 + i * 70}ms` }}
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
              <Text size="xs" c="dimmed">
                Keep refining on the left, or open it in the builder.
              </Text>
              <Button
                color="emerald"
                size="md"
                onClick={handleCreate}
                loading={creating}
                // Held rather than hidden while a revision is in flight: the
                // bar staying put is the whole point of latching it.
                disabled={generating}
                className={classes.readyAction}
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
