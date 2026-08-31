import { useState } from 'react';
import {
  Drawer, Stack, Text, Box, ActionIcon, Textarea, Loader, Group, UnstyledButton, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowUp, IconRobot } from '@tabler/icons-react';
import { generateFormDraft } from '@/lib/api';
import type { GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import classes from './PropertiesDrawer.module.css';
import ai from './AiEditDrawer.module.css';

/**
 * The form as the generator understands it. Rebuilt from live editor state on
 * every request so a follow-up prompt ("make the email optional") is applied
 * to what is actually on the canvas, not to the first draft.
 */
export interface CurrentFormSnapshot {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: GeneratedForm['fields'];
  theme?: Record<string, unknown>;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  /** Live editor state, in the generator's wire shape. */
  snapshot: CurrentFormSnapshot;
  /** Hand a revised form back to the editor to drop onto the canvas. */
  onApply: (form: GeneratedForm) => void;
  /** Demo workspace — the drawer explains rather than calls. */
  disabled?: boolean;
}

const SUGGESTIONS = [
  'Make the email field optional',
  'Add a phone number field',
  'Rewrite the description to be friendlier',
  'Add a dropdown for how they heard about us',
];

/** One exchange: what was asked, and the field count that came back. */
interface Turn {
  prompt: string;
  fieldCount?: number;
}

export function AiEditDrawer({ opened, onClose, workspaceId, snapshot, onApply, disabled }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  async function run(text?: string) {
    const asked = (text ?? prompt).trim();
    if (!asked || busy || disabled) return;

    setBusy(true);
    setTurns((t) => [...t, { prompt: asked }]);
    try {
      const next = await generateFormDraft(asked, workspaceId, snapshot as GeneratedForm);
      onApply(next);
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = { prompt: asked, fieldCount: next.fields.length };
        return copy;
      });
      setPrompt('');
    } catch (err) {
      setTurns((t) => t.slice(0, -1));
      if (isPlanLimit(err)) {
        onClose();
        return;
      }
      notifications.show({
        message: err instanceof Error ? err.message : 'Could not revise the form',
        color: 'red',
      });
    } finally {
      setBusy(false);
    }
  }

  const composer = (
    <Box className={ai.composer}>
      <Textarea
        placeholder={disabled ? 'Read-only demo workspace' : 'Ask for a change'}
        value={prompt}
        onChange={(e) => setPrompt(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            run();
          }
        }}
        autosize
        minRows={1}
        maxRows={4}
        radius="md"
        disabled={busy || disabled}
        data-autofocus
        styles={{
          input: {
            background: 'var(--mantine-color-default)',
            borderColor: 'var(--mantine-color-default-border)',
          },
          section: { alignItems: 'center' },
        }}
        rightSection={
          <ActionIcon
            variant={prompt.trim() ? 'filled' : 'subtle'}
            color={prompt.trim() ? 'blue' : 'gray'}
            radius="xl"
            size="sm"
            disabled={!prompt.trim() || busy || disabled}
            onClick={() => run()}
            aria-label="Apply change"
          >
            <IconArrowUp size={13} />
          </ActionIcon>
        }
      />
    </Box>
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={440}
      // Same as PropertiesDrawer: the canvas stays visible and clickable so an
      // author watches the AI's change land in place.
      padding={0}
      withOverlay={false}
      lockScroll={false}
      trapFocus={false}
      shadow="lg"
      title={
        <div className={classes.headerBar}>
          <IconRobot size={17} stroke={1.7} />
          <span className={classes.headerTitle}>Edit with AI</span>
        </div>
      }
      classNames={{
        header: classes.header,
        title: classes.title,
        body: classes.body,
        content: classes.content,
      }}
    >
      {/* Orbit's own surface, so this reads as the same assistant that drafts a
          form from scratch — a bordered column, conversation above, composer
          pinned below, faint aurora wash behind. */}
      <div className={ai.pane}>
        <ScrollArea className={ai.thread} type="hover" scrollbarSize={6} px="md" py="md">
          {turns.length === 0 ? (
            <Stack gap="lg" pt={4}>
              <Group gap={10} wrap="nowrap">
                <span className={ai.mark}>
                  <IconRobot size={18} stroke={1.6} />
                </span>
                <Text size="xs" c="dimmed" lh={1.5}>
                  Describe a change and it is applied to the form on the canvas.
                  Undo (Ctrl+Z) reverts it like any other edit.
                </Text>
              </Group>

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
                    disabled={busy || disabled}
                  >
                    <Text size="xs" lh={1.45}>{s}</Text>
                  </UnstyledButton>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack gap="sm">
              {turns.map((turn, i) => (
                <Stack key={i} gap="sm">
                  <Box className={ai.askBubble}>
                    <Text size="xs" lh={1.45}>{turn.prompt}</Text>
                  </Box>

                  {busy && i === turns.length - 1 && turn.fieldCount === undefined && (
                    <Group gap={8} wrap="nowrap">
                      <Loader size={12} type="dots" color="var(--mantine-color-blue-5)" />
                      <Text size="xs" c="blue.4" fw={500} className={ai.thinking}>
                        Revising
                      </Text>
                    </Group>
                  )}

                  {turn.fieldCount !== undefined && (
                    <Box className={ai.applied}>
                      <Text size="xs" c="dimmed">
                        Applied to the canvas — {turn.fieldCount} field
                        {turn.fieldCount === 1 ? '' : 's'}. Ctrl+Z to undo.
                      </Text>
                    </Box>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </ScrollArea>

        {composer}
      </div>
    </Drawer>
  );
}
