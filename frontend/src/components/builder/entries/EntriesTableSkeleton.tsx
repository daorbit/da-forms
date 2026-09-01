import { Group, Skeleton, Table } from '@mantine/core';
import classes from '../../../pages/EntriesPage.module.css';

const SKELETON_ROWS = 10;
// A fixed count, not `columns.length`: this renders before `form` (and so
// `columns`) has loaded, so it can't take its shape from the real table —
// that mismatch was what made this look like two different skeletons.
const SKELETON_COLS = 5;

/**
 * Stands in for the whole table — header included — while the form (and its
 * field columns) hasn't loaded yet. Not wired to any real data, so its shape
 * never changes once the real header/columns arrive.
 */
export function EntriesTableSkeleton() {
  return (
    <Table.ScrollContainer minWidth={SKELETON_COLS * 180 + 90 + 160} className={classes.tableWrap}>
      <Table withTableBorder className={classes.table}>
        <Table.Thead className={classes.thead}>
          <Table.Tr>
            {Array.from({ length: SKELETON_COLS }).map((_, i) => (
              <Table.Th key={i} className={classes.th}>
                <Skeleton height={14} width="50%" />
              </Table.Th>
            ))}
            <Table.Th className={classes.th}>
              <Skeleton height={14} width="50%" />
            </Table.Th>
            <Table.Th className={`${classes.th} ${classes.actionsCol}`}>
              <Skeleton height={14} width="50%" />
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Table.Tr key={i}>
              {Array.from({ length: SKELETON_COLS }).map((_, j) => (
                <Table.Td key={j}>
                  <Skeleton height={16} width="60%" />
                </Table.Td>
              ))}
              <Table.Td>
                <Skeleton height={16} width="60%" />
              </Table.Td>
              <Table.Td className={classes.actionsCol}>
                <Group gap={4} wrap="nowrap">
                  <Skeleton height={28} width={28} circle />
                  <Skeleton height={28} width={28} circle />
                  <Skeleton height={28} width={28} circle />
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
