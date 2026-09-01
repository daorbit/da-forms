import { Button, Group, Modal, Text } from '@mantine/core';

export function DeleteResponseModal({
  opened,
  deleting,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete response" centered radius="lg">
      <Text size="sm">This response will be permanently removed. This can't be undone.</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" loading={deleting} onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
