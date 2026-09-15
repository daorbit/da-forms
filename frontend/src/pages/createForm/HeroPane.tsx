import { Loader, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { OrbitMark } from '@/components/OrbitMark';
import type { SuggestionChip } from '@/lib/formSuggestions';
import { Composer } from './Composer';
import type { DeckCard } from './types';
import classes from './createForm.module.css';

interface Props {
  suggestions: SuggestionChip[];
  deck: DeckCard[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  generating: boolean;
  creating: boolean;
  pendingImage: string | null;
  onAttachImage: (dataUrl: string | null) => void;
}

export function HeroPane({
  suggestions,
  deck,
  prompt,
  onPromptChange,
  onSend,
  generating,
  creating,
  pendingImage,
  onAttachImage,
}: Props) {
  return (
    <>
      <div className={classes.hero}>
        <div className={`${classes.heroHead} ${classes.rise}`} style={{ animationDelay: '40ms' }}>
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

        <div
          className={classes.rise}
          style={{
            animationDelay: '120ms',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Composer
            compact={false}
            value={prompt}
            onChange={onPromptChange}
            onSend={onSend}
            busy={generating}
            editing={false}
            pendingImage={pendingImage}
            onAttachImage={onAttachImage}
          />
        </div>

        <div className={classes.suggestions}>
          {suggestions.map((s, i) => (
            <UnstyledButton
              key={s.label}
              className={`${classes.suggestion} ${classes.rise}`}
              style={{ animationDelay: `${200 + i * 60}ms` }}
              onClick={() => {
                onPromptChange(s.prompt);
                document.querySelector<HTMLTextAreaElement>('#create-prompt')?.focus();
              }}
              disabled={generating}
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
  );
}
