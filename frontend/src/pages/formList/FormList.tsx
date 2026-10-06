import { Pagination, Skeleton } from '@mantine/core';
import type { Form } from '@/types';
import { PAGE_SIZE } from './constants';
import { FormRow, type FormRowActions } from './FormRow';
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
    <div className={classes.skeleton}>
      <Skeleton height={42} width={42} radius={11} />
      <div>
        <Skeleton height={14} width={200} radius="sm" />
        <Skeleton height={10} width={260} radius="sm" mt={10} />
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
