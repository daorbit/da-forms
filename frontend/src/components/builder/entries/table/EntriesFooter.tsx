import { Pagination } from '@mantine/core';
import { PAGE_SIZE } from '../entriesTypes';
import classes from '../EntriesTable.module.css';

interface Props {
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function EntriesFooter({ total, page, onPageChange }: Props) {
  if (total <= 0) return null;
  return (
    <div className={classes.footer}>
      <span className={classes.count}>
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
      </span>
      {total > PAGE_SIZE && (
        <Pagination size="sm" radius="md" total={Math.ceil(total / PAGE_SIZE)} value={page} onChange={onPageChange} />
      )}
    </div>
  );
}
