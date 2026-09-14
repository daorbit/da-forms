import { Group, Loader, ScrollArea, Stack, Text } from '@mantine/core';
import { OrbitMark } from '@/components/OrbitMark';
import { Composer } from './Composer';
import type { Turn } from './types';
import classes from './createForm.module.css';

interface Props {
  turns: Turn[];
  generating: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
}

export function OrbitThread({ turns, generating, prompt, onPromptChange, onSend }: Props) {
  return (
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

                {turn.draft && (
                  <div className={classes.replyRow}>
                    <span className={classes.replyMark}>
                      <OrbitMark size={16} />
                    </span>
                    <div className={classes.fieldSummary}>
                      <div className={classes.summaryHead}>
                        <Text size="xs" fw={600}>
                          {turn.draft.title}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {turn.draft.fields.length} field
                          {turn.draft.fields.length === 1 ? '' : 's'}
                        </Text>
                      </div>
                      <Stack gap={0}>
                        {turn.draft.fields.map((f) => (
                          <div key={f.id} className={classes.fieldRow}>
                            <span className={classes.fieldDot} aria-hidden />
                            <Text size="xs" truncate style={{ flex: 1 }}>
                              {f.label}
                              {f.required && <span className={classes.required}> *</span>}
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

      <Composer
        compact
        value={prompt}
        onChange={onPromptChange}
        onSend={onSend}
        busy={generating}
        editing
      />
    </section>
  );
}
