import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal, Textarea, Button, Group, Stack, Text, Box, Center, Loader, UnstyledButton, ActionIcon, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconArrowUp } from '@tabler/icons-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { OrbitMark } from '@/components/OrbitMark';
import { DeviceFrame, frameSize, type DeviceId } from '@/components/builder/DeviceFrame';
import { DeviceSwitch } from '@/components/builder/DeviceSwitch';
import { useFitScale } from '@/hooks/useFitScale';
import { createForm, generateFormDraft } from '@/lib/api';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import classes from './NewFormModal.module.css';
import ai from './AiFormModal.module.css';
import { clearOrbitDraft, readOrbitDraft, saveOrbitDraft } from '@/lib/orbitDraft';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Back to the method chooser, rather than closing outright. */
  onBack: () => void;
  formName: string;
  scope: NonNullable<FormTheme['scope']>;
}

const SUGGESTIONS = [
  'A job application form for a restaurant, with CV upload',
  'Patient intake for a dental clinic, calm and light',
  'Event feedback with a 1-5 rating and comments',
];

 
export function AiFormModal({ opened, onClose, onBack, formName, scope }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

 
  const [rescued] = useState(() => readOrbitDraft(workspaceId));

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<GeneratedForm | null>(rescued?.form ?? null);
  const [device, setDevice] = useState<DeviceId>('macbook');
  /** Every instruction so far, so the pane reads as a conversation. */
  const [history, setHistory] = useState<string[]>(rescued?.history ?? []);

  const template = draft ? generatedToTemplate(draft) : null;

  const size = frameSize(device);
  const { ref: stageRef, scale, measured } = useFitScale({
    contentWidth: size.width,
    contentHeight: size.height,
    padding: { x: 96, y: 72 },
  });

  function reset() {
    setPrompt('');
    setGenerating(false);
    setCreating(false);
    setDraft(null);
    setDevice('macbook');
    setHistory([]);
    // The stored copy exists only to survive a reload of this session. Leaving
    // it behind would mean reopening Orbit into an old conversation instead of
    // a blank pane.
    clearOrbitDraft();
  }

  function handleClose() {
    reset();
    onClose();
  }

 
  async function run(text?: string) {
    const asked = (text ?? prompt).trim();
    if (!asked || generating) return;

    setGenerating(true);
    setHistory((h) => [...h, asked]);
    try {
      const next = await generateFormDraft(asked, workspaceId, draft ?? undefined);
      setDraft(next);
 
      saveOrbitDraft({ workspaceId, formName, history: [...history, asked], form: next });
 
      setPrompt('');
    } catch (err) {
      setHistory((h) => h.slice(0, -1));
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
          theme: template.theme ?? { scope },
        },
        workspaceId
      );
      reset();
      onClose();
      navigate(`/${workspaceId}/forms/${form._id}/edit`);
    } catch (err) {
      setCreating(false);
      if (isPlanLimit(err)) {
        handleClose();
        return;
      }
      notifications.show({ message: 'Could not create form', color: 'red' });
    }
  }

  // One Textarea with the send button in its own right section — the same shape
  // Quantalog's Orbit composer uses. A button in a sibling element sits outside
  // the input's border and overflows the pane.
  const composer = (
    <Box px="md" pb="sm" pt={4}>
      <Textarea
        placeholder={draft ? 'Ask for a change' : 'Describe the form you need'}
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
        styles={{
          input: {
            paddingTop: 5,
            paddingBottom: 5,
            background: 'var(--mantine-color-default)',
            borderColor: 'var(--mantine-color-default-border)',
          },
          section: { alignItems: 'center' },
        }}
        autosize
        minRows={1}
        maxRows={4}
        radius="md"
        disabled={generating}
        data-autofocus
        rightSection={
          <ActionIcon
            variant={prompt.trim() ? 'filled' : 'subtle'}
            color={prompt.trim() ? 'emerald' : 'gray'}
            radius="xl"
            size="sm"
            disabled={!prompt.trim() || generating}
            onClick={() => run()}
            aria-label={draft ? 'Apply change' : 'Generate form'}
          >
            <IconArrowUp size={13} />
          </ActionIcon>
        }
      />
    </Box>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap={8}>
          <OrbitMark size={20} />
          <Text fw={600}>Build with Orbit</Text>
        </Group>
      }
      centered
      // A click on the backdrop is far more often a miss than an intent to
      // leave, and it would throw away a typed name, a chosen template, or a
      // draft that cost an AI question. Escape and the explicit buttons still
      // close it.
      closeOnClickOutside={false}
      // Wider than the template picker: the Orbit pane takes 380px to the
      // picker column's 290, and the preview must not lose that difference.
      size="min(1320px, 95vw)"
      radius="lg"
      styles={{ body: { overflow: 'hidden' } }}
    >
      <Stack gap="md">
        <Box className={`${classes.stepBody} ${ai.body}`}>
          {/* Orbit's own surface, so the assistant here reads as the one that
              answers questions elsewhere in Quantalog. */}
          <div className={ai.orbitPane}>
            <ScrollArea className={ai.thread} type="hover" scrollbarSize={6} px="md" py="md">
              {history.length === 0 ? (
                <Stack gap="lg" pt={8}>
                  <Stack gap={6} align="center">
                    <OrbitMark size={44} />
                    <Text size="sm" fw={650} ta="center">
                      Build a form with Orbit
                    </Text>
                    <Text size="xs" c="dimmed" ta="center" lh={1.5} maw={260}>
                      Describe what you need and Orbit drafts the fields, wording and colours.
                    </Text>
                  </Stack>

                  <Stack gap={7}>
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={600}
                      tt="uppercase"
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Try asking
                    </Text>
                    {SUGGESTIONS.map((s) => (
                      <UnstyledButton
                        key={s}
                        className={ai.suggestion}
                        onClick={() => run(s)}
                        disabled={generating}
                      >
                        <Text size="xs" lh={1.45}>
                          {s}
                        </Text>
                      </UnstyledButton>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Stack gap="sm">
                  {history.map((h, i) => (
                    <Box key={i} className={ai.askBubble}>
                      <Text size="xs" lh={1.45}>
                        {h}
                      </Text>
                    </Box>
                  ))}

                  {/* Same dots and pulsing label the Orbit panel uses while a
                      reply is in flight. */}
                  {generating && (
                    <Group gap={8} wrap="nowrap">
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" c="emerald.4" fw={500} className={ai.thinking}>
                        {draft ? 'Revising' : 'Building your form'}
                      </Text>
                    </Group>
                  )}

                  {template && !generating && (
                    <Box className={ai.fieldSummary}>
                      <Text size="xs" fw={600} mb={6}>
                        {template.fields.length} field{template.fields.length === 1 ? '' : 's'}
                      </Text>
                      <Stack gap={3}>
                        {template.fields.map((f) => (
                          <Group key={f.id} gap={6} wrap="nowrap">
                            <Text size="10px" c="dimmed" style={{ minWidth: 68 }}>
                              {f.type}
                            </Text>
                            <Text size="xs" truncate style={{ flex: 1 }}>
                              {f.label}
                              {f.required && (
                                <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>
                              )}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </ScrollArea>

            {composer}
          </div>

          <Box className={classes.previewPane}>
            <Box className={classes.previewBar}>
              <Text size="xs" c="dimmed" truncate>
                {template ? template.title : 'Preview'}
              </Text>
              <DeviceSwitch device={device} onChange={setDevice} />
            </Box>

            <Box className={classes.stage} ref={stageRef}>
              {template ? (
                <DeviceFrame device={device} scale={scale} hidden={!measured}>
                  <FormPage theme={template.theme} minHeight="100%">
                    <FormRenderer
                      // Remounted whenever the draft or device changes, so the
                      // preview never shows the previous form's page state.
                      key={`${template.fields.length}-${template.title}-${device}`}
                      title={template.title}
                      description={template.formDescription}
                      fields={template.fields}
                      theme={template.theme}
                      submitLabel={template.submitLabel}
                    />
                  </FormPage>
                </DeviceFrame>
              ) : (
                <Center h="100%">
                  <div className={ai.emptyStage}>
                    {/* Decorative: the text below says the same thing, and three
                        spinning rings announced to a screen reader are noise. */}
                    <div className={ai.rings} aria-hidden="true">
                      <span className={`${ai.ring} ${ai.ring1}`} />
                      <span className={`${ai.ring} ${ai.ring2}`} />
                      <span className={`${ai.ring} ${ai.ring3}`} />
                      <span className={ai.ringsCore}>
                        <OrbitMark size={30} />
                      </span>
                    </div>
                    {/* Addressed to the person, not a description of the panel:
                        the rings are already saying "ready", and what is
                        actually missing is their sentence. */}
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>
                        Waiting for your prompt
                      </Text>
                      <Text size="xs" c="dimmed" maw={240}>
                        Tell Orbit what the form is for and it appears here.
                      </Text>
                    </Stack>
                  </div>
                </Center>
              )}
            </Box>
          </Box>
        </Box>

        <Group justify="space-between">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={onBack}
            disabled={generating || creating}
          >
            Back
          </Button>
          <Group>
            <Button variant="default" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            <Button
              color="emerald"
              onClick={handleCreate}
              loading={creating}
              disabled={!template || generating}
            >
              Create form
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
