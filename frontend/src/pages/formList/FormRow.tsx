import { Link } from 'react-router-dom';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { EyeIcon, FileTextIcon, InboxIcon, Share2Icon } from 'lucide-react';
import { relativeTime } from '@/lib/relativeTime';
import type { Form } from '@/types';
import { conversionRate, formatDate } from './constants';
import { FormRowMenu } from './FormRowMenu';
import classes from './FormRow.module.css';

export interface FormRowActions {
  onPreview: (form: Form) => void;
  onShare: (form: Form) => void;
  onToggleStatus: (form: Form) => void;
  onDuplicate: (form: Form) => void;
  onCopyConfig: (form: Form) => void;
  onDelete: (form: Form) => void;
}

interface Props {
  form: Form;
  workspaceId: string;
  isDemo: boolean;
  compact: boolean;
  busy: { duplicating: boolean; copyingConfig: boolean };
  actions: FormRowActions;
}

function StatusPill({ live }: { live: boolean }) {
  return (
    <span className={classes.status} data-live={live || undefined}>
      <span className={classes.dot} />
      {live ? 'Live' : 'Draft'}
    </span>
  );
}

export function FormRow({ form, workspaceId, isDemo, compact, busy, actions }: Props) {
  const live = form.status === 'published';
  const responses = form.submissionCount;
  const basePath = `/${workspaceId}/forms/${form._id}`;
  const updated = relativeTime(form.updatedAt || form.createdAt);
  const fieldCount = form.fields?.length ?? 0;

  return (
    <div className={classes.row}>
      <div className={classes.name}>
        <span className={classes.icon} data-live={live || undefined} aria-hidden>
          <FileTextIcon size={17} strokeWidth={1.7} />
        </span>
        <div className={classes.nameText}>
          <Link to={`${basePath}/edit`} className={classes.title}>
            {form.name || form.title}
          </Link>
          {compact ? (
            <div className={classes.compactMeta}>
              <StatusPill live={live} />
              <span>{updated}</span>
            </div>
          ) : (
            <div className={classes.subline}>
              {fieldCount > 0 ? `${fieldCount} field${fieldCount === 1 ? '' : 's'}` : 'No fields yet'}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <>
          <div className={classes.cell}>
            <StatusPill live={live} />
          </div>
          {!isDemo && (
            <>
              <span className={`${classes.cell} ${classes.metric}`}>{responses?.toLocaleString() ?? '—'}</span>
              <span className={`${classes.cell} ${classes.metric} ${classes.secondary}`}>
                {(form.viewCount ?? 0).toLocaleString()}
              </span>
              <span className={`${classes.cell} ${classes.metric} ${classes.secondary}`}>
                {conversionRate(form.viewCount, responses)}
              </span>
            </>
          )}
          <Tooltip label={`Created ${formatDate(form.createdAt)}`} withArrow openDelay={400}>
            <span className={`${classes.cell} ${classes.updated} ${classes.secondary}`}>{updated}</span>
          </Tooltip>
        </>
      )}

      <div className={classes.actions}>
        {isDemo ? (
          <Button component={Link} to={`${basePath}/edit`} variant="default" size="xs" radius="xl">
            Open
          </Button>
        ) : (
          <>
            {!compact && (
              <div className={classes.rowActions}>
                <Tooltip label="Responses" withArrow>
                  <ActionIcon
                    component={Link}
                    to={`${basePath}/entries`}
                    variant="subtle"
                    size={28}
                    radius="md"
                    className={classes.iconAction}
                    aria-label="Responses"
                  >
                    <InboxIcon size={15} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Preview" withArrow>
                  <ActionIcon
                    variant="subtle"
                    size={28}
                    radius="md"
                    className={classes.iconAction}
                    onClick={() => actions.onPreview(form)}
                    aria-label="Preview"
                  >
                    <EyeIcon size={15} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Share" withArrow>
                  <ActionIcon
                    variant="subtle"
                    size={28}
                    radius="md"
                    className={classes.iconAction}
                    onClick={() => actions.onShare(form)}
                    aria-label="Share"
                  >
                    <Share2Icon size={15} />
                  </ActionIcon>
                </Tooltip>
              </div>
            )}
            <FormRowMenu form={form} basePath={basePath} compact={compact} busy={busy} actions={actions} />
          </>
        )}
      </div>
    </div>
  );
}
