import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Group, Text, Button, ThemeIcon, Table, Box, Menu, ActionIcon, Loader, Center } from '@mantine/core';
import {
  IconFileText,
  IconChevronDown,
  IconClock,
  IconShare2,
  IconFilter,
  IconDots,
  IconCalendarPlus,
  IconArrowLeft,
} from '@tabler/icons-react';
import { getForm, listSubmissions } from '@/lib/api';
import type { Form, Submission } from '@/types';
import { paletteByType, staticTypes } from '@/lib/fieldPalette';
import classes from './EntriesPage.module.css';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EntriesPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!id) return;
    getForm(id).then(setForm);
    listSubmissions(id).then(setSubmissions);
  }, [id]);

  if (!form)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  // layout-only elements never collect a value, so they get no column
  const columns = form.fields.filter((field) => !staticTypes.includes(field.type));

  return (
    <Box>
      <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <ActionIcon component={Link} to="/" variant="subtle" color="gray" size="lg" aria-label="Back to all forms">
            <IconArrowLeft size={19} />
          </ActionIcon>
          <ThemeIcon variant="light" color="gray" radius="sm">
            <IconFileText size={18} />
          </ThemeIcon>
          <Text fw={600} component={Link} to={`/forms/${form._id}/edit`} className={classes.formLink}>
            {form.title}
          </Text>
        </Group>
        <Group gap="xs">
          <Button variant="default" radius="md" color="emerald">
            Share
          </Button>
          <Button color="emerald" radius="md">
            New Report
          </Button>
        </Group>
      </Group>

      <Group justify="space-between" px="md" py="xs" className={classes.filterbar} wrap="nowrap">
        <Group gap="lg">
          <Menu>
            <Menu.Target>
              <Group gap={4} className={classes.filterItem}>
                <Text fw={600} size="sm">
                  All Entries
                </Text>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>
          </Menu>

          <Text c="dimmed">|</Text>

          <Menu>
            <Menu.Target>
              <Group gap={4} className={classes.filterItem}>
                <Text fw={600} size="sm">
                  All Days
                </Text>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>
          </Menu>
        </Group>

        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray">
            <IconClock size={17} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray">
            <IconShare2 size={17} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray">
            <IconFilter size={17} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray">
            <IconDots size={17} />
          </ActionIcon>
        </Group>
      </Group>

      <Box className={classes.tableWrap}>
        <Table withTableBorder highlightOnHover className={classes.table}>
          <Table.Thead className={classes.thead}>
            <Table.Tr>
              {columns.map((field) => {
                const meta = paletteByType[field.type];
                return (
                  <Table.Th key={field.id} className={classes.th}>
                    <Group gap={6} wrap="nowrap">
                      <meta.icon size={15} stroke={1.6} color="var(--mantine-color-gray-6)" />
                      <Text size="sm" fw={600}>
                        {field.label}
                      </Text>
                    </Group>
                  </Table.Th>
                );
              })}
              <Table.Th className={classes.th}>
                <Group gap={6} wrap="nowrap">
                  <IconCalendarPlus size={15} stroke={1.6} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" fw={600}>
                    Added Time
                  </Text>
                </Group>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {submissions.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 1}>
                  <Text ta="center" py="xl" c="emerald">
                    No entries
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              submissions.map((submission) => (
                <Table.Tr key={submission._id}>
                  {columns.map((field) => (
                    <Table.Td key={field.id}>
                      <Text size="sm">{submission.data[field.id] ?? ''}</Text>
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDateTime(submission.createdAt)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </Box>
  );
}
