import { useRef, useState } from 'react';
import { Modal, Group, Box, Text, Button, ActionIcon, Divider, Switch, Menu, UnstyledButton } from '@mantine/core';
import { IconX, IconMail, IconBellRinging, IconChevronDown, IconPlus } from '@tabler/icons-react';
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

export function NotificationsModal({ opened, onClose, formTitle, fields, notifications, onChange }: Props) {
  const [tab, setTab] = useState<TabId>('respondent');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const emailFields = flattenFields(fields).filter((f) => f.type === 'email');
  const placeholderFields = flattenFields(fields).filter((f) => f.label && f.type !== 'grid');
  const respondentEmailField = emailFields.find((f) => f.id === notifications.respondentEmailFieldId);

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
      <Box className={classes.shell}>
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
          <Box className={classes.composerWrap}>
            {tab === 'respondent' && (
              <>
                <Group justify="space-between" align="center" wrap="nowrap" mb="md">
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

                {emailFields.length === 0 && (
                  <Text size="sm" c="red" mb="md">
                    Add an Email field to this form to send a confirmation — there's nothing to send
                    it to yet.
                  </Text>
                )}

                <Box className={classes.composer} data-disabled={!notifications.respondentEnabled || undefined}>
                  <div className={classes.composerRow}>
                    <Text className={classes.composerLabel}>From</Text>
                    <Text className={classes.composerValue}>{formTitle || 'Your form'}</Text>
                  </div>

                  <div className={classes.composerRow}>
                    <Text className={classes.composerLabel}>To</Text>
                    {emailFields.length === 0 ? (
                      <Text className={classes.composerValueMuted}>No email field on this form</Text>
                    ) : (
                      <Menu shadow="md" position="bottom-start" disabled={!notifications.respondentEnabled}>
                        <Menu.Target>
                          <UnstyledButton className={classes.toPicker} disabled={!notifications.respondentEnabled}>
                            <span className={classes.toChip}>
                              {respondentEmailField?.label || 'Choose a field'}
                            </span>
                            <IconChevronDown size={14} />
                          </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {emailFields.map((f) => (
                            <Menu.Item
                              key={f.id}
                              onClick={() => onChange({ respondentEmailFieldId: f.id })}
                            >
                              {f.label || 'Untitled field'}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </div>

                  <div className={`${classes.composerRow} ${classes.composerRowNoBorder}`}>
                    <input
                      className={classes.subjectInput}
                      placeholder="Enter subject"
                      value={notifications.respondentSubject ?? ''}
                      onChange={(e) => onChange({ respondentSubject: e.target.value })}
                      disabled={!notifications.respondentEnabled}
                    />
                  </div>

                  <div className={classes.composerToolbar}>
                    <Menu shadow="md" position="bottom-end" disabled={!notifications.respondentEnabled}>
                      <Menu.Target>
                        <Button
                          variant="subtle"
                          size="xs"
                          color="gray"
                          rightSection={<IconChevronDown size={13} />}
                          disabled={!notifications.respondentEnabled || placeholderFields.length === 0}
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
                    disabled={!notifications.respondentEnabled}
                    rows={14}
                  />
                </Box>
              </>
            )}

            {tab === 'owner' && (
              <>
                <Group justify="space-between" align="center" wrap="nowrap" mb="md">
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

                <Box className={classes.composer} data-disabled={!notifications.ownerEnabled || undefined}>
                  <div className={classes.composerRow}>
                    <Text className={classes.composerLabel}>From</Text>
                    <Text className={classes.composerValue}>{formTitle || 'Your form'}</Text>
                  </div>

                  <div className={classes.composerRow}>
                    <Text className={classes.composerLabel}>To</Text>
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
                      disabled={!notifications.ownerEnabled}
                    />
                  </div>

                  <div className={`${classes.composerRow} ${classes.composerRowNoBorder}`}>
                    <input
                      className={classes.subjectInput}
                      placeholder={`New submission: ${formTitle || 'Untitled form'}`}
                      value={notifications.ownerSubject ?? ''}
                      onChange={(e) => onChange({ ownerSubject: e.target.value })}
                      disabled={!notifications.ownerEnabled}
                    />
                  </div>

                  <Text size="xs" c="dimmed" className={classes.ownerBodyNote}>
                    The message lists every answer submitted on the form — there's no separate body
                    to write.
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Group justify="flex-end" px={20} py="md" wrap="nowrap" className={classes.actionBar}>
          <Button variant="default" onClick={onClose}>
            Done
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
