import { Box, Button, Group, Image, Modal, Stack, Text } from '@mantine/core';
import { IconDownload, IconExternalLink } from '@tabler/icons-react';
import { FileTypeIcon } from './fileTypeIcon';
import classes from '../../../pages/EntriesPage.module.css';

export type AttachmentState = { url: string; name: string; image: boolean } | null;

function isPdf(name: string): boolean {
  return /\.pdf$/i.test(name);
}

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
            ) : isPdf(attachment.name) ? (
              // Only a real PDF gets the iframe — a browser can render that
              // natively. Word/Excel/etc have no in-browser renderer, so
              // iframing them showed a blank or broken frame; those get a
              // plain "here's the file" tile with Open/Download instead.
              <iframe src={attachment.url} title={attachment.name} className={classes.attachmentFrame} />
            ) : (
              <Stack align="center" gap="xs" py="xl">
                <FileTypeIcon fileName={attachment.name} size={64} />
                <Text size="sm" c="dimmed">
                  Preview isn't available for this file type — open or download it instead.
                </Text>
              </Stack>
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
