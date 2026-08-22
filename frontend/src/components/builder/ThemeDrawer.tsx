import { Drawer, Stack, Text, SegmentedControl, ColorInput, Divider } from '@mantine/core';
import type { FormTheme } from '@/types';
import classes from './drawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
}

const SWATCHES = [
  '#0f1115',
  '#1a1b1e',
  '#0b3d2e',
  '#0ca678',
  '#1971c2',
  '#7048e8',
  '#e64980',
  '#f08c00',
  '#ffffff',
  '#f8f9fa',
];

export function ThemeDrawer({ opened, onClose, theme, onChange }: Props) {
  const scope = theme.scope ?? 'page';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Theme"
      padding="lg"
      classNames={classes}
    >
      <Stack gap="xl">
        <div>
          <Text size="sm" fw={500} mb={8}>
            Where this form lives
          </Text>
          <SegmentedControl
            fullWidth
            value={scope}
            onChange={(value) => onChange({ scope: value as FormTheme['scope'] })}
            data={[
              { value: 'page', label: 'Standalone link' },
              { value: 'card', label: 'Embedded on a site' },
            ]}
          />
          <Text size="xs" c="dimmed" mt={6}>
            {scope === 'page'
              ? 'The page background below applies to the full share-link page.'
              : "Embedded forms sit on the host page's own background — only the card itself is themed."}
          </Text>
        </div>

        <Divider />

        {scope === 'page' && (
          <ColorInput
            label="Page background"
            description="Behind the card, on the standalone share-link page"
            placeholder="#0f1115"
            value={theme.pageBg ?? ''}
            onChange={(value) => onChange({ pageBg: value })}
            swatches={SWATCHES}
          />
        )}

        <ColorInput
          label="Card background"
          value={theme.cardBg ?? ''}
          onChange={(value) => onChange({ cardBg: value })}
          swatches={SWATCHES}
        />

        <ColorInput
          label="Card border"
          value={theme.cardBorder ?? ''}
          onChange={(value) => onChange({ cardBorder: value })}
          swatches={SWATCHES}
        />

        <ColorInput
          label="Submit button color"
          description="Also used for focus rings and other interactive highlights"
          placeholder="#0ca678"
          value={theme.accentColor ?? ''}
          onChange={(value) => onChange({ accentColor: value })}
          swatches={SWATCHES}
        />

        <ColorInput
          label="Label color"
          description="Field labels — leave empty to match the text color below"
          value={theme.labelColor ?? ''}
          onChange={(value) => onChange({ labelColor: value })}
          swatches={SWATCHES}
        />

        <div>
          <Text size="sm" fw={500} mb={8}>
            Text color
          </Text>
          <SegmentedControl
            fullWidth
            value={theme.textMode ?? 'auto'}
            onChange={(value) => onChange({ textMode: value as FormTheme['textMode'] })}
            data={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <Text size="xs" c="dimmed" mt={6}>
            Auto picks light or dark text based on the card background's brightness.
          </Text>
        </div>
      </Stack>
    </Drawer>
  );
}
