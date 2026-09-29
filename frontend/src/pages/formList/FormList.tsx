import { Pagination, Skeleton } from '@mantine/core';
import type { Form } from '@/types';
import { PAGE_SIZE } from './constants';
import { FormRow, type FormRowActions } from './FormRow';
import rowClasses from './FormRow.module.css';
import classes from './FormList.module.css';

interface Props {
  forms: Form[];
  loading: boolean;
  total: number;
  page: number;
  onPage: (page: number) => void;
  workspaceId: string;
  isDemo: boolean;
  compact: boolean;
  duplicatingId: string | null;
  copyingConfigId: string | null;
  actions: FormRowActions;
}

function SkeletonRow() {
  return (
    <div className={rowClasses.row}>
      <div className={rowClasses.name}>
        <Skeleton height={36} width={36} radius={10} />
        <div className={rowClasses.nameText}>
          <Skeleton height={12} width={180} radius="sm" />
          <Skeleton height={10} width={70} radius="sm" mt={8} />
        </div>
      </div>
    </div>
  );
}

export function FormList({
  forms,
  loading,
  total,
  page,
  onPage,
  workspaceId,
  isDemo,
  compact,
  duplicatingId,
  copyingConfigId,
  actions,
}: Props) {
  const showSkeleton = loading && forms.length === 0;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <div
        className={`surface-card ${classes.list}`}
        data-demo={isDemo || undefined}
        data-compact={compact || undefined}
      >
        {!compact && (
          <div className={classes.header}>
            <span>Name</span>
            <span>Status</span>
            {!isDemo && (
              <>
                <span className={classes.right}>Responses</span>
                <span className={`${classes.right} ${classes.secondary}`}>Views</span>
                <span className={`${classes.right} ${classes.secondary}`}>Conversion</span>
              </>
            )}
            <span className={`${classes.right} ${classes.secondary}`}>Updated</span>
            <span />
          </div>
        )}

        <div className={classes.rows} data-loading={loading && !showSkeleton ? true : undefined}>
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : forms.map((form) => (
                <FormRow
                  key={form._id}
                  form={form}
                  workspaceId={workspaceId}
                  isDemo={isDemo}
                  compact={compact}
                  busy={{ duplicating: duplicatingId === form._id, copyingConfig: copyingConfigId === form._id }}
                  actions={actions}
                />
              ))}
        </div>
      </div>

      {total > PAGE_SIZE && (
        <div className={classes.footer}>
          <span className={classes.count}>
            {first}–{last} of {total}
          </span>
          <Pagination size="sm" radius="md" total={Math.ceil(total / PAGE_SIZE)} value={page} onChange={onPage} />
        </div>
      )}
    </>
  );
}
