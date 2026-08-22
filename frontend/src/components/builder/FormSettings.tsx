import { Drawer, Stack, TextInput, Textarea, Switch, Divider } from '@mantine/core';
import classes from './drawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description: string;
  hideHeader: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onHideHeaderChange: (value: boolean) => void;
}

export function FormSettings({
  opened,
  onClose,
  title,
  description,
  hideHeader,
  onTitleChange,
  onDescriptionChange,
  onHideHeaderChange,
}: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Form Properties"
      padding="lg"
      classNames={classes}
    >
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

        <Divider />

        <Switch
          label="Hide header on the form"
          description="The title and description stay for your reference but are not shown to respondents."
          checked={hideHeader}
          onChange={(e) => onHideHeaderChange(e.target.checked)}
        />
      </Stack>
    </Drawer>
  );
}
