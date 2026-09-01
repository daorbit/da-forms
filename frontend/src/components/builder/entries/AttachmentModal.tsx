import { Box, Button, Group, Image, Modal, Stack, Text } from '@mantine/core';
import { IconDownload, IconExternalLink } from '@tabler/icons-react';
import { FileTypeIcon } from './fileTypeIcon';
import classes from '../../../pages/EntriesPage.module.css';

export type AttachmentState = { url: string; name: string; image: boolean } | null;

function isPdf(name: string): boolean {
  return /\.pdf$/i.test(name);
}

// Word/Excel/PowerPoint have no native browser renderer, unlike a PDF.
// Microsoft's Office Online Viewer renders these itself off a public URL —
// which the Cloudinary URL already is. Google Docs Viewer was tried first but
// its xlsx support is unreliable ("Could not preview the file"); Office
// Online is Microsoft's own format, so it renders its own files correctly.
// Not used for pdf (has its own direct iframe above) or anything neither
// viewer handles (zip, txt).
const OFFICE_EXTENSIONS = /\.(?:docx?|xlsx?|pptx?|rtf|odt|ods|odp)$/i;

function officePreviewUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
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
              // A browser renders a PDF natively, so it goes straight into
              // the iframe with no viewer service in between.
              <iframe src={attachment.url} title={attachment.name} className={classes.attachmentFrame} />
            ) : OFFICE_EXTENSIONS.test(attachment.name) ? (
              // No native renderer for these, so Google Docs Viewer does the
              // rendering and this just iframes its output.
              <iframe src={officePreviewUrl(attachment.url)} title={attachment.name} className={classes.attachmentFrame} />
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
