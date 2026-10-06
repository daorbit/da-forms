import { useState } from 'react';
import { ActionIcon, Button, Textarea, Tooltip } from '@mantine/core';
import { NotebookPenIcon, Trash2Icon } from 'lucide-react';
import type { SubmissionNote } from '@/types';
import { relativeTime } from '@/lib/relativeTime';
import { formatDateTime } from '../entriesTypes';
import classes from './NotesPanel.module.css';

interface Props {
  notes: SubmissionNote[];
  onAdd: (text: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  disabled?: boolean;
}

export function NotesPanel({ notes, onAdd, onDelete, disabled }: Props) {
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
    <div className={classes.panel}>
      <div className={classes.composer}>
        <Textarea
          classNames={{ wrapper: classes.input }}
          variant="unstyled"
          autosize
          minRows={2}
          maxRows={8}
          placeholder="Add a note for your team…"
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
        <div className={classes.composerFoot}>
          <span className={classes.hint}>Only your team sees notes · Ctrl+Enter to save</span>
          <Button size="xs" onClick={submit} loading={saving} disabled={disabled || !draft.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className={classes.empty}>
          <span className={classes.emptyIcon}>
            <NotebookPenIcon size={16} />
          </span>
          No notes yet. Log calls, next steps or anything the team should know.
        </div>
      ) : (
        <div className={classes.timeline}>
          {[...notes].reverse().map((note) => (
            <div key={note.id} className={classes.note}>
              <div className={classes.noteHead}>
                <Tooltip label={formatDateTime(note.createdAt)} withArrow openDelay={300}>
                  <span className={classes.noteTime}>{relativeTime(note.createdAt)}</span>
                </Tooltip>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size={24}
                  radius="md"
                  className={classes.noteDelete}
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
        </div>
      )}
    </div>
  );
}
