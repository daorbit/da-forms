import { Button, CopyButton, Group, Modal, Text } from '@mantine/core';
import { CheckIcon, GlobeIcon, Share2Icon } from 'lucide-react';
import { publicFormUrl } from '@/lib/api';
import type { Form } from '@/types';
import { LinkRow } from './LinkRow';
import classes from './PublishedDialog.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  form: Form;
  onShare: () => void;
}

export function PublishedDialog({ opened, onClose, form, onShare }: Props) {
  const liveUrl = publicFormUrl(form._id);
  const previewUrl = `${liveUrl}?preview=1`;

  return (
    <Modal opened={opened} onClose={onClose} size={500} withCloseButton={false} padding={0}>
      <div className={classes.hero}>
        <span className={classes.badge}>
          <CheckIcon size={26} strokeWidth={2.6} />
        </span>
        <Text fw={700} size="xl" mt="md">
          Your form is live
        </Text>
        <Text size="sm" c="dimmed" mt={4} lineClamp={1}>
          {form.name || form.title} is now accepting responses.
        </Text>
      </div>

      <div className={classes.links}>
        <LinkRow
          icon={<GlobeIcon size={16} />}
          label="Form link"
          hint="Share it with respondents. Opening it from here is a preview and is not counted."
          url={liveUrl}
          openUrl={previewUrl}
        />
      </div>

      <Group justify="space-between" className={classes.footer} wrap="nowrap">
        <Button
          variant="default"
          radius="xl"
          leftSection={<Share2Icon size={15} />}
          onClick={() => {
            onClose();
            onShare();
          }}
        >
          Share & embed
        </Button>
        <Group gap="xs" wrap="nowrap">
          <CopyButton value={liveUrl}>
            {({ copied, copy }) => (
              <Button variant="light" radius="xl" onClick={copy}>
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            )}
          </CopyButton>
          <Button radius="xl" onClick={onClose}>
            Done
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
