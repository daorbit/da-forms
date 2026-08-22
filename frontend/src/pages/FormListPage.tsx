import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Group,
  Text,
  Button,
  Stack,
  ActionIcon,
  ThemeIcon,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconChevronDown,
  IconFileText,
  IconPencil,
  IconGridDots,
  IconMail,
  IconShare2,
  IconDots,
} from '@tabler/icons-react';
import { listForms } from '@/lib/api';
import type { Form } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import classes from './FormListPage.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FormListPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newFormOpen, setNewFormOpen] = useState(false);

  useEffect(() => {
    listForms().then(setForms);
  }, []);

  return (
    <Box>
      <Group justify="space-between" px="xl" py="md" className={classes.topbar}>
        <Group gap={6}>
          <Text fw={600} size="lg">
            All Forms
          </Text>
          <IconChevronDown size={16} />
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
            <IconSearch size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
            <IconArrowsSort size={18} />
          </ActionIcon>
          <Button
            radius="xl"
            color="teal"
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewFormOpen(true)}
          >
            New Form
          </Button>
        </Group>
      </Group>

      <Stack gap="xs" px="xl" py="md">
        {forms.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No forms yet. Create your first one.
          </Text>
        )}

        {forms.map((form) => {
          const active = activeId === form._id;
          return (
            <Box
              key={form._id}
              className={`${classes.row} ${active ? classes.rowActive : ''}`}
              onMouseEnter={() => setActiveId(form._id)}
              onMouseLeave={() => setActiveId(null)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color={active ? 'teal' : 'gray'} radius="md" size={38}>
                    <IconFileText size={20} />
                  </ThemeIcon>
                  <div>
                    <Link to={`/forms/${form._id}/edit`} className={classes.title}>
                      {form.title}
                    </Link>
                    {active ? (
                      <Group gap={6} className={classes.quickLinks}>
                        <Text component={Link} to={`/forms/${form._id}/entries`} size="sm">
                          Entries
                        </Text>
                        <Text size="sm" c="dimmed">
                          &bull;
                        </Text>
                        <Text component={Link} to={`/forms/${form._id}`} size="sm">
                          Share
                        </Text>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Created on: {formatDate(form.createdAt)}
                      </Text>
                    )}
                  </div>
                </Group>

                {active && (
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      component={Link}
                      to={`/forms/${form._id}/edit`}
                      variant="default"
                      radius="xl"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                    >
                      Edit
                    </Button>
                    <Button
                      component={Link}
                      to={`/forms/${form._id}/entries`}
                      variant="default"
                      radius="xl"
                      size="xs"
                      leftSection={<IconGridDots size={14} />}
                    >
                      All Entries
                    </Button>
                    <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
                      <IconMail size={16} />
                    </ActionIcon>
                    <ActionIcon
                      component={Link}
                      to={`/forms/${form._id}`}
                      variant="subtle"
                      color="gray"
                      radius="xl"
                      size="lg"
                    >
                      <IconShare2 size={16} />
                    </ActionIcon>
                    <Menu shadow="md" position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                    </Menu>
                  </Group>
                )}
              </Group>
            </Box>
          );
        })}
      </Stack>

      <NewFormModal opened={newFormOpen} onClose={() => setNewFormOpen(false)} />
    </Box>
  );
}
