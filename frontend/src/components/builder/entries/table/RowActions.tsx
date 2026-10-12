import { ActionIcon, Menu } from '@mantine/core';
import { EllipsisIcon, EyeIcon, FileDownIcon, MailCheckIcon, MailIcon, Trash2Icon } from 'lucide-react';
import type { Submission } from '@/types';
import classes from './EntryRow.module.css';

interface Props {
  submission: Submission;
  onView: () => void;
  onPdf: () => void;
  onToggleRead?: () => void;
  onDelete: () => void;
}

export function RowActions({ submission, onView, onPdf, onToggleRead, onDelete }: Props) {
  return (
    <Menu position="bottom-end" width={200} radius="md" shadow="md" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size={30} radius="md" className={classes.more} aria-label="Response actions">
          <EllipsisIcon size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<EyeIcon size={15} />} onClick={onView}>
          Open response
        </Menu.Item>
        {onToggleRead && (
          <Menu.Item
            leftSection={submission.read ? <MailIcon size={15} /> : <MailCheckIcon size={15} />}
            onClick={onToggleRead}
          >
            Mark as {submission.read ? 'unread' : 'read'}
          </Menu.Item>
        )}
        <Menu.Item leftSection={<FileDownIcon size={15} />} onClick={onPdf}>
          Download PDF
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<Trash2Icon size={15} />} onClick={onDelete}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
