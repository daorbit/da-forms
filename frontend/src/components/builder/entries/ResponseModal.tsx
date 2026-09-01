import { ActionIcon, Anchor, Button, Group, Image, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { IconTrash, IconMailOpened } from '@tabler/icons-react';
import type { Form, FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { FileTypeIcon } from './fileTypeIcon';
import { FileSizeBadge } from './FileSizeBadge';
import { formatDateTime, isImageUrl } from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';

export function ResponseModal({
  form,
  columns,
  viewing,
  onClose,
  onMarkRead,
  onDelete,
  onOpenAttachment,
}: {
  form: Form | null;
  columns: FormField[];
  viewing: Submission | null;
  onClose: () => void;
  onMarkRead: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  onOpenAttachment: (attachment: { url: string; name: string; image: boolean }) => void;
}) {
  return (
    <Modal
      opened={!!viewing}
      onClose={onClose}
      title="Response"
      size="lg"
      centered
      radius="lg"
      classNames={{ content: classes.responseModal, body: classes.responseBody }}
    >
      {viewing && (
        <Stack gap="md">
          <Group justify="space-between" className={classes.responseMeta}>
            <Text size="sm" c="dimmed">
              {viewing.read ? 'Read response' : 'Unread response'}
            </Text>
            <Group gap="xs">
              <Tooltip label={viewing.read ? 'Already read' : 'Mark as read'} withArrow>
                <ActionIcon
                  variant="light"
                  color="emerald"
                  disabled={viewing.read}
                  aria-label={viewing.read ? 'Response already read' : 'Mark response as read'}
                  onClick={() => onMarkRead(viewing)}
                >
                  <IconMailOpened size={17} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete response" withArrow>
                <ActionIcon variant="light" color="red" aria-label="Delete response" onClick={() => onDelete(viewing)}>
                  <IconTrash size={17} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <div className={classes.responseGrid}>
            {columns.map((field) => {
              // A payment is not an answer — it lives on the submission
              // itself, written by the webhook. Matches the table's PaymentCell.
              if (field.type === 'payment') {
                return (
                  <div key={field.id} className={classes.responseField}>
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                      {field.label}
                    </Text>
                    <PaymentCell payment={viewing.payment} />
                  </div>
                );
              }
              const raw = viewing.data[field.id] ?? '';
              const isFileLink = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);
              const isImage = isFileLink && (field.type === 'imageUpload' || field.type === 'signature' || isImageUrl(raw));
              const fileName = raw.split('/').pop() || 'Attachment';
              const bytes = viewing.fileMeta?.[field.id]?.bytes;
              return (
                <div key={field.id} className={`${classes.responseField} ${isImage ? classes.mediaField : ''}`}>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                    {field.label}
                  </Text>
                  {isImage ? (
                    <Stack gap={4} align="flex-start">
                      <Anchor
                        href={raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenAttachment({ url: raw, name: fileName, image: true });
                        }}
                      >
                        <Image src={raw} alt={fileName} mah={220} w="auto" fit="contain" radius="sm" />
                      </Anchor>
                      <FileSizeBadge bytes={bytes} url={raw} />
                    </Stack>
                  ) : isFileLink ? (
                    <Anchor
                      href={raw}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="never"
                      c="inherit"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenAttachment({ url: raw, name: fileName, image: false });
                      }}
                    >
                      <Group gap={6} wrap="nowrap">
                        <FileTypeIcon fileName={fileName} size={26} previewable />
                        <Stack gap={0}>
                          <Text size="sm">{fileName}</Text>
                          <FileSizeBadge bytes={bytes} url={raw} />
                        </Stack>
                      </Group>
                    </Anchor>
                  ) : (
                    <Text size="sm">{raw || '—'}</Text>
                  )}
                </div>
              );
            })}
            <div className={classes.responseField}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                Added Time
              </Text>
              <Text size="sm">{formatDateTime(viewing.createdAt)}</Text>
            </div>
          </div>

          <Group justify="flex-end" className={classes.responseFooter}>
            <Button
              variant="default"
              leftSection={<FileTypeIcon fileName="response.pdf" size={16} />}
              onClick={() => downloadSubmissionPdf(form?.title ?? '', columns, viewing)}
            >
              Download PDF
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
