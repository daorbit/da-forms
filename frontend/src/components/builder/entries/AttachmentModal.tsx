import { Box, Button, Group, Image, Modal, Stack } from '@mantine/core';
import { IconDownload, IconExternalLink } from '@tabler/icons-react';
import classes from '../../../pages/EntriesPage.module.css';

export type AttachmentState = { url: string; name: string; image: boolean } | null;

export function AttachmentModal({ attachment, onClose }: { attachment: AttachmentState; onClose: () => void }) {
  return (
    <Modal
      opened={!!attachment}
      onClose={onClose}
      title={attachment?.name ?? 'Attachment'}
      size="xl"
      centered
      radius="lg"
      classNames={{ content: classes.attachmentModal, body: classes.attachmentBody }}
    >
      {attachment && (
        <Stack gap="md">
          <Box className={classes.attachmentPreview}>
            {attachment.image ? (
              <Image src={attachment.url} alt={attachment.name} fit="contain" mah="65vh" maw="100%" />
            ) : (
              <iframe src={attachment.url} title={attachment.name} className={classes.attachmentFrame} />
            )}
          </Box>
          <Group justify="flex-end" gap="sm">
            <Button component="a" href={attachment.url} target="_blank" rel="noopener noreferrer" variant="default" leftSection={<IconExternalLink size={16} />}>
              Open in new tab
            </Button>
            <Button component="a" href={attachment.url} download={attachment.name} color="emerald" leftSection={<IconDownload size={16} />}>
              Download
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
