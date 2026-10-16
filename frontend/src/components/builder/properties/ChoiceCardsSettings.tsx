import { SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import type { FormField } from '@/types';
import { ImagePicker } from '@/components/builder/ImagePicker';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import type { SectionProps } from './types';
import classes from './ChoiceCardsSettings.module.css';

type OptionMap = 'optionImages' | 'optionBadges' | 'optionHints';

const COLUMNS = ['1', '2', '3', '4'];

export function ChoiceCardsSettings({ field, set }: SectionProps) {
  const cards = field.choiceLayout === 'cards';
  const options = field.options ?? [];

  const setOption = (key: OptionMap, option: string, value: string | undefined) => {
    const next = { ...(field[key] ?? {}) };
    if (value) next[option] = value;
    else delete next[option];
    set({ [key]: Object.keys(next).length ? next : undefined } as Partial<FormField>);
  };

  return (
    <Stack gap="sm">
      <Switch
        label="Show as picture cards"
        description="Big tappable cards, each with an optional image, badge and note — like a quiz funnel."
        checked={cards}
        onChange={(e) => set({ choiceLayout: e.currentTarget.checked ? 'cards' : undefined })}
      />
      <DocsLink path={DOCS.quizFunnel} label="Building a quiz funnel" />

      {cards && (
        <>
          <div>
            <Text size="sm" fw={500} mb={6}>
              Columns
            </Text>
            <SegmentedControl
              fullWidth
              data={COLUMNS}
              value={String(field.cardColumns ?? (Object.keys(field.optionImages ?? {}).length ? 2 : 1))}
              onChange={(v) => set({ cardColumns: Number(v) })}
            />
          </div>

          <div className={classes.list}>
            {options.map((option) => (
              <div key={option} className={classes.option}>
                <div className={classes.head}>
                  <ImagePicker
                    compact
                    value={field.optionImages?.[option]}
                    onChange={(url) => setOption('optionImages', option, url)}
                    label={`Image for ${option}`}
                  />
                  <Text size="sm" fw={600} className={classes.name}>
                    {option}
                  </Text>
                </div>
                <div className={classes.fields}>
                  <TextInput
                    size="xs"
                    placeholder="Badge, e.g. Most popular"
                    value={field.optionBadges?.[option] ?? ''}
                    onChange={(e) => setOption('optionBadges', option, e.target.value)}
                  />
                  <TextInput
                    size="xs"
                    placeholder="Note, e.g. ₹299 / month"
                    value={field.optionHints?.[option] ?? ''}
                    onChange={(e) => setOption('optionHints', option, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Stack>
  );
}
