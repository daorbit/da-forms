import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal, Textarea, Button, Group, Stack, Text, Box, Center, Loader, UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconSend } from '@tabler/icons-react';
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

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Back to the method chooser, rather than closing outright. */
  onBack: () => void;
  formName: string;
  scope: NonNullable<FormTheme['scope']>;
}

/** Shown before the first generation, so the box is not a blank stare. */
const EXAMPLES = [
  'A job application form for a restaurant, with CV upload',
  'Patient intake for a dental clinic, calm and light',
  'Event feedback with a 1-5 rating and comments',
];

/**
 * Build a form by describing it.
 *
 * Its own modal rather than a box bolted onto the template picker: the two are
 * different ways of starting, and the template gallery's search, filters and
 * categories are all noise to someone who has already decided to describe what
 * they want.
 *
 * The result is a draft. Nothing is stored until Create form is pressed, so a
 * generation someone dislikes costs a click — and the follow-up box means the
 * fix for "nearly right" is a sentence rather than starting over.
 */
export function AiFormModal({ opened, onClose, onBack, formName, scope }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<GeneratedForm | null>(null);
  const [device, setDevice] = useState<DeviceId>('macbook');

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
  }

  function handleClose() {
    reset();
    onClose();
  }

  /**
   * Generate, or refine what is already there.
   *
   * The same box does both. Once a draft exists the prompt is read as a change
   * to it — "add a phone field" — and the draft goes along so the model edits
   * rather than starts over.
   */
  async function run() {
    const asked = prompt.trim();
    if (!asked || generating) return;

    setGenerating(true);
    try {
      const next = await generateFormDraft(asked, workspaceId, draft ?? undefined);
      setDraft(next);
      // Cleared so the box reads as ready for the next change rather than
      // still holding the instruction that has already been applied.
      setPrompt('');
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
      size={draft ? 'min(1180px, 94vw)' : 'lg'}
      radius="lg"
      styles={draft ? { body: { overflow: 'hidden' } } : undefined}
    >
      <Stack gap="md">
        {draft ? (
          <Box className={classes.stepBody}>
            <div className={classes.templateColumn}>
              <Textarea
                placeholder="Change something — “add a phone field”, “make it darker”…"
                value={prompt}
                onChange={(e) => setPrompt(e.currentTarget.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter is a newline, as in any chat box.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    run();
                  }
                }}
                disabled={generating}
                autosize
                minRows={2}
                maxRows={5}
                size="sm"
              />
              <Button
                onClick={run}
                loading={generating}
                disabled={!prompt.trim()}
                leftSection={generating ? undefined : <IconSend size={15} />}
                color="emerald"
                size="sm"
              >
                {generating ? 'Revising…' : 'Revise'}
              </Button>

              <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 12 }}>
                <Text size="xs" fw={600} c="dimmed" mb={6}>
                  {template!.fields.length} field{template!.fields.length === 1 ? '' : 's'}
                </Text>
                <Stack gap={4}>
                  {template!.fields.map((f) => (
                    <Group key={f.id} gap={6} wrap="nowrap">
                      <Text size="xs" c="dimmed" style={{ minWidth: 74 }}>
                        {f.type}
                      </Text>
                      <Text size="xs" truncate style={{ flex: 1 }}>
                        {f.label}
                        {f.required && <span style={{ color: 'var(--mantine-color-red-6)' }}> *</span>}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            </div>

            <Box className={classes.previewPane}>
              <Box className={classes.previewBar}>
                <Text size="xs" c="dimmed" truncate>
                  {template!.title}
                </Text>
                <DeviceSwitch device={device} onChange={setDevice} />
              </Box>

              <Box className={classes.stage} ref={stageRef}>
                <DeviceFrame device={device} scale={scale} hidden={!measured}>
                  <FormPage theme={template!.theme} minHeight="100%">
                    <FormRenderer
                      // Remounted whenever the draft or device changes, so the
                      // preview never shows the previous form's page state.
                      key={`${template!.fields.length}-${template!.title}-${device}`}
                      title={template!.title}
                      description={template!.formDescription}
                      fields={template!.fields}
                      theme={template!.theme}
                      submitLabel={template!.submitLabel}
                    />
                  </FormPage>
                </DeviceFrame>
              </Box>
            </Box>
          </Box>
        ) : generating ? (
          <Center py={64}>
            <Stack align="center" gap="sm">
              <Loader color="emerald" />
              <Text size="sm" c="dimmed">
                Building your form…
              </Text>
              <Text size="xs" c="dimmed">
                This takes a few seconds.
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Describe the form you need. Orbit drafts it — fields, wording and colours — and you
              edit anything afterwards.
            </Text>

            <Textarea
              placeholder="A job application form for a restaurant, with CV upload…"
              value={prompt}
              onChange={(e) => setPrompt(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  run();
                }
              }}
              autosize
              minRows={3}
              maxRows={6}
              data-autofocus
            />

            <div>
              <Text size="xs" c="dimmed" mb={6}>
                Or start from one of these
              </Text>
              <Stack gap={6}>
                {EXAMPLES.map((example) => (
                  <UnstyledButton
                    key={example}
                    onClick={() => setPrompt(example)}
                    className={classes.templateItem}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <Text size="xs">{example}</Text>
                  </UnstyledButton>
                ))}
              </Stack>
            </div>
          </Stack>
        )}

        <Group justify="space-between">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={draft ? () => setDraft(null) : onBack}
            disabled={generating || creating}
          >
            Back
          </Button>
          <Group>
            <Button variant="default" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            {draft ? (
              <Button color="emerald" onClick={handleCreate} loading={creating}>
                Create form
              </Button>
            ) : (
              <Button color="emerald" onClick={run} loading={generating} disabled={!prompt.trim()}>
                Generate
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
