import { Button, Group, Modal, Text } from '@mantine/core';

/** `count > 1` switches the copy to the bulk-delete wording — same modal for
 *  deleting one response (from the row actions) and many (from the selection
 *  bar), so there's one confirm flow to get right instead of two. */
export function DeleteResponseModal({
  opened,
  deleting,
  count = 1,
  onClose,
  onConfirm,
}: {
  opened: boolean;
  deleting: boolean;
  count?: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isBulk = count > 1;
  return (
    <Modal opened={opened} onClose={onClose} title={isBulk ? `Delete ${count} responses` : 'Delete response'} centered radius="lg">
      <Text size="sm">
        {isBulk
          ? `${count} responses will be permanently removed. This can't be undone.`
          : "This response will be permanently removed. This can't be undone."}
      </Text>
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
