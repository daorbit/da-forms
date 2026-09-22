import { useState } from 'react';
import {
  Drawer, Stack, Text, Box, ActionIcon, Textarea, Loader, Group, ScrollArea,
  ColorSwatch, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowUp } from '@tabler/icons-react';
import { OrbitMark } from '@/components/OrbitMark';
import { requestFormEdit } from '@/lib/api';
import type { EditOp, EditSnapshot } from '@/lib/editOps';
import { isPlanLimit } from '@/lib/planLimit';
import drawerShared from './PropertiesDrawer.module.css';
// The exact pane the from-scratch generator uses — same border, wash, bubble,
// suggestion and thinking treatments, so the two read as one assistant.
import ai from '@/components/AiFormModal.module.css';
import edit from './AiEditDrawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  /**
   * Live editor state, as the model is shown it. Rebuilt on every request so a
   * follow-up ("now make it optional too") reads against what is on the canvas.
   */
  snapshot: EditSnapshot;
  /** Apply the changes to the canvas, and say how many of them landed. */
  onApply: (ops: EditOp[]) => number;
  /** Demo workspace — the drawer explains rather than calls. */
  disabled?: boolean;
}

/**
 * One exchange: what was asked, and how much changed.
 *
 * A count of changes rather than of fields. The old line reported the form's
 * length, which said nothing about what the edit did — and read as a lie on a
 * restyle, where it announced five fields and meant none of them.
 */
interface Turn {
  prompt: string;
  changes?: number;
  summary?: string;
  /** Hex values a "setTheme" op actually touched, for a quick swatch preview. */
  themeColors?: [string, string][];
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The colour keys a `setTheme` reply changed, in the order the theme defines them. */
function themeColorsOf(ops: EditOp[]): [string, string][] | undefined {
  const theme = ops.find((o): o is Extract<EditOp, { op: 'setTheme' }> => o.op === 'setTheme');
  if (!theme) return undefined;
  const colors = Object.entries(theme.patch).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && HEX.test(entry[1]),
  );
  return colors.length ? colors : undefined;
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
      const { ops, summary } = await requestFormEdit(asked, snapshot, workspaceId);
      const changes = onApply(ops);
      const themeColors = themeColorsOf(ops);
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = { prompt: asked, changes, summary, themeColors };
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

  // The gradient-edged composer, matching the scheduler's "Let's plan a post"
  // input and the Orbit AI page's own — same drifting rainbow border so this
  // reads as the same assistant, not a plainer stand-in for it.
  const composer = (
    <Box px="md" pb="sm" pt={4} style={{ flexShrink: 0 }}>
      <Box className={edit.gradientComposer}>
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
          variant="unstyled"
          styles={{
            input: {
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 5,
              paddingBottom: 5,
              background: 'transparent',
              // Pinned rather than inherited: this drawer renders in
              // Mantine's own body-level portal, and the management chrome's
              // dark-mode text colour is only re-asserted for
              // `.mantine-Drawer-*` in global.css, with no light-mode
              // counterpart — leaving the input to whatever Mantine's
              // default portal cascade resolves, which does not reliably
              // match this app's own token.
              color: 'var(--mantine-color-text)',
            },
          }}
          autosize
          minRows={1}
          maxRows={6}
          disabled={busy || disabled}
          data-autofocus
        />
        {/* Anchored to the box's own corner rather than Mantine's rightSection,
            which centers on the full (now multi-row) input height and would
            float the button mid-way up a tall box instead of at its foot. */}
        <Group justify="flex-end" px={8} pb={6}>
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
        </Group>
      </Box>
    </Box>
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={440}
      padding={0}
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.35 }}
      transitionProps={{ duration: 180, transition: 'slide-left' }}
      title={
        <div className={drawerShared.headerBar}>
          <OrbitMark size={18} />
          <span className={drawerShared.headerTitle}>Edit with Orbit</span>
        </div>
      }
      classNames={{
        header: edit.header,
        title: edit.title,
        body: edit.body,
        content: edit.content,
      }}
    >
      <div className={`${ai.orbitPane} ${edit.pane}`}>
        {turns.length === 0 ? (
          <Intro composer={composer} />
        ) : (
          <>
            <ScrollArea className={edit.thread} type="hover" scrollbarSize={6} px="md" py="md">
              <Stack gap="sm">
                {turns.map((turn, i) => (
                  <Stack key={i} gap="sm">
                    <Box className={ai.askBubble}>
                      <Text size="xs" lh={1.45}>{turn.prompt}</Text>
                    </Box>

                    {busy && i === turns.length - 1 && turn.changes === undefined && (
                      <Group gap={9} wrap="nowrap">
                        <OrbitMark size={16} />
                        <Loader size={13} type="dots" color="var(--mantine-color-emerald-5)" />
                      </Group>
                    )}

                    {turn.changes !== undefined && (
                      <Group gap={9} wrap="nowrap" align="flex-start">
                        <Box style={{ flexShrink: 0, marginTop: 1 }}>
                          <OrbitMark size={16} />
                        </Box>
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text size="xs" c="dimmed" lh={1.5}>
                            {turn.changes === 0 ? (
                              'Nothing to change for that — try naming the field.'
                            ) : turn.summary ? (
                              turn.summary
                            ) : (
                              <>
                                Applied to the canvas — {turn.changes} change
                                {turn.changes === 1 ? '' : 's'}.
                              </>
                            )}
                          </Text>

                          {turn.themeColors && turn.themeColors.length > 0 && (
                            <Group gap={6} mt={7} wrap="wrap">
                              {turn.themeColors.map(([key, hex]) => (
                                <Tooltip key={key} label={`${key}: ${hex}`} withArrow>
                                  <Group gap={5} wrap="nowrap">
                                    <ColorSwatch color={hex} size={14} />
                                    <Text size="10px" c="dimmed">{hex}</Text>
                                  </Group>
                                </Tooltip>
                              ))}
                            </Group>
                          )}

                        </Box>
                      </Group>
                    )}
                  </Stack>
                ))}
              </Stack>
            </ScrollArea>

            {composer}
          </>
        )}
      </div>
    </Drawer>
  );
}

/**
 * The blank state: heading up top, the gradient composer centered below it —
 * the same shape as the scheduler's "Let's plan a post" screen, so the two
 * read as one assistant rather than this drawer's own smaller version of it.
 */
function Intro({ composer }: { composer: React.ReactNode }) {
  return (
    <Stack gap={20} align="center" justify="center" h="100%" px={16} py={20}>
      <Stack gap={4} align="center">
        <Text size="md" fw={600} ta="center">Edit this form with Orbit</Text>
        <Text size="xs" c="dimmed" ta="center" maw={320} lh={1.5}>
          Describe a change and Orbit applies it to the form on the canvas.
        </Text>
      </Stack>

      <Box w="100%">{composer}</Box>
    </Stack>
  );
}
