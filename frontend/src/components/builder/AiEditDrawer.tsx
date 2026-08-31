import { useState } from 'react';
import {
  Drawer, Stack, Text, Box, ActionIcon, Textarea, Loader, Group, UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowUp, IconRobot } from '@tabler/icons-react';
import { generateFormDraft } from '@/lib/api';
import type { GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import classes from './drawer.module.css';
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

export function AiEditDrawer({ opened, onClose, workspaceId, snapshot, onApply, disabled }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  /** Prompts sent this session, newest last — the pane reads as a thread. */
  const [history, setHistory] = useState<string[]>([]);

  async function run(text?: string) {
    const asked = (text ?? prompt).trim();
    if (!asked || busy || disabled) return;

    setBusy(true);
    setHistory((h) => [...h, asked]);
    try {
      const next = await generateFormDraft(asked, workspaceId, snapshot as GeneratedForm);
      onApply(next);
      setPrompt('');
    } catch (err) {
      setHistory((h) => h.slice(0, -1));
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

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={420}
      title={
        <Group gap={8}>
          <IconRobot size={18} stroke={1.6} />
          <span>Edit with AI</span>
        </Group>
      }
      padding="lg"
      classNames={classes}
      // Sits beside the icon rail rather than over it.
      styles={{ inner: { right: 56 } }}
    >
      <div className={ai.pane}>
        <div className={ai.thread}>
          {history.length === 0 ? (
            <Stack gap="lg" pt={4}>
              <Text size="sm" c="dimmed" lh={1.5}>
                Describe a change and it is applied to the form on the canvas.
                Undo (Ctrl+Z) reverts it like any other edit.
              </Text>
              <Stack gap={7}>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Try
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
              {history.map((h, i) => (
                <Box key={i} className={ai.askBubble}>
                  <Text size="xs" lh={1.45}>{h}</Text>
                </Box>
              ))}
              {busy && (
                <Group gap={8} wrap="nowrap">
                  <Loader size={12} type="dots" />
                  <Text size="xs" c="dimmed">Revising</Text>
                </Group>
              )}
              {!busy && (
                <Text size="xs" c="dimmed" ta="center" pt={4}>
                  Applied to the canvas.
                </Text>
              )}
            </Stack>
          )}
        </div>

        <Box pt="sm">
          {disabled && (
            <Text size="xs" c="dimmed" mb={6}>
              The demo workspace is read-only — open a form in your own workspace to edit it with AI.
            </Text>
          )}
          <Textarea
            placeholder="Ask for a change"
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
            styles={{ section: { alignItems: 'center' } }}
          />
        </Box>
      </div>
    </Drawer>
  );
}
