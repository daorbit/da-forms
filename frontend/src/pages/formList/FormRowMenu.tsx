import { Link } from 'react-router-dom';
import { ActionIcon, Menu } from '@mantine/core';
import {
  ClipboardCopyIcon,
  CloudUploadIcon,
  CopyIcon,
  CopyPlusIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  InboxIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { publicFormPath, publicFormUrl } from '@/lib/api';
import { notify } from '@/lib/notify';
import type { Form } from '@/types';
import type { FormRowActions } from './FormRow';
import classes from './FormRow.module.css';

interface Props {
  form: Form;
  basePath: string;
  compact: boolean;
  busy: { duplicating: boolean; copyingConfig: boolean };
  actions: FormRowActions;
}

export function FormRowMenu({ form, basePath, compact, busy, actions }: Props) {
  const live = form.status === 'published';

  return (
    <Menu position="bottom-end" width={210}>
      <Menu.Target>
        <ActionIcon variant="subtle" size={28} radius="md" className={classes.iconAction} aria-label="More actions">
          <EllipsisIcon size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {compact && (
          <>
            <Menu.Item component={Link} to={`${basePath}/edit`} leftSection={<PencilIcon size={15} />}>
              Edit
            </Menu.Item>
            <Menu.Item component={Link} to={`${basePath}/entries`} leftSection={<InboxIcon size={15} />}>
              Responses
            </Menu.Item>
            <Menu.Item leftSection={<EyeIcon size={15} />} onClick={() => actions.onPreview(form)}>
              Preview
            </Menu.Item>
            <Menu.Item leftSection={<Share2Icon size={15} />} onClick={() => actions.onShare(form)}>
              Share
            </Menu.Item>
            <Menu.Divider />
          </>
        )}
        <Menu.Item
          leftSection={live ? <EyeOffIcon size={15} /> : <CloudUploadIcon size={15} />}
          onClick={() => actions.onToggleStatus(form)}
        >
          {live ? 'Unpublish' : 'Publish'}
        </Menu.Item>
        <Menu.Item
          component="a"
          href={publicFormPath(form._id)}
          target="_blank"
          leftSection={<ExternalLinkIcon size={15} />}
        >
          Open live form
        </Menu.Item>
        <Menu.Item
          leftSection={<CopyIcon size={15} />}
          onClick={() => {
            navigator.clipboard.writeText(publicFormUrl(form._id));
            notify.success('Link copied');
          }}
        >
          Copy link
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<CopyPlusIcon size={15} />}
          disabled={busy.duplicating}
          onClick={() => actions.onDuplicate(form)}
        >
          Duplicate
        </Menu.Item>
        <Menu.Item
          leftSection={<ClipboardCopyIcon size={15} />}
          disabled={busy.copyingConfig}
          onClick={() => actions.onCopyConfig(form)}
        >
          Copy config
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<Trash2Icon size={15} />} onClick={() => actions.onDelete(form)}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
