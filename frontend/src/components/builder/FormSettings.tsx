import { Drawer, Stack, TextInput, Textarea, Switch, Divider, Text, SegmentedControl } from '@mantine/core';
import type { SubmitButtonAlign } from '@/types';
import classes from './drawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description: string;
  hideHeader: boolean;
  headerAlign: SubmitButtonAlign;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onHideHeaderChange: (value: boolean) => void;
  onHeaderAlignChange: (value: SubmitButtonAlign) => void;
}

export function FormSettings({
  opened,
  onClose,
  title,
  description,
  hideHeader,
  headerAlign,
  onTitleChange,
  onDescriptionChange,
  onHideHeaderChange,
  onHeaderAlignChange,
}: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Form Properties"
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

        <div>
          <Text size="sm" fw={500} mb={8}>
            Header text alignment
          </Text>
          <SegmentedControl
            fullWidth
            value={headerAlign}
            onChange={(value) => onHeaderAlignChange(value as SubmitButtonAlign)}
            data={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </div>

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
