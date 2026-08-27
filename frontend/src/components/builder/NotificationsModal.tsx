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
  Select,
  TextInput,
  TagsInput,
  SegmentedControl,
  Menu,
  UnstyledButton,
  Tooltip,
} from '@mantine/core';
import { IconX, IconMail, IconBellRinging, IconChevronDown, IconPlus } from '@tabler/icons-react';
import type { EmailLayout, FormField, FormTheme, NotificationSettings } from '@/types';
import { EMAIL_LAYOUTS, renderEmail } from '@/lib/emailTemplates';
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
  theme?: FormTheme;
  notifications: NotificationSettings;
  onChange: (patch: Partial<NotificationSettings>) => void;
}

/** Every field in document order, grids included — matches the backend's own flatten. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid' ? [field, ...(field.columns ?? []).flatMap(flattenFields)] : [field]
  );
}

/** A stand-in answer per field type, so the preview reads like a real message rather than a template. */
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
      return field.placeholder || 'Sample answer';
  }
}

/**
 * A miniature of what a layout produces.
 *
 * Drawn as bars and blocks rather than rendering the real email at 1/8 scale:
 * at thumbnail size the actual text is unreadable anyway, and what someone is
 * choosing between here is the *shape* — where the tick sits, whether there is
 * a band across the top, whether answers and a button follow the text.
 */
function LayoutThumb({ id, accent }: { id: EmailLayout; accent: string }) {
  const line = (width: string, key: number) => (
    <span key={key} className={classes.thumbLine} style={{ width }} />
  );

  return (
    <span className={classes.thumb} data-bare={id === 'minimal' || undefined}>
      {id === 'banner' && <span className={classes.thumbBanner} style={{ backgroundColor: accent }} />}
      <span className={classes.thumbInner}>
        {id !== 'banner' && id !== 'minimal' && id !== 'hero' && (
          <span className={classes.thumbName} />
        )}
        {(id === 'thankYou' || id === 'confirmation') && (
          <span className={classes.thumbTick} style={{ backgroundColor: accent }} />
        )}
        {id === 'hero' && <span className={classes.thumbHero} />}
        {[...Array(id === 'hero' ? 2 : 3)].map((_, i) => line(i === 2 ? '60%' : '100%', i))}
        {(id === 'receipt' || id === 'confirmation') && <span className={classes.thumbPanel} />}
        {(id === 'nextSteps' || id === 'confirmation') && (
          <span className={classes.thumbButton} style={{ backgroundColor: accent }} />
        )}
      </span>
    </span>
  );
}

/** Fills `{{Field Label}}` with a sample answer — mirrors what the backend does at send time. */
function fillPlaceholders(template: string, fields: FormField[]): string {
  const byLabel = new Map(
    flattenFields(fields)
      .filter((f) => f.label?.trim())
      .map((f) => [f.label.trim(), sampleValue(f)])
  );
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, label: string) => byLabel.get(label.trim()) ?? match);
}

export function NotificationsModal({
  opened,
  onClose,
  formTitle,
  fields,
  theme,
  notifications,
  onChange,
}: Props) {
  const [tab, setTab] = useState<TabId>('respondent');
  const [previewing, setPreviewing] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const emailFields = flattenFields(fields).filter((f) => f.type === 'email');
  const placeholderFields = flattenFields(fields).filter((f) => f.label && f.type !== 'grid');
  const respondentEmailField = emailFields.find((f) => f.id === notifications.respondentEmailFieldId);

  const isRespondent = tab === 'respondent';
  const enabled = isRespondent
    ? notifications.respondentEnabled ?? false
    : notifications.ownerEnabled ?? false;

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

  const sampleAnswers = flattenFields(fields)
    .filter((f) => f.label && f.type !== 'grid')
    .map((f) => ({ label: f.label, value: sampleValue(f) }));

  // The same renderer the backend sends with, so what is previewed here is the
  // markup that actually arrives.
  const previewHtml = isRespondent
    ? renderEmail({
        layout: notifications.respondentLayout,
        formName: formTitle || 'Your form',
        body: fillPlaceholders(
          notifications.respondentBody || 'Thanks — we received your submission and will be in touch soon.',
          fields
        ),
        answers: sampleAnswers,
        cta: notifications.respondentCtaHref
          ? { label: notifications.respondentCtaLabel || 'Continue', href: notifications.respondentCtaHref }
          : undefined,
        accent: theme?.accentColor,
      })
    : renderEmail({
        layout: 'receipt',
        formName: formTitle || 'Your form',
        body: `A new response came in on ${formTitle || 'your form'}.`,
        answers: sampleAnswers,
        accent: theme?.accentColor,
      });

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
        {/* ---- Left: tabs and settings ---- */}
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
            {isRespondent ? (
              <Stack gap="lg">
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

                <div>
                  <Text size="sm" fw={600} mb={4}>
                    Template
                  </Text>
                  <Text size="xs" c="dimmed" mb={10}>
                    How the message is laid out when it lands.
                  </Text>
                  <div className={classes.layoutGrid}>
                    {EMAIL_LAYOUTS.map((option) => {
                      const on = (notifications.respondentLayout ?? 'plain') === option.id;
                      return (
                        <Tooltip key={option.id} label={option.hint} withArrow position="right" multiline w={200}>
                          <UnstyledButton
                            className={classes.layoutOption}
                            data-active={on || undefined}
                            disabled={!notifications.respondentEnabled}
                            onClick={() => onChange({ respondentLayout: option.id as EmailLayout })}
                          >
                            <LayoutThumb id={option.id} accent={theme?.accentColor ?? '#059669'} />
                            <Text size="xs" fw={on ? 600 : 500} className={classes.layoutName}>
                              {option.label}
                            </Text>
                          </UnstyledButton>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                {notifications.respondentLayout === 'nextSteps' && (
                  <>
                    <Divider />
                    <TextInput
                      label="Button label"
                      placeholder="Continue"
                      value={notifications.respondentCtaLabel ?? ''}
                      onChange={(e) => onChange({ respondentCtaLabel: e.target.value })}
                      disabled={!notifications.respondentEnabled}
                    />
                    <TextInput
                      label="Button link"
                      description="Left empty, no button is shown"
                      placeholder="https://example.com/next"
                      value={notifications.respondentCtaHref ?? ''}
                      onChange={(e) => onChange({ respondentCtaHref: e.target.value })}
                      disabled={!notifications.respondentEnabled}
                    />
                  </>
                )}

                <Text size="xs" c="dimmed">
                  Write the message on the right. Use <strong>Field Labels</strong> to drop a
                  respondent's own answer into the text.
                </Text>
              </Stack>
            ) : (
              <Stack gap="lg">
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

                <Text size="xs" c="dimmed">
                  The message lists every answer submitted on the form — only the subject is yours
                  to write.
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

        {/* ---- Right: the composer ---- */}
        <Box className={classes.composerPane}>
          <Group justify="center" mb="md">
            <SegmentedControl
              size="xs"
              value={previewing ? 'preview' : 'write'}
              onChange={(value) => setPreviewing(value === 'preview')}
              data={[
                { value: 'write', label: 'Write' },
                { value: 'preview', label: 'Preview' },
              ]}
            />
          </Group>

          {previewing ? (
            <Box className={classes.previewFrameWrap}>
              {/* An iframe, so the email's own table markup and inline styles
                  render exactly as a mail client would show them, without the
                  app's stylesheet reaching in. */}
              <iframe title="Email preview" className={classes.previewFrame} srcDoc={previewHtml} />
            </Box>
          ) : (
          <Box className={classes.composer} data-disabled={!enabled || undefined}>
            <div className={classes.composerRow}>
              <Text className={classes.composerLabel}>From</Text>
              <Text className={classes.composerValue}>{formTitle || 'Your form'}</Text>
            </div>

            <div className={classes.composerRow}>
              <Text className={classes.composerLabel}>To</Text>
              {isRespondent ? (
                emailFields.length === 0 ? (
                  <Text className={classes.composerValueMuted}>No email field on this form</Text>
                ) : (
                  <Menu shadow="md" position="bottom-start" disabled={!enabled}>
                    <Menu.Target>
                      <UnstyledButton className={classes.toPicker} disabled={!enabled}>
                        {respondentEmailField?.label || 'Choose a field'}
                        <IconChevronDown size={14} />
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {emailFields.map((f) => (
                        <Menu.Item key={f.id} onClick={() => onChange({ respondentEmailFieldId: f.id })}>
                          {f.label || 'Untitled field'}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                )
              ) : (
                <input
                  className={classes.toInput}
                  placeholder="you@example.com, another@example.com"
                  value={(notifications.ownerEmails ?? []).join(', ')}
                  onChange={(e) =>
                    onChange({
                      ownerEmails: e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={!enabled}
                />
              )}
            </div>

            <div className={classes.composerRow}>
              <input
                className={classes.subjectInput}
                placeholder={
                  isRespondent
                    ? 'Thanks for your submission'
                    : `New submission: ${formTitle || 'Untitled form'}`
                }
                value={(isRespondent ? notifications.respondentSubject : notifications.ownerSubject) ?? ''}
                onChange={(e) =>
                  onChange(
                    isRespondent
                      ? { respondentSubject: e.target.value }
                      : { ownerSubject: e.target.value }
                  )
                }
                disabled={!enabled}
              />
            </div>

            {isRespondent ? (
              <>
                <div className={classes.composerToolbar}>
                  <Menu shadow="md" position="bottom-start" disabled={!enabled}>
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        size="xs"
                        color="gray"
                        rightSection={<IconChevronDown size={13} />}
                        disabled={!enabled || placeholderFields.length === 0}
                      >
                        Field Labels
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {placeholderFields.map((f) => (
                        <Menu.Item
                          key={f.id}
                          leftSection={<IconPlus size={13} />}
                          onClick={() => insertPlaceholder(f.label)}
                        >
                          {f.label || 'Untitled field'}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </div>

                <textarea
                  ref={bodyRef}
                  className={classes.bodyInput}
                  placeholder="Thanks — we received your submission and will be in touch soon."
                  value={notifications.respondentBody ?? ''}
                  onChange={(e) => onChange({ respondentBody: e.target.value })}
                  disabled={!enabled}
                />
              </>
            ) : (
              <Box className={classes.ownerBody}>
                <Text size="xs" c="dimmed" mb={10}>
                  The body is built for you — every answer, as it was submitted:
                </Text>
                {sampleAnswers.length === 0 ? (
                  <Text size="sm" c="dimmed" fs="italic">
                    Add fields to the form and they will be listed here.
                  </Text>
                ) : (
                  <div className={classes.answerList}>
                    {sampleAnswers.map((a) => (
                      <div key={a.label} className={classes.answerRow}>
                        <Text size="xs" c="dimmed">
                          {a.label}
                        </Text>
                        <Text size="sm">{a.value}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </Box>
            )}
          </Box>
          )}
        </Box>
      </Group>
    </Modal>
  );
}
