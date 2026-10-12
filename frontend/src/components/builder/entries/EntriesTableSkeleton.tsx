import { Group, Skeleton, Stack, Table } from '@mantine/core';
import classes from './EntriesTable.module.css';

const SKELETON_ROWS = 8;
const SKELETON_COLS = 3;

export function EntriesTableSkeleton() {
  return (
    <div className={`surface-card ${classes.card}`}>
      <Table.ScrollContainer minWidth={SKELETON_COLS * 180 + 44 + 240 + 130 + 120 + 56} className={classes.scroll}>
        <Table className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={`${classes.th} ${classes.checkCol}`}>
                <Skeleton height={14} width={14} radius={4} />
              </Table.Th>
              <Table.Th className={`${classes.th} ${classes.whoCol}`}>
                <Skeleton height={10} width="40%" radius="sm" />
              </Table.Th>
              {Array.from({ length: SKELETON_COLS }).map((_, i) => (
                <Table.Th key={i} className={classes.th}>
                  <Skeleton height={10} width="45%" radius="sm" />
                </Table.Th>
              ))}
              <Table.Th className={`${classes.th} ${classes.stageCol}`}>
                <Skeleton height={10} width="50%" radius="sm" />
              </Table.Th>
              <Table.Th className={`${classes.th} ${classes.dateCol}`}>
                <Skeleton height={10} width="60%" radius="sm" />
              </Table.Th>
              <Table.Th className={`${classes.th} ${classes.actionsCol}`} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <Table.Tr key={i}>
                <Table.Td className={classes.td}>
                  <Skeleton height={14} width={14} radius={4} />
                </Table.Td>
                <Table.Td className={classes.td}>
                  <Stack gap={6}>
                    <Skeleton height={10} width="60%" radius="sm" />
                    <Skeleton height={8} width="80%" radius="sm" />
                  </Stack>
                </Table.Td>
                {Array.from({ length: SKELETON_COLS }).map((_, j) => (
                  <Table.Td key={j} className={classes.td}>
                    <Skeleton height={10} width={`${70 - j * 12}%`} radius="sm" />
                  </Table.Td>
                ))}
                <Table.Td className={classes.td}>
                  <Skeleton height={10} width="55%" radius="sm" />
                </Table.Td>
                <Table.Td className={classes.td}>
                  <Skeleton height={10} width="60%" radius="sm" />
                </Table.Td>
                <Table.Td className={classes.td}>
                  <Group justify="flex-end">
                    <Skeleton height={24} width={24} radius="md" />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}
