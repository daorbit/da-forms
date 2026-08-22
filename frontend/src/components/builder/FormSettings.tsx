import { Stack, Textarea, Text, Divider } from '@mantine/core';

interface Props {
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function FormSettings({ description, onDescriptionChange }: Props) {
  return (
    <Stack gap="md" p="md">
      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
        Form properties
      </Text>

      <Divider />

      <Textarea
        label="Description"
        description="Shown under the form title"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        autosize
        minRows={3}
      />

      <Text size="xs" c="dimmed">
        Select a field on the canvas to edit its properties.
      </Text>
    </Stack>
  );
}
