import {
  Drawer,
  Stack,
  TextInput,
  NumberInput,
  Radio,
  Group,
  Text,
  Divider,
  SegmentedControl,
  Slider,
  Box,
} from '@mantine/core';
import type {
  LabelPlacement,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormSchedule,
} from '@/types';
import classes from './drawer.module.css';

export interface QuickSettings {
  hideHeader: boolean;
  labelPlacement: LabelPlacement;
  submitLabel: string;
  submitButtonSize: SubmitButtonSize;
  submitButtonWidth: SubmitButtonWidth;
  submitButtonAlign: SubmitButtonAlign;
  collectIp: boolean;
  requireCaptcha: boolean;
  collectPartials: boolean;
  allowEdit: boolean;
  schedule?: FormSchedule;
}

/** `undefined` for an empty box, so a cleared date removes the bound entirely. */
function toIso(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * An ISO instant as `datetime-local` wants it: local time, no zone, no seconds.
 *
 * The input has no notion of a timezone, so the string it is given is read as
 * whatever the owner's browser is set to — which is what they mean when they
 * type a closing time.
 */
function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
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
      // Mantine writes this onto the content element, which then drives the
      // header and body insets — set to 0 and controlled entirely by our own
      // .header/.body classes below instead, so the two never fight.
      padding={0}
      classNames={{
        header: classes.header,
        title: classes.title,
        body: classes.body,
        content: classes.content,
      }}
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

          <div style={{ paddingBottom: 8 }}>
            <Group justify="space-between" mb={8}>
              <Text size="sm" fw={500}>
                Submit button width
              </Text>
              <Text size="sm" c="dimmed">
                {settings.submitButtonWidth}%
              </Text>
            </Group>
            {/*
             * Mantine positions each mark label centered on its point, so the
             * end marks' text overflows the track — inset the slider itself so
             * that overflow lands inside the drawer's own padding instead of
             * triggering a horizontal scrollbar on the panel.
             */}
            <Box px={6}>
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
            </Box>
          </div>

          <div>
            <Text size="sm" fw={500} mb={8} mt={10}>
              Submit button position
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.submitButtonAlign}
              onChange={(value) => onChange({ submitButtonAlign: value as SubmitButtonAlign })}
              data={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
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

          <div>
            <Text size="sm" fw={500} mb={4}>
              Save partial responses
            </Text>
            <Text size="xs" c="dimmed" mb={8}>
              Records answers as they're typed, so you can see which question people give up on.
              This stores what someone chose not to send — tell respondents if you turn it on.
              Drafts are deleted after 30 days.
            </Text>
            <Radio.Group
              value={settings.collectPartials ? 'yes' : 'no'}
              onChange={(value) => onChange({ collectPartials: value === 'yes' })}
            >
              <Group gap="xl">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Group>
            </Radio.Group>
          </div>
        </Section>

        <Divider />

        <Section label="Spam protection">
          <div>
            <Text size="sm" fw={500} mb={4}>
              Require a captcha
            </Text>
            <Text size="xs" c="dimmed" mb={8}>
              Adds an invisible Cloudflare check before a response is accepted. Worth it on a form
              that's linked publicly or takes payment; unnecessary on one only a few people see.
            </Text>
            <Radio.Group
              value={settings.requireCaptcha ? 'yes' : 'no'}
              onChange={(value) => onChange({ requireCaptcha: value === 'yes' })}
            >
              <Group gap="xl">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Group>
            </Radio.Group>
          </div>
        </Section>

        <Divider />

        <Section label="After submitting">
          <div>
            <Text size="sm" fw={500} mb={4}>
              Let people edit their response
            </Text>
            <Text size="xs" c="dimmed" mb={8}>
              Adds a link to the confirmation email, valid for 7 days. Needs the respondent
              confirmation email switched on. Not available on forms that take payment.
            </Text>
            <Radio.Group
              value={settings.allowEdit ? 'yes' : 'no'}
              onChange={(value) => onChange({ allowEdit: value === 'yes' })}
            >
              <Group gap="xl">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Group>
            </Radio.Group>
          </div>
        </Section>

        <Divider />

        <Section label="Schedule">
          <Text size="xs" c="dimmed" mt={-8}>
            Leave a field empty for no limit. A published form outside these bounds shows your
            closed message instead of the questions.
          </Text>

          <TextInput
            type="datetime-local"
            label="Opens"
            value={toLocalInput(settings.schedule?.opensAt)}
            onChange={(e) =>
              onChange({ schedule: { ...settings.schedule, opensAt: toIso(e.target.value) } })
            }
          />

          <TextInput
            type="datetime-local"
            label="Closes"
            value={toLocalInput(settings.schedule?.closesAt)}
            onChange={(e) =>
              onChange({ schedule: { ...settings.schedule, closesAt: toIso(e.target.value) } })
            }
          />

          <NumberInput
            label="Response limit"
            description="Stops accepting once this many responses are in."
            min={1}
            value={settings.schedule?.maxSubmissions ?? ''}
            onChange={(value) =>
              onChange({
                schedule: {
                  ...settings.schedule,
                  maxSubmissions: typeof value === 'number' ? value : undefined,
                },
              })
            }
          />

          <TextInput
            label="Closed message"
            placeholder="This form is no longer accepting responses"
            value={settings.schedule?.closedMessage ?? ''}
            onChange={(e) =>
              onChange({
                schedule: { ...settings.schedule, closedMessage: e.target.value || undefined },
              })
            }
          />
        </Section>
      </Stack>
    </Drawer>
  );
}
