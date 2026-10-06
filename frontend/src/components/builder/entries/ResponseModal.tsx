import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Tabs, Tooltip } from '@mantine/core';
import { ChevronDownIcon, ChevronUpIcon, MailIcon, MailOpenIcon, Trash2Icon } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { PanelDrawer } from '@/components/ui/PanelDrawer';
import panel from '@/components/ui/PanelDrawer.module.css';
import { relativeTime } from '@/lib/relativeTime';
import { respondentIdentity } from '@/lib/respondent';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import type { Form, Submission } from '@/types';
import { FileTypeIcon } from './fileTypeIcon';
import { formatDateTime } from './entriesTypes';
import { ResponseHero } from './response/ResponseHero';
import { LeadBar } from './response/LeadBar';
import { AnswerList } from './response/AnswerList';
import { NotesPanel } from './response/NotesPanel';
import { ResponseDetails } from './response/ResponseDetails';
import type { Attachment } from './response/AnswerValue';
import type { PipelineHandlers, ResponseColumn } from './response/types';
import classes from './response/ResponseDrawer.module.css';
import tabs from '@/components/ui/UnderlineTabs.module.css';

type Tab = 'answers' | 'notes' | 'details';

interface Props {
  form: Form | null;
  columns: ResponseColumn[];
  viewing: Submission | null;
  submissions?: Submission[];
  onNavigate?: (submission: Submission) => void;
  onClose: () => void;
  onMarkRead: (submission: Submission) => void;
  onToggleRead?: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  onOpenAttachment: (attachment: Attachment) => void;
  pipeline?: PipelineHandlers;
}

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
}: Props) {
  const [tab, setTab] = useState<Tab>('answers');
  const index = viewing ? submissions.findIndex((s) => s._id === viewing._id) : -1;
  const prev = index > 0 ? submissions[index - 1] : null;
  const next = index >= 0 && index < submissions.length - 1 ? submissions[index + 1] : null;
  const identity = useMemo(
    () => (viewing ? respondentIdentity(columns, viewing) : null),
    [columns, viewing]
  );
  const noteCount = viewing?.notes?.length ?? 0;

  useEffect(() => {
    if (!viewing || !onNavigate) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (/input|textarea|select/i.test(target.tagName) || target.isContentEditable)) return;
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
      size={600}
      bare
      ariaLabel="Response"
      title={
        <>
          Response
          {index >= 0 && submissions.length > 1 && (
            <span className={classes.count}>
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
      {viewing && identity && (
        <div className={classes.drawer}>
          <div className={classes.scroll}>
            <ResponseHero submission={viewing} identity={identity} />
            {pipeline && <LeadBar submission={viewing} pipeline={pipeline} />}

            <Tabs
              value={tab}
              onChange={(value) => value && setTab(value as Tab)}
              className={classes.tabs}
              classNames={{ list: tabs.list, tab: tabs.tab }}
              keepMounted={false}
            >
              <Tabs.List>
                <Tabs.Tab value="answers">Answers</Tabs.Tab>
                {pipeline && (
                  <Tabs.Tab value="notes">
                    Notes
                    {noteCount > 0 && <span className={tabs.count}>{noteCount}</span>}
                  </Tabs.Tab>
                )}
                <Tabs.Tab value="details">Details</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="answers" className={classes.panel}>
                <AnswerList columns={columns} submission={viewing} onOpenAttachment={onOpenAttachment} />
              </Tabs.Panel>

              {pipeline && (
                <Tabs.Panel value="notes" className={classes.panel} data-padded>
                  <NotesPanel
                    notes={viewing.notes ?? []}
                    onAdd={(text) => pipeline.onAddNote(viewing, text)}
                    onDelete={(noteId) => pipeline.onDeleteNote(viewing, noteId)}
                    disabled={pipeline.readOnly}
                  />
                </Tabs.Panel>
              )}

              <Tabs.Panel value="details" className={classes.panel}>
                <ResponseDetails submission={viewing} />
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>
      )}
    </PanelDrawer>
  );
}
