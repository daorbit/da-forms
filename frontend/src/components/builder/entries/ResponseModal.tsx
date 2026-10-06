import { useEffect } from 'react';
import { ActionIcon, Anchor, Button, Group, Image, Paper, Stack, Table, Text, Tooltip } from '@mantine/core';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  MailIcon,
  MailOpenIcon,
  Trash2Icon,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { PanelDrawer } from '@/components/ui/PanelDrawer';
import panel from '@/components/ui/PanelDrawer.module.css';
import { relativeTime } from '@/lib/relativeTime';
import type { Form, FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { repeaterDisplayRows } from '@/lib/repeater';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { FileTypeIcon } from './fileTypeIcon';
import { FileSizeBadge } from './FileSizeBadge';
import { answerText, formatAnswer, formatDateTime, isImageUrl } from './entriesTypes';
import { LeadPanel, type PipelineHandlers } from './LeadPanel';
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
  pipeline,
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
  pipeline?: PipelineHandlers;
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
    <PanelDrawer
      opened={!!viewing}
      onClose={onClose}
      size={560}
      bare
      title={
        <>
          Response
          {index >= 0 && submissions.length > 1 && (
            <span className={classes.drawerCount}>
              {index + 1} of {submissions.length}
            </span>
          )}
        </>
      }
      subtitle={
        viewing && (
          <>
            <StatusPill tone={viewing.read ? 'idle' : 'live'} label={viewing.read ? 'Read' : 'New'} />
            <Tooltip label={formatDateTime(viewing.createdAt)} withArrow>
              <span>Submitted {relativeTime(viewing.createdAt)}</span>
            </Tooltip>
          </>
        )
      }
      headerActions={
        onNavigate && (
          <>
            <Tooltip label="Previous (↑)" withArrow>
              <ActionIcon variant="subtle" size={30} radius="xl" className={panel.headerButton} disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label="Previous response">
                <ChevronUpIcon size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Next (↓)" withArrow>
              <ActionIcon variant="subtle" size={30} radius="xl" className={panel.headerButton} disabled={!next} onClick={() => next && onNavigate(next)} aria-label="Next response">
                <ChevronDownIcon size={16} />
              </ActionIcon>
            </Tooltip>
          </>
        )
      }
      footer={
        viewing && (
          <>
            <Button
              variant="default"
              leftSection={viewing.read ? <MailIcon size={16} /> : <MailOpenIcon size={16} />}
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
                <Trash2Icon size={16} />
              </ActionIcon>
            </Tooltip>
          </>
        )
      }
    >
      {viewing && (
        <div className={classes.drawer}>
          {viewing.sourceUrl && (
            <div className={classes.drawerSource}>
              <GlobeIcon size={13} />
              <Text size="xs" c="dimmed" truncate>
                {viewing.sourceUrl}
              </Text>
            </div>
          )}

          <div className={classes.drawerScroll}>
          {pipeline && <LeadPanel submission={viewing} pipeline={pipeline} />}
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

        </div>
      )}
    </PanelDrawer>
  );
}
