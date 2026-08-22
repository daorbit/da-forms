import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function NewFormModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [name, setName] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = name.trim();
    if (!title) return;
    navigate(`/${workspaceId}/forms/new`, { state: { title } });
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
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="emerald" radius="xl" disabled={!name.trim()}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
