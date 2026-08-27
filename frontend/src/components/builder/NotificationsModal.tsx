import { Modal, Stack, Switch, TextInput, Textarea, Select, Divider, Text, TagsInput } from '@mantine/core';
import type { FormField, NotificationSettings } from '@/types';

interface Props {
  opened: boolean;
  onClose: () => void;
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

export function NotificationsModal({ opened, onClose, fields, notifications, onChange }: Props) {
  const emailFields = flattenFields(fields).filter((f) => f.type === 'email');
  const placeholderFields = flattenFields(fields).filter((f) => f.label && f.type !== 'grid');

  return (
    <Modal opened={opened} onClose={onClose} title="Email Notifications" centered size={520} radius="lg">
      <Stack gap="md">
        <Switch
          label="Email the respondent"
          description="Sends a confirmation to whoever fills out this form"
          checked={notifications.respondentEnabled ?? false}
          onChange={(e) => onChange({ respondentEnabled: e.currentTarget.checked })}
        />

        {notifications.respondentEnabled && (
          <>
            {emailFields.length === 0 ? (
              <Text size="sm" c="red">
                Add an Email field to this form to send a confirmation — there's nothing to send it
                to yet.
              </Text>
            ) : (
              <Select
                label="Send to"
                description="Which field holds the respondent's address"
                data={emailFields.map((f) => ({ value: f.id, label: f.label || 'Untitled field' }))}
                value={notifications.respondentEmailFieldId ?? null}
                onChange={(value) => onChange({ respondentEmailFieldId: value ?? undefined })}
              />
            )}

            <TextInput
              label="Subject"
              placeholder="Thanks for your submission"
              value={notifications.respondentSubject ?? ''}
              onChange={(e) => onChange({ respondentSubject: e.target.value })}
            />

            <Textarea
              label="Message"
              placeholder="Thanks — we received your submission and will be in touch soon."
              value={notifications.respondentBody ?? ''}
              onChange={(e) => onChange({ respondentBody: e.target.value })}
              autosize
              minRows={4}
            />

            {placeholderFields.length > 0 && (
              <Text size="xs" c="dimmed">
                Insert an answer with{' '}
                {placeholderFields.map((f, i) => (
                  <span key={f.id}>
                    {i > 0 && ', '}
                    <code>{`{{field:${f.id}}}`}</code> ({f.label})
                  </span>
                ))}
                .
              </Text>
            )}
          </>
        )}

        <Divider />

        <Switch
          label="Notify me"
          description="Alerts your own inbox on every new submission"
          checked={notifications.ownerEnabled ?? false}
          onChange={(e) => onChange({ ownerEnabled: e.currentTarget.checked })}
        />

        {notifications.ownerEnabled && (
          <>
            <TagsInput
              label="Send to"
              description="Press enter after each address"
              placeholder="you@example.com"
              value={notifications.ownerEmails ?? []}
              onChange={(value) => onChange({ ownerEmails: value })}
            />
            <TextInput
              label="Subject"
              placeholder="New submission"
              value={notifications.ownerSubject ?? ''}
              onChange={(e) => onChange({ ownerSubject: e.target.value })}
            />
          </>
        )}
      </Stack>
    </Modal>
  );
}
