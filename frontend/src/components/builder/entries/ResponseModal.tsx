import { useEffect } from 'react';
import { ActionIcon, Anchor, Button, Drawer, Group, Image, Paper, Stack, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash, IconMail, IconMailOpened, IconChevronUp, IconChevronDown, IconX, IconWorld } from '@tabler/icons-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { relativeTime } from '@/lib/relativeTime';
import type { Form, FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { repeaterDisplayRows } from '@/lib/repeater';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { FileTypeIcon } from './fileTypeIcon';
import { FileSizeBadge } from './FileSizeBadge';
import { answerText, formatAnswer, formatDateTime, isImageUrl } from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';

export function ResponseModal({
  form,
  columns,
  viewing,
  submissions = [],
  onNavigate,
  onClose,
  onMarkRead,
  onToggleRead,
  onDelete,
  onOpenAttachment,
}: {
  form: Form | null;
  columns: FormField[];
  viewing: Submission | null;
  /** The responses on screen, for stepping to the previous / next one. */
  submissions?: Submission[];
  onNavigate?: (submission: Submission) => void;
  onClose: () => void;
  onMarkRead: (submission: Submission) => void;
  /** Flips read / unread. Falls back to mark-read only when absent. */
  onToggleRead?: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  onOpenAttachment: (attachment: { url: string; name: string; image: boolean }) => void;
}) {
  const index = viewing ? submissions.findIndex((s) => s._id === viewing._id) : -1;
  const prev = index > 0 ? submissions[index - 1] : null;
  const next = index >= 0 && index < submissions.length - 1 ? submissions[index + 1] : null;

  // Arrow keys step through responses while the panel is open.
  useEffect(() => {
    if (!viewing || !onNavigate) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if ((e.key === 'ArrowUp' || e.key === 'k') && prev) onNavigate(prev);
      if ((e.key === 'ArrowDown' || e.key === 'j') && next) onNavigate(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewing, prev, next, onNavigate]);

  return (
    <Drawer
      opened={!!viewing}
      onClose={onClose}
      position="right"
      size={560}
      withCloseButton={false}
      padding={0}
      overlayProps={{ backgroundOpacity: 0.45, blur: 1 }}
      classNames={{ body: classes.drawerBody }}
    >
      {viewing && (
        <div className={classes.drawer}>
          <div className={classes.drawerHead}>
            <div style={{ minWidth: 0 }}>
              <Group gap={8} wrap="nowrap">
                <Text fw={700} size="lg">
                  Response
                </Text>
                {index >= 0 && submissions.length > 1 && (
                  <Text size="sm" c="dimmed">
                    {index + 1} of {submissions.length}
                  </Text>
                )}
              </Group>
              <Group gap={8} mt={4} wrap="nowrap">
                <StatusPill tone={viewing.read ? 'idle' : 'live'} label={viewing.read ? 'Read' : 'New'} />
                <Tooltip label={formatDateTime(viewing.createdAt)} withArrow>
                  <Text size="xs" c="dimmed" span>
                    Submitted {relativeTime(viewing.createdAt)}
                  </Text>
                </Tooltip>
              </Group>
            </div>
            <Group gap={4} wrap="nowrap">
              {onNavigate && (
                <>
                  <Tooltip label="Previous (↑)" withArrow>
                    <ActionIcon variant="default" size="lg" disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label="Previous response">
                      <IconChevronUp size={17} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Next (↓)" withArrow>
                    <ActionIcon variant="default" size="lg" disabled={!next} onClick={() => next && onNavigate(next)} aria-label="Next response">
                      <IconChevronDown size={17} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
              <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
                <IconX size={18} />
              </ActionIcon>
            </Group>
          </div>

          {viewing.sourceUrl && (
            <div className={classes.drawerSource}>
              <IconWorld size={13} />
              <Text size="xs" c="dimmed" truncate>
                {viewing.sourceUrl}
              </Text>
            </div>
          )}

          <div className={classes.drawerScroll}>
          <div className={classes.responseList}>
            {columns.map((field) => {
              // A payment is not an answer — it lives on the submission
              // itself, written by the webhook. Matches the table's PaymentCell.
              if (field.type === 'payment') {
                return (
                  <div key={field.id} className={classes.responseField}>
                    <Text size="xs" fw={600} c="dimmed" mb={4}>
                      {field.label}
                    </Text>
                    <PaymentCell payment={viewing.payment} />
                  </div>
                );
              }
              if (field.type === 'repeater') {
                const rows = repeaterDisplayRows(field, answerText(viewing.data[field.id]));
                const subFields = field.subFields ?? [];
                return (
                  <div key={field.id} className={classes.responseField} style={{ gridColumn: '1 / -1' }}>
                    <Text size="xs" fw={600} c="dimmed" mb={4}>
                      {field.label}
                    </Text>
                    {rows.length === 0 ? (
                      <Text size="sm">—</Text>
                    ) : (
                      <Paper withBorder radius="sm">
                        <Table striped withColumnBorders>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th style={{ width: 32 }}>#</Table.Th>
                              {subFields.map((sf) => (
                                <Table.Th key={sf.id}>{sf.label}</Table.Th>
                              ))}
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {rows.map((row, i) => (
                              <Table.Tr key={i}>
                                <Table.Td>{i + 1}</Table.Td>
                                {row.cells.map((cell, j) => (
                                  <Table.Td key={j}>{cell.value || '—'}</Table.Td>
                                ))}
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Paper>
                    )}
                  </div>
                );
              }
              const raw = answerText(viewing.data[field.id]);
              const isFileLink = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);
              const isImage = isFileLink && (field.type === 'imageUpload' || field.type === 'signature' || isImageUrl(raw));
              const fileName = raw.split('/').pop() || 'Attachment';
              const bytes = viewing.fileMeta?.[field.id]?.bytes;
              return (
                <div key={field.id} className={`${classes.responseField} ${isImage ? classes.mediaField : ''}`}>
                  <Text size="xs" fw={600} c="dimmed" mb={4}>
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
                    <Text size="sm">{raw ? formatAnswer(field.type, raw) : '—'}</Text>
                  )}
                </div>
              );
            })}
          </div>

          </div>

          <div className={classes.drawerFoot}>
            <Button
              variant="default"
              leftSection={viewing.read ? <IconMail size={16} /> : <IconMailOpened size={16} />}
              onClick={() => (onToggleRead ? onToggleRead(viewing) : onMarkRead(viewing))}
              disabled={!onToggleRead && viewing.read}
            >
              {viewing.read ? 'Mark unread' : 'Mark read'}
            </Button>
            <Button
              variant="default"
              leftSection={<FileTypeIcon fileName="response.pdf" size={16} />}
              onClick={() => downloadSubmissionPdf(form?.title ?? '', columns, viewing)}
            >
              PDF
            </Button>
            <Tooltip label="Delete response" withArrow>
              <ActionIcon variant="default" size="input-sm" color="red" ml="auto" aria-label="Delete response" onClick={() => onDelete(viewing)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>
      )}
    </Drawer>
  );
}
