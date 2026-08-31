import { useState } from 'react';
import {
  Drawer, Stack, Text, Box, ActionIcon, Textarea, Loader, Group, UnstyledButton, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowUp } from '@tabler/icons-react';
import { OrbitMark } from '@/components/OrbitMark';
import { generateFormDraft } from '@/lib/api';
import type { GeneratedForm } from '@/lib/generatedForm';
import { isPlanLimit } from '@/lib/planLimit';
import drawer from './PropertiesDrawer.module.css';
// The exact pane the from-scratch generator uses — same border, wash, bubble,
// suggestion and thinking treatments, so the two read as one assistant.
import ai from '@/components/AiFormModal.module.css';
import edit from './AiEditDrawer.module.css';

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

  // One Textarea with the send button in its own right section — the same shape
  // the from-scratch composer uses.
  const composer = (
    <Box px="md" pb="sm" pt={4}>
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
        disabled={busy || disabled}
        data-autofocus
        rightSection={
          <ActionIcon
            variant={prompt.trim() ? 'filled' : 'subtle'}
            color={prompt.trim() ? 'emerald' : 'gray'}
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
        <div className={drawer.headerBar}>
          <OrbitMark size={18} />
          <span className={drawer.headerTitle}>Edit with Orbit</span>
        </div>
      }
      classNames={{
        header: drawer.header,
        title: drawer.title,
        body: drawer.body,
        content: drawer.content,
      }}
    >
      <div className={`${ai.orbitPane} ${edit.pane}`}>
        <ScrollArea className={ai.thread} type="hover" scrollbarSize={6} px="md" py="md">
          {turns.length === 0 ? (
            <Stack gap="lg" pt={8}>
              <Stack gap={6} align="center">
                <OrbitMark size={44} />
                <Text size="sm" fw={650} ta="center">
                  Edit this form with Orbit
                </Text>
                <Text size="xs" c="dimmed" ta="center" lh={1.5} maw={260}>
                  Describe a change and Orbit applies it to the form on the canvas. Undo (Ctrl+Z) reverts it.
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
                      <Loader size={12} type="dots" color="var(--mantine-color-emerald-5)" />
                      <Text size="xs" c="emerald.4" fw={500} className={ai.thinking}>
                        Revising
                      </Text>
                    </Group>
                  )}

                  {turn.fieldCount !== undefined && (
                    <Box className={ai.fieldSummary}>
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
