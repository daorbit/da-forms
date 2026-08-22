import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, Group, TextInput, Button, ScrollArea, Box, ThemeIcon } from '@mantine/core';
import { IconFileText, IconEye } from '@tabler/icons-react';
import { createForm } from '@/lib/api';
import type { FormField, FieldType } from '@/types';
import { makeField } from '@/lib/fieldPalette';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { FieldSettings } from '@/components/builder/FieldSettings';
import { FormSettings } from '@/components/builder/FormSettings';

export function NewFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled form');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addField(type: FieldType) {
    const field = makeField(type);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateField(id: string) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: crypto.randomUUID() };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }

  async function handleSave() {
    setSaving(true);
    const form = await createForm({ title, description, fields });
    navigate(`/forms/${form._id}`);
  }

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
      aside={{ width: 320, breakpoint: 'sm' }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
            <ThemeIcon variant="light" color="blue" radius="sm">
              <IconFileText size={18} />
            </ThemeIcon>
            <TextInput
              variant="unstyled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fw={600}
              size="md"
              style={{ flex: 1, maxWidth: 400 }}
            />
          </Group>
          <Group gap="xs">
            <Button variant="default" radius="md" leftSection={<IconEye size={16} />}>
              Preview
            </Button>
            <Button color="teal" radius="md" onClick={handleSave} loading={saving}>
              Access Form
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <ScrollArea h="100%">
          <FieldPalette onAdd={addField} />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box h="calc(100vh - 60px)" style={{ overflowY: 'auto' }}>
          <FormCanvas
            title={title}
            description={description}
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={removeField}
            onDuplicate={duplicateField}
          />
        </Box>
      </AppShell.Main>

      <AppShell.Aside>
        <ScrollArea h="100%">
          {selectedField ? (
            <FieldSettings field={selectedField} onChange={updateField} />
          ) : (
            <FormSettings
              description={description}
              onDescriptionChange={setDescription}
            />
          )}
        </ScrollArea>
      </AppShell.Aside>
    </AppShell>
  );
}
