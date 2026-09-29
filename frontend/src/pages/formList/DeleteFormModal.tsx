import { Button, Group, Modal, Text } from '@mantine/core';
import type { Form } from '@/types';

interface Props {
  form: Form | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteFormModal({ form, deleting, onCancel, onConfirm }: Props) {
  return (
    <Modal opened={!!form} onClose={onCancel} title="Delete form">
      <Text size="sm" c="dimmed">
        Delete <strong>{form?.name || form?.title}</strong>? Its submissions stay in the database but the form and its
        public link stop working.
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="red" loading={deleting} onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
