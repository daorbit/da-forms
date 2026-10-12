import { Checkbox, Pagination, Table, Tooltip } from '@mantine/core';
import { InboxIcon, Share2Icon } from 'lucide-react';
import type { Form, FormField, Submission } from '@/types';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import { relativeTime } from '@/lib/relativeTime';
import { identityFieldIds } from '@/lib/respondent';
import { valueFields } from '@/lib/fieldTree';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntryCell } from './EntryCell';
import { RespondentCell } from './table/RespondentCell';
import { StageLabel } from './table/StageLabel';
import { RowActions } from './table/RowActions';
import { formatDateTime, PAGE_SIZE } from './entriesTypes';
import classes from './EntriesTable.module.css';

type Column = FormField & { retired?: boolean };

const COLUMN_PX = 180;
const FIXED_PX = 44 + 240 + 130 + 120 + 56;

interface Props {
  form: Form | null;
  columns: Column[];
  submissions: Submission[];
  total: number;
  page: number;
  loading: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onPageChange: (page: number) => void;
  onMarkRead?: (submission: Submission) => void;
  onToggleRead?: (submission: Submission) => void;
  onView: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  onCopyShareLink: () => void;
  onOpenAttachment: (attachment: { url: string; name: string; image: boolean }) => void;
  scored?: boolean;
}

function ColumnHeading({ field }: { field: Column }) {
  return (
    <div className={classes.thLabel}>
      <span className={classes.thText} title={field.label} data-retired={field.retired || undefined}>
        {field.label}
      </span>
      {field.retired && (
        <Tooltip label="Removed from the form — earlier answers are kept here" withArrow>
          <span className={classes.retiredTag}>removed</span>
        </Tooltip>
      )}
    </div>
  );
}

export function EntriesTable({
  form,
  columns,
  submissions,
  total,
  page,
  loading,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onPageChange,
  onToggleRead,
  onView,
  onDelete,
  onCopyShareLink,
  onOpenAttachment,
  scored = false,
}: Props) {
  const fields = form ? valueFields(form.fields) : [];
  const identity = identityFieldIds(fields);
  const answerColumns = columns.filter((c) => !identity.includes(c.id));
  const allSelected = submissions.length > 0 && submissions.every((s) => selected.has(s._id));
  const someSelected = !allSelected && submissions.some((s) => selected.has(s._id));

  if (submissions.length === 0 && !loading) {
    return (
      <div className={`surface-card ${classes.card}`}>
        <EmptyState
          compact
          icon={InboxIcon}
          title="No responses yet"
          description="Share your form's link to start collecting responses."
          action={{ label: 'Copy share link', onClick: onCopyShareLink, icon: Share2Icon, variant: 'default' }}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`surface-card ${classes.card}`}>
        <Table.ScrollContainer
          minWidth={answerColumns.length * COLUMN_PX + FIXED_PX + (scored ? 80 : 0)}
          className={classes.scroll}
        >
          <Table className={`${classes.table} ${loading ? classes.loading : ''}`} aria-busy={loading}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className={`${classes.th} ${classes.checkCol}`}>
                  <Checkbox
                    size="xs"
                    radius="sm"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => onToggleSelectAll(e.currentTarget.checked)}
                    aria-label="Select all responses on this page"
                  />
                </Table.Th>
                <Table.Th className={`${classes.th} ${classes.whoCol}`}>Respondent</Table.Th>
                {answerColumns.map((field) => (
                  <Table.Th key={field.id} className={classes.th}>
                    <ColumnHeading field={field} />
                  </Table.Th>
                ))}
                <Table.Th className={`${classes.th} ${classes.stageCol}`}>Stage</Table.Th>
                {scored && <Table.Th className={`${classes.th} ${classes.scoreCol}`}>Score</Table.Th>}
                <Table.Th className={`${classes.th} ${classes.dateCol}`}>Submitted</Table.Th>
                <Table.Th className={`${classes.th} ${classes.actionsCol}`} aria-label="Actions" />
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {submissions.map((submission) => (
                <Table.Tr
                  key={submission._id}
                  onClick={() => onView(submission)}
                  className={classes.row}
                  data-unread={!submission.read || undefined}
                  data-selected={selected.has(submission._id) || undefined}
                >
                  <Table.Td className={classes.td} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="xs"
                      radius="sm"
                      checked={selected.has(submission._id)}
                      onChange={() => onToggleSelect(submission._id)}
                      aria-label={`Select response from ${formatDateTime(submission.createdAt)}`}
                    />
                  </Table.Td>
                  <Table.Td className={classes.td}>
                    <RespondentCell fields={fields} submission={submission} />
                  </Table.Td>
                  {answerColumns.map((field) => (
                    <Table.Td key={field.id} className={classes.td}>
                      <EntryCell field={field} submission={submission} onView={onView} onOpenAttachment={onOpenAttachment} />
                    </Table.Td>
                  ))}
                  <Table.Td className={classes.td}>
                    <StageLabel submission={submission} />
                  </Table.Td>
                  {scored && <Table.Td className={`${classes.td} ${classes.score}`}>{submission.leadScore ?? '—'}</Table.Td>}
                  <Table.Td className={classes.td}>
                    <Tooltip label={formatDateTime(submission.createdAt)} withArrow openDelay={300}>
                      <span className={classes.date}>{relativeTime(submission.createdAt)}</span>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td className={classes.td} onClick={(e) => e.stopPropagation()}>
                    <div className={classes.actions}>
                      <RowActions
                        submission={submission}
                        onView={() => onView(submission)}
                        onPdf={() => downloadSubmissionPdf(form?.title ?? '', columns, submission)}
                        onToggleRead={onToggleRead ? () => onToggleRead(submission) : undefined}
                        onDelete={() => onDelete(submission)}
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {total > 0 && (
          <div className={classes.footer}>
            <span className={classes.count}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </span>
            {total > PAGE_SIZE && (
              <Pagination
                size="sm"
                radius="md"
                total={Math.ceil(total / PAGE_SIZE)}
                value={page}
                onChange={onPageChange}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
