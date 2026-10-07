import { Modal, Text } from '@mantine/core';
import { KeyboardIcon } from 'lucide-react';
import { SHORTCUT_GROUPS } from '@/lib/builderShortcuts';
import classes from './ShortcutsModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ opened, onClose }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={520}
      title={
        <span className={classes.title}>
          <KeyboardIcon size={18} />
          Keyboard shortcuts
        </span>
      }
    >
      <div className={classes.groups}>
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" className={classes.groupTitle}>
              {group.title}
            </Text>
            {group.items.map((item) => (
              <div key={`${item.label}-${item.keys.join('+')}`} className={classes.row}>
                <span>{item.label}</span>
                <span className={classes.keys}>
                  {item.keys.map((k) => (
                    <kbd key={k} className={classes.kbd}>
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Modal>
  );
}
