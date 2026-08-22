import { Drawer, Stack, TextInput, Textarea } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function FormSettings({
  opened,
  onClose,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: Props) {
  return (
    <Drawer opened={opened} onClose={onClose} position="right" size={520} title="Form Properties" padding="lg">
      <Stack gap="md">
        <TextInput label="Title" value={title} onChange={(e) => onTitleChange(e.target.value)} />
        <Textarea
          label="Description"
          description="Shown under the form title"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          autosize
          minRows={3}
        />
      </Stack>
    </Drawer>
  );
}
