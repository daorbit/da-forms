import { useRef, useState } from 'react';
import {
  Modal,
  Group,
  Box,
  Text,
  Button,
  ActionIcon,
  Divider,
  Stack,
  Switch,
  TextInput,
  Textarea,
  Select,
  TagsInput,
} from '@mantine/core';
import { IconX, IconMail, IconBellRinging } from '@tabler/icons-react';
import type { FormField, NotificationSettings } from '@/types';
import classes from './NotificationsModal.module.css';

type TabId = 'respondent' | 'owner';

const TABS: { id: TabId; label: string; icon: typeof IconMail; color: string }[] = [
  { id: 'respondent', label: 'Respondent email', icon: IconMail, color: '#0ca678' },
  { id: 'owner', label: 'Notify me', icon: IconBellRinging, color: '#7048e8' },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  formTitle: string;
  fields: FormField[];
  notifications: NotificationSettings;
  onChange: (patch: Partial<NotificationSettings>) => void;
}

/** Every field in document order, grids included — matches the backend's own flatten. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid' ? [field, ...(field.columns ?? []).flatMap(flattenFields)] : [field]
  );
}

/** A stand-in answer per field type, so the preview reads like a filled-out form rather than showing raw ids. */
function sampleValue(field: FormField): string {
  switch (field.type) {
    case 'name':
      return 'Ada Lovelace';
    case 'email':
      return 'ada@example.com';
    case 'phone':
      return '+1 555 0100';
    case 'website':
      return 'https://example.com';
    case 'number':
    case 'decimal':
    case 'currency':
      return '42';
    case 'date':
      return '2026-01-01';
    default:
      return field.placeholder || field.label || 'Sample answer';
  }
}

/**
 * Fills `{{Field Label}}` with a sample answer, for the live preview — mirrors
 * what the backend does with the real submission at send time.
 */
function fillPlaceholders(template: string, fields: FormField[]): string {
  const byLabel = new Map(
    flattenFields(fields)
      .filter((f) => f.label?.trim())
      .map((f) => [f.label!.trim(), sampleValue(f)])
  );
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, label: string) => byLabel.get(label.trim()) ?? match);
}

export function NotificationsModal({ opened, onClose, formTitle, fields, notifications, onChange }: Props) {
  const [tab, setTab] = useState<TabId>('respondent');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const emailFields = flattenFields(fields).filter((f) => f.type === 'email');
  const placeholderFields = flattenFields(fields).filter((f) => f.label && f.type !== 'grid');

  /** Inserts a placeholder at the cursor (or the end, with no selection), rather than always appending. */
  function insertPlaceholder(label: string) {
    const token = `{{${label}}}`;
    const el = bodyRef.current;
    const current = notifications.respondentBody ?? '';
    if (!el) {
      onChange({ respondentBody: `${current}${token}` });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
    onChange({ respondentBody: next });
    // Cursor lands right after the inserted token, so a second click chains
    // naturally instead of jumping back to wherever it started.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const respondentSubject = fillPlaceholders(
    notifications.respondentSubject || 'Thanks for your submission',
    fields
  );
  const respondentBody = fillPlaceholders(
    notifications.respondentBody || 'Thanks — we received your submission and will be in touch soon.',
    fields
  );
  const ownerSubject = notifications.ownerSubject || `New submission: ${formTitle || 'Untitled form'}`;
  const ownerBody = flattenFields(fields)
    .filter((f) => f.label)
    .map((f) => `${f.label}: ${sampleValue(f)}`)
    .join('\n');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column', border: 'none' },
        body: { flex: 1, minHeight: 0, overflow: 'hidden' },
      }}
    >
      <Group h="100%" gap={0} align="stretch" wrap="nowrap" className={classes.shell}>
        {/* ---- Panel ---- */}
        <Box className={classes.panel}>
          <Group gap="sm" px={20} py="md" wrap="nowrap" className={classes.panelHeader}>
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
              <IconX size={18} />
            </ActionIcon>
            <Divider orientation="vertical" my={6} />
            <Text fw={600}>Email Notifications</Text>
          </Group>

          <Group gap={0} wrap="nowrap" className={classes.tabs}>
            {TABS.map((item) => {
              const on = item.id === tab;
              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={on}
                  className={classes.tab}
                  style={{
                    color: on ? item.color : 'var(--mantine-color-dimmed)',
                    borderBottomColor: on ? item.color : 'transparent',
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </Box>
              );
            })}
          </Group>

          <Box className={classes.panelBody}>
            {tab === 'respondent' && (
              <Stack gap="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <div>
                    <Text size="sm" fw={600}>
                      Email the respondent
                    </Text>
                    <Text size="xs" c="dimmed">
                      Sends a confirmation to whoever fills out this form
                    </Text>
                  </div>
                  <Switch
                    checked={notifications.respondentEnabled ?? false}
                    onChange={(e) => onChange({ respondentEnabled: e.currentTarget.checked })}
                    color="emerald"
                    size="md"
                  />
                </Group>

                <Divider />

                {emailFields.length === 0 ? (
                  <Text size="sm" c="red">
                    Add an Email field to this form to send a confirmation — there's nothing to send
                    it to yet.
                  </Text>
                ) : (
                  <Select
                    label="Send to"
                    description="Which field holds the respondent's address"
                    data={emailFields.map((f) => ({ value: f.id, label: f.label || 'Untitled field' }))}
                    value={notifications.respondentEmailFieldId ?? null}
                    onChange={(value) => onChange({ respondentEmailFieldId: value ?? undefined })}
                    disabled={!notifications.respondentEnabled}
                  />
                )}

                <TextInput
                  label="Subject"
                  placeholder="Thanks for your submission"
                  value={notifications.respondentSubject ?? ''}
                  onChange={(e) => onChange({ respondentSubject: e.target.value })}
                  disabled={!notifications.respondentEnabled}
                />

                <Textarea
                  ref={bodyRef}
                  label="Message"
                  placeholder="Thanks — we received your submission and will be in touch soon."
                  value={notifications.respondentBody ?? ''}
                  onChange={(e) => onChange({ respondentBody: e.target.value })}
                  autosize
                  minRows={5}
                  disabled={!notifications.respondentEnabled}
                />

                {placeholderFields.length > 0 && (
                  <Box className={classes.placeholderHint}>
                    <Text size="xs" fw={600} mb={6}>
                      Insert an answer
                    </Text>
                    <Group gap={6}>
                      {placeholderFields.map((f) => (
                        <Text
                          key={f.id}
                          component="button"
                          type="button"
                          className={classes.placeholderTag}
                          disabled={!notifications.respondentEnabled}
                          onClick={() => insertPlaceholder(f.label)}
                          title={`Insert ${f.label}`}
                        >
                          {f.label || 'Untitled field'}
                        </Text>
                      ))}
                    </Group>
                  </Box>
                )}
              </Stack>
            )}

            {tab === 'owner' && (
              <Stack gap="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <div>
                    <Text size="sm" fw={600}>
                      Notify me
                    </Text>
                    <Text size="xs" c="dimmed">
                      Alerts your own inbox on every new submission
                    </Text>
                  </div>
                  <Switch
                    checked={notifications.ownerEnabled ?? false}
                    onChange={(e) => onChange({ ownerEnabled: e.currentTarget.checked })}
                    color="emerald"
                    size="md"
                  />
                </Group>

                <Divider />

                <TagsInput
                  label="Send to"
                  description="Press enter after each address"
                  placeholder="you@example.com"
                  value={notifications.ownerEmails ?? []}
                  onChange={(value) => onChange({ ownerEmails: value })}
                  disabled={!notifications.ownerEnabled}
                />
                <TextInput
                  label="Subject"
                  placeholder={`New submission: ${formTitle || 'Untitled form'}`}
                  value={notifications.ownerSubject ?? ''}
                  onChange={(e) => onChange({ ownerSubject: e.target.value })}
                  disabled={!notifications.ownerEnabled}
                />
                <Text size="xs" c="dimmed">
                  The message lists every answer on the form — there's no separate body to write.
                </Text>
              </Stack>
            )}
          </Box>

          <Group justify="flex-end" px={20} py="md" wrap="nowrap" className={classes.actionBar}>
            <Button variant="default" onClick={onClose}>
              Done
            </Button>
          </Group>
        </Box>

        {/* ---- Preview ---- */}
        <Box className={classes.preview}>
          <Group justify="space-between" align="center" mb="xl" wrap="nowrap">
            <Text fw={700} size="lg">
              Preview
            </Text>
          </Group>

          <Box className={classes.previewStage}>
            <Box className={classes.emailCard}>
              <Box className={classes.emailMeta}>
                <div className={classes.emailMetaRow}>
                  <span>From</span>
                  <span>{formTitle || 'Your form'}</span>
                </div>
                <div className={classes.emailMetaRow}>
                  <span>To</span>
                  <span>
                    {tab === 'respondent' ? 'ada@example.com' : notifications.ownerEmails?.[0] || 'you@example.com'}
                  </span>
                </div>
              </Box>
              <Text className={classes.emailSubject}>{tab === 'respondent' ? respondentSubject : ownerSubject}</Text>
              <Box className={classes.emailBody}>{tab === 'respondent' ? respondentBody : ownerBody}</Box>
            </Box>
          </Box>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Live preview of the {active.label.toLowerCase()} email, with sample answers filled in.
          </Text>
        </Box>
      </Group>
    </Modal>
  );
}
