import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Group, Stack, Text, SegmentedControl } from '@mantine/core';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { FormTheme } from '@/types';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function NewFormModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<NonNullable<FormTheme['scope']>>('page');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = name.trim();
    if (!title) return;
    navigate(`/${workspaceId}/forms/new`, { state: { title, themeScope: scope } });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Create a new form" centered>
      <form onSubmit={handleCreate}>
        <Stack gap="md">
          <TextInput
            label="Form name"
            placeholder="Client Details"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-autofocus
            required
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Where will this form live?
            </Text>
            <Text size="xs" c="dimmed" mb={8}>
              Changes what theming applies to later — the page background only matters for a
              standalone share link.
            </Text>
            <SegmentedControl
              fullWidth
              value={scope}
              onChange={(value) => setScope(value as NonNullable<FormTheme['scope']>)}
              data={[
                { value: 'page', label: 'Standalone link' },
                { value: 'card', label: 'Embedded on a site' },
              ]}
            />
          </div>

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={!name.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
