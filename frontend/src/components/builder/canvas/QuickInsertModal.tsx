import { Modal } from '@mantine/core';
import type { PaletteItem } from '@/lib/fieldPalette';
import { QuickInsertMenu } from './QuickInsertMenu';

interface Props {
  opened: boolean;
  onClose: () => void;
  onPick: (item: PaletteItem) => void;
}

export function QuickInsertModal({ opened, onClose, onPick }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      size={420}
      yOffset="18vh"
      centered={false}
      radius={16}
    >
      <QuickInsertMenu
        onClose={onClose}
        onPick={(item) => {
          onClose();
          onPick(item);
        }}
      />
    </Modal>
  );
}
