import { Drawer, Stack, TextInput, Radio, Group, Text, Divider, SegmentedControl, Slider } from '@mantine/core';
import type { LabelPlacement, SubmitButtonSize, SubmitButtonWidth } from '@/types';
import classes from './drawer.module.css';

export interface QuickSettings {
  hideHeader: boolean;
  labelPlacement: LabelPlacement;
  submitLabel: string;
  submitButtonSize: SubmitButtonSize;
  submitButtonWidth: SubmitButtonWidth;
  collectIp: boolean;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  settings: QuickSettings;
  onChange: (patch: Partial<QuickSettings>) => void;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <Text size="sm" fw={600} mb="md">
        {label}
      </Text>
      <Stack gap="md">{children}</Stack>
    </section>
  );
}

/**
 * The settings that change how the whole form behaves, as opposed to one
 * field's properties. Applied live, like the properties panel — there is no
 * separate save.
 */
export function QuickSettingsDrawer({ opened, onClose, settings, onChange }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Quick Settings"
      padding="lg"
      classNames={classes}
    >
      <Stack gap="xl">
        <Section label="Display">
          <div>
            <Text size="sm" fw={500} mb={8}>
              Form header
            </Text>
            <Radio.Group
              value={settings.hideHeader ? 'hide' : 'show'}
              onChange={(value) => onChange({ hideHeader: value === 'hide' })}
            >
              <Group gap="xl">
                <Radio value="show" label="Show" />
                <Radio value="hide" label="Hide" />
              </Group>
            </Radio.Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb={8}>
              Label placement
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.labelPlacement}
              onChange={(value) => onChange({ labelPlacement: value as LabelPlacement })}
              data={[
                { value: 'top', label: 'Top' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>

          <TextInput
            label="Submit button label"
            value={settings.submitLabel}
            placeholder="Submit"
            onChange={(e) => onChange({ submitLabel: e.target.value })}
          />

          <div>
            <Text size="sm" fw={500} mb={8}>
              Submit button size
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.submitButtonSize}
              onChange={(value) => onChange({ submitButtonSize: value as SubmitButtonSize })}
              data={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
            />
          </div>

          <div>
            <Group justify="space-between" mb={8}>
              <Text size="sm" fw={500}>
                Submit button width
              </Text>
              <Text size="sm" c="dimmed">
                {settings.submitButtonWidth}%
              </Text>
            </Group>
            <Slider
              value={settings.submitButtonWidth}
              onChange={(value) => onChange({ submitButtonWidth: value as SubmitButtonWidth })}
              min={25}
              max={100}
              step={25}
              marks={[
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              color="emerald"
            />
          </div>
        </Section>

        <Divider />

        <Section label="Submission source info">
          <div>
            <Text size="sm" fw={500} mb={4}>
              Collect IP address
            </Text>
            <Text size="xs" c="dimmed" mb={8}>
              Stored with each entry. Personal data in most jurisdictions — say so in your privacy
              notice if you turn this on.
            </Text>
            <Radio.Group
              value={settings.collectIp ? 'yes' : 'no'}
              onChange={(value) => onChange({ collectIp: value === 'yes' })}
            >
              <Group gap="xl">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Group>
            </Radio.Group>
          </div>
        </Section>
      </Stack>
    </Drawer>
  );
}
