import { Drawer, Stack, Textarea, TextInput, Text, Divider } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  thankYouMessage: string;
  redirectUrl: string;
  onThankYouChange: (value: string) => void;
  onRedirectChange: (value: string) => void;
}

export function ThankYouDrawer({
  opened,
  onClose,
  thankYouMessage,
  redirectUrl,
  onThankYouChange,
  onRedirectChange,
}: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={520}
      title="Thank You Page & Redirection"
      padding="lg"
    >
      <Stack gap="md">
        <Textarea
          label="Thank you message"
          description="Shown after a successful submission"
          value={thankYouMessage}
          onChange={(e) => onThankYouChange(e.target.value)}
          autosize
          minRows={4}
        />

        <Divider />

        <TextInput
          label="Redirect URL"
          description="Leave empty to show the thank you message instead"
          placeholder="https://example.com/thanks"
          value={redirectUrl}
          onChange={(e) => onRedirectChange(e.target.value)}
        />

        <Text size="xs" c="dimmed">
          When a redirect URL is set, respondents are sent there right after submitting.
        </Text>
      </Stack>
    </Drawer>
  );
}
