import { useState } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text } from '@mantine/core';
import type { FormTheme } from '@/types';
import { ScopePicker } from './newForm/ScopePicker';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Where the form is going to be built, carrying what this step collected. */
  onContinue: (name: string, scope: NonNullable<FormTheme['scope']>) => void;
}

/**
 * The first step of creating a form: what it is called, and where it will live.
 *
 * A dialog rather than part of the create screen, because both answers are
 * needed before anything is described and neither is worth a page. Everything
 * after this — the prompt, the template picker, the config paste — happens on
 * the create screen itself.
 */
export function NewFormModal({ opened, onClose, onContinue }: Props) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<NonNullable<FormTheme['scope']>>('page');

  function reset() {
    setName('');
    setScope('page');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const chosen = scope;
    reset();
    onContinue(trimmed, chosen);
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create a new form"
      centered
      // A click on the backdrop is far more often a miss than an intent to
      // leave, and it would throw away a typed name. Escape and the explicit
      // buttons still close it.
      closeOnClickOutside={false}
      size="min(820px, 94vw)"
      radius="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="xl">
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
            <Text size="xs" c="dimmed" mb={10}>
              Changes what theming applies to later — the page background only matters for a
              standalone share link.
            </Text>
            <ScopePicker value={scope} onChange={setScope} />
          </div>

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" color="emerald" disabled={!name.trim()}>
              Continue
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
