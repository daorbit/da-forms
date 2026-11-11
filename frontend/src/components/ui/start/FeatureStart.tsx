import type { ReactNode } from 'react';
import { Button, Text } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import { StartCard, StartHero, StartScreen, StartSection } from './StartScreen';

export interface FeatureStartCard {
  icon: LucideIcon;
  title: string;
  text: string;
  preview: ReactNode;
}

interface Props {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  note?: string;
  cardsTitle?: string;
  cards: FeatureStartCard[];
}

export function FeatureStart({ id, icon: HeroIcon, title, text, action, note, cardsTitle = "What you'll see here", cards }: Props) {
  const ActionIcon = action?.icon;
  return (
    <StartScreen>
      <StartHero id={`${id}-title`} icon={<HeroIcon size={28} />} title={title} text={text}>
        {action && (
          <Button size="md" radius="md" onClick={action.onClick} leftSection={ActionIcon ? <ActionIcon size={16} /> : undefined}>
            {action.label}
          </Button>
        )}
        {note && (
          <Text size="xs" c="dimmed" ta="center">
            {note}
          </Text>
        )}
      </StartHero>

      <StartSection id={`${id}-features`} title={cardsTitle}>
        {cards.map(({ icon: Icon, title: cardTitle, text: cardText, preview }) => (
          <StartCard key={cardTitle} icon={<Icon size={14} />} title={cardTitle} text={cardText} preview={preview} />
        ))}
      </StartSection>
    </StartScreen>
  );
}
