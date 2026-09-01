import { ActionIcon, Anchor, Button, Group, Image, Pagination, Stack, Table, Text, ThemeIcon, Tooltip } from '@mantine/core';
import {
  IconFileText,
  IconVideo,
  IconShare2,
  IconEye,
  IconTrash,
  IconFileTypePdf,
  IconMailOpened,
} from '@tabler/icons-react';
import type { Form, FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { formatDateTime, isImageUrl, PAGE_SIZE } from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';

export function EntriesTable({
  form,
  columns,
  submissions,
  total,
  page,
  loading,
  onPageChange,
  onMarkRead,
  onView,
  onDelete,
  onCopyShareLink,
  onOpenAttachment,
}: {
  form: Form | null;
  columns: FormField[];
  submissions: Submission[];
  total: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onMarkRead: (submission: Submission) => void;
  onView: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  onCopyShareLink: () => void;
  onOpenAttachment: (attachment: { url: string; name: string; image: boolean }) => void;
}) {
  return (
    <>
      {/* Enough width for every value column at 180px plus the date and
          actions columns, so a narrow screen scrolls the table sideways
          instead of crushing the columns into unreadable slivers. */}
      <Table.ScrollContainer minWidth={columns.length * 180 + 90 + 160} className={classes.tableWrap}>
        <Table
          withTableBorder
          highlightOnHover
          className={`${classes.table} ${loading && submissions.length > 0 ? classes.tableLoading : ''}`}
          aria-busy={loading}
        >
          <Table.Thead className={classes.thead}>
            <Table.Tr>
              {/* No leading icon: the icon shifted every heading right by its
                  own width while the values below started at the cell edge,
                  so each column read as misaligned with its own data. The
                  field type is already visible from the values. */}
              {columns.map((field) => (
                <Table.Th key={field.id} className={classes.th}>
                  <Text size="sm" fw={600} title={field.label} truncate>
                    {field.label}
                  </Text>
                </Table.Th>
              ))}
              <Table.Th className={classes.th}>
                <Text size="sm" fw={600}>
                  Added Time
                </Text>
              </Table.Th>
              <Table.Th className={`${classes.th} ${classes.actionsCol}`}>
                <Text size="sm" fw={600}>
                  Actions
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {submissions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 2}>
                  <Stack align="center" gap={4} py="xl">
                    <ThemeIcon variant="light" color="gray" size={44} radius="xl">
                      <IconMailOpened size={22} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">
                      No responses yet
                    </Text>
                    <Text size="xs" c="dimmed" ta="center" maw={320}>
                      Share your form's link to start collecting responses.
                    </Text>
                    <Button variant="light" color="emerald" size="xs" mt="xs" leftSection={<IconShare2 size={14} />} onClick={onCopyShareLink}>
                      Copy share link
                    </Button>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              submissions.map((submission) => (
                <Table.Tr key={submission._id} onClick={() => onMarkRead(submission)} style={{ fontWeight: submission.read ? 400 : 700 }}>
                  {columns.map((field) => {
                    // A payment is not an answer — it lives on the
                    // submission itself, written by the webhook rather
                    // than typed by the respondent.
                    if (field.type === 'payment') {
                      return (
                        <Table.Td key={field.id}>
                          <PaymentCell payment={submission.payment} />
                        </Table.Td>
                      );
                    }
                    const raw = submission.data[field.id] ?? '';
                    // Older submissions (or builder-preview edits) may only hold a bare
                    // filename from before uploads were wired to Cloudinary — link only
                    // what's actually a URL.
                    const isFileLink = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);
                    const isImage = isFileLink && (field.type === 'imageUpload' || field.type === 'signature' || isImageUrl(raw));
                    const fileName = raw.split('/').pop() || 'Attachment';
                    return (
                      <Table.Td key={field.id}>
                        {isImage ? (
                          <Anchor href={raw} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={raw}
                              alt={fileName}
                              h={40}
                              w={40}
                              fit="cover"
                              radius="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                onOpenAttachment({ url: raw, name: fileName, image: true });
                              }}
                            />
                          </Anchor>
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
                              <ThemeIcon variant="light" color="gray" size={28} radius="sm">
                                {field.type === 'mediaUpload' ? <IconVideo size={15} /> : <IconFileText size={15} />}
                              </ThemeIcon>
                              <Text size="sm" td="underline" truncate maw={160}>
                                {fileName}
                              </Text>
                            </Group>
                          </Anchor>
                        ) : (
                          <Text size="sm" className={classes.cellText} title={raw}>
                            {raw}
                          </Text>
                        )}
                      </Table.Td>
                    );
                  })}
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDateTime(submission.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td className={classes.actionsCol} onClick={(e) => e.stopPropagation()}>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="View response" withArrow>
                        <ActionIcon variant="subtle" color="gray" onClick={() => onView(submission)}>
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Download PDF" withArrow>
                        <ActionIcon variant="subtle" color="gray" onClick={() => downloadSubmissionPdf(form?.title ?? '', columns, submission)}>
                          <IconFileTypePdf size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete response" withArrow>
                        <ActionIcon variant="subtle" color="red" onClick={() => onDelete(submission)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="flex-end" px="md" py="md">
        <Pagination
          total={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          value={page}
          onChange={onPageChange}
          color="emerald"
          disabled={total <= PAGE_SIZE}
        />
      </Group>
    </>
  );
}
