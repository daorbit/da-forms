import { Link } from 'react-router-dom';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { FileTextIcon, PencilIcon, Share2Icon, TableIcon } from 'lucide-react';
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

export function FormRow({ form, workspaceId, isDemo, compact, busy, actions }: Props) {
  const live = form.status === 'published';
  const responses = form.submissionCount ?? 0;
  const basePath = `/${workspaceId}/forms/${form._id}`;
  const updated = relativeTime(form.updatedAt || form.createdAt);

  return (
    <div className={classes.row} data-live={live || undefined}>
      <div className={classes.main}>
        <span className={classes.icon} aria-hidden>
          <FileTextIcon size={19} strokeWidth={1.6} />
        </span>
        <div className={classes.text}>
          <Link to={`${basePath}/edit`} className={classes.title}>
            {form.name || form.title}
          </Link>
          <div className={classes.links}>
            <span className={classes.status} data-live={live || undefined}>
              <span className={classes.dot} />
              {live ? 'Live' : 'Draft'}
            </span>
            {!isDemo && (
              <Link to={`${basePath}/entries`} className={classes.link}>
                {responses.toLocaleString()} {responses === 1 ? 'response' : 'responses'}
              </Link>
            )}
            <button type="button" className={classes.link} onClick={() => actions.onPreview(form)}>
              Preview
            </button>
            {!isDemo && (
              <button type="button" className={classes.link} onClick={() => actions.onShare(form)}>
                Share
              </button>
            )}
            <Tooltip label={`Created ${formatDate(form.createdAt)}`} withArrow openDelay={400}>
              <span className={classes.meta}>Updated {updated}</span>
            </Tooltip>
          </div>
        </div>
      </div>

      {!compact && !isDemo && (
        <div className={classes.stats}>
          <div className={classes.stat}>
            <span className={classes.statValue}>{(form.viewCount ?? 0).toLocaleString()}</span>
            <span className={classes.statLabel}>Views</span>
          </div>
          <div className={classes.stat}>
            <span className={classes.statValue}>{conversionRate(form.viewCount, form.submissionCount)}</span>
            <span className={classes.statLabel}>Conversion</span>
          </div>
        </div>
      )}

      <div className={classes.actions}>
        {isDemo ? (
          <Button component={Link} to={`${basePath}/edit`} variant="default" size="xs" radius="xl">
            Open
          </Button>
        ) : (
          <>
            {!compact && (
              <>
                <Button
                  component={Link}
                  to={`${basePath}/edit`}
                  variant="default"
                  size="xs"
                  radius="xl"
                  className={classes.pill}
                  leftSection={<PencilIcon size={14} />}
                >
                  Edit
                </Button>
                <Button
                  component={Link}
                  to={`${basePath}/entries`}
                  variant="default"
                  size="xs"
                  radius="xl"
                  className={classes.pill}
                  leftSection={<TableIcon size={14} />}
                >
                  All entries
                </Button>
                <span className={classes.divider} aria-hidden />
                <Tooltip label="Share" withArrow>
                  <ActionIcon
                    variant="default"
                    size={32}
                    radius="xl"
                    className={classes.round}
                    onClick={() => actions.onShare(form)}
                    aria-label="Share"
                  >
                    <Share2Icon size={15} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
            <FormRowMenu form={form} basePath={basePath} compact={compact} busy={busy} actions={actions} />
          </>
        )}
      </div>
    </div>
  );
}
