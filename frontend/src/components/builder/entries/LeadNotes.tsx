import { useState } from 'react';
import { ActionIcon, Button, Textarea, Tooltip } from '@mantine/core';
import { Trash2Icon } from 'lucide-react';
import type { SubmissionNote } from '@/types';
import { relativeTime } from '@/lib/relativeTime';
import { formatDateTime } from './entriesTypes';
import classes from './LeadPanel.module.css';

interface Props {
  notes: SubmissionNote[];
  onAdd: (text: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  disabled?: boolean;
}

export function LeadNotes({ notes, onAdd, onDelete, disabled }: Props) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await onAdd(text);
      setDraft('');
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={classes.notes}>
      {[...notes].reverse().map((note) => (
        <div key={note.id} className={classes.note}>
          <div className={classes.noteHead}>
            <Tooltip label={formatDateTime(note.createdAt)} withArrow openDelay={300}>
              <span className={classes.noteTime}>{relativeTime(note.createdAt)}</span>
            </Tooltip>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => onDelete(note.id)}
              disabled={disabled}
              aria-label="Delete note"
            >
              <Trash2Icon size={13} />
            </ActionIcon>
          </div>
          <div className={classes.noteText}>{note.text}</div>
        </div>
      ))}

      <div className={classes.composer}>
        <Textarea
          className={classes.composerInput}
          size="xs"
          autosize
          minRows={2}
          maxRows={6}
          placeholder="Add an internal note — respondents never see these."
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={disabled}
          aria-label="New note"
        />
        <Button size="xs" variant="light" onClick={submit} loading={saving} disabled={disabled || !draft.trim()}>
          Add note
        </Button>
      </div>
    </div>
  );
}
