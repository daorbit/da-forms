import { Drawer, Stack, Textarea, TextInput, Text, CopyButton, Button, Group, Alert } from '@mantine/core';
import { IconCopy, IconCheck, IconInfoCircle } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  formId: string | null;
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Button
              size="compact-xs"
              variant="light"
              color={copied ? 'teal' : 'blue'}
              leftSection={copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
              onClick={copy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
      </Group>
      <Textarea readOnly value={value} autosize minRows={2} onFocus={(e) => e.target.select()} />
    </div>
  );
}

export function EmbedDrawer({ opened, onClose, formId }: Props) {
  const shareUrl = formId ? `${window.location.origin}/f/${formId}` : '';
  const iframeCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" style="border:0"></iframe>`;

  return (
    <Drawer opened={opened} onClose={onClose} position="right" size={560} title="Embed Form" padding="lg">
      {formId ? (
        <Stack gap="lg">
          <div>
            <Text size="sm" fw={500} mb={6}>
              Share link
            </Text>
            <TextInput readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
            <Text size="xs" c="dimmed" mt={4}>
              Send this link directly to respondents.
            </Text>
          </div>

          <CopyBlock label="iframe embed" value={iframeCode} />

          <Text size="xs" c="dimmed">
            Paste the iframe into any page on your site. Adjust width and height to fit your layout.
          </Text>
        </Stack>
      ) : (
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          Save the form first — the embed code and share link are generated once the form exists.
        </Alert>
      )}
    </Drawer>
  );
}
