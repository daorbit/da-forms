import type { ReactNode } from 'react';
import { Modal } from '@mantine/core';
import classes from './Studio.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function StudioModal({ opened, onClose, children }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 160 }}
      classNames={{ content: classes.content, inner: classes.inner, body: classes.modalBody }}
    >
      {children}
    </Modal>
  );
}

export { classes as studioClasses };
