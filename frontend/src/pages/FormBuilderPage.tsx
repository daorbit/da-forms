import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AppShell, Group, TextInput, Button, ThemeIcon } from '@mantine/core';
import { IconFileText, IconEye } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { createForm, getForm, updateForm } from '@/lib/api';
import type { Form, FormField, FieldType } from '@/types';
import { ShareModal } from '@/components/share/ShareModal';
import { makeField } from '@/lib/fieldPalette';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { FormSettings } from '@/components/builder/FormSettings';
import { PropertiesDrawer } from '@/components/builder/PropertiesDrawer';
import { IconRail, type RailPanel } from '@/components/builder/IconRail';
import { ThankYouDrawer } from '@/components/builder/ThankYouDrawer';
import classes from './FormBuilderPage.module.css';

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const initialTitle = (location.state as { title?: string } | null)?.title ?? 'Untitled form';
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [railPanel, setRailPanel] = useState<RailPanel | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState(
    'Thanks! Your response has been recorded.'
  );
  const [redirectUrl, setRedirectUrl] = useState('');
  const [savedFormId, setSavedFormId] = useState<string | null>(routeFormId ?? null);
  const [savedForm, setSavedForm] = useState<Form | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routeFormId) return;
    getForm(routeFormId).then((form) => {
      setSavedForm(form);
      setTitle(form.title);
      setDescription(form.description ?? '');
      setFields(form.fields);
      setRedirectUrl(form.redirectUrl ?? '');
      if (form.thankYouMessage) setThankYouMessage(form.thankYouMessage);
    });
  }, [routeFormId]);

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
    const payload = { title, description, fields, redirectUrl, thankYouMessage };
    const form = savedFormId
      ? await updateForm(savedFormId, payload)
      : await createForm(payload);
    setSaving(false);
    setSavedFormId(form._id);
    setSavedForm(form);
    notifications.show({ message: 'Form saved', color: 'teal' });
    if (!savedFormId) setShareOpen(true);
  }

  function handleRailSelect(panel: RailPanel) {
    if (panel !== 'embed') {
      setRailPanel(panel);
      return;
    }
    if (!savedFormId) {
      notifications.show({ message: 'Save the form first to get its embed code', color: 'yellow' });
      return;
    }
    setShareOpen(true);
  }

  const editingField = fields.find((f) => f.id === editingId) ?? null;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
      aside={{ width: 52, breakpoint: 'sm' }}
      padding={0}
      classNames={{ main: classes.main }}
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
              {savedFormId ? 'Save' : 'Access Form'}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <FieldPalette onAdd={addField} />
      </AppShell.Navbar>

      <AppShell.Main>
        <FormCanvas
          title={title}
          description={description}
          fields={fields}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={removeField}
          onDuplicate={duplicateField}
          onOpenProperties={setEditingId}
          onOpenFormSettings={() => setFormSettingsOpen(true)}
        />
      </AppShell.Main>

      <PropertiesDrawer field={editingField} onClose={() => setEditingId(null)} onSave={updateField} />

      <FormSettings
        opened={formSettingsOpen}
        onClose={() => setFormSettingsOpen(false)}
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />

      <AppShell.Aside>
        <IconRail active={railPanel} onSelect={handleRailSelect} />
      </AppShell.Aside>

      <ThankYouDrawer
        opened={railPanel === 'thankYou'}
        onClose={() => setRailPanel(null)}
        thankYouMessage={thankYouMessage}
        redirectUrl={redirectUrl}
        onThankYouChange={setThankYouMessage}
        onRedirectChange={setRedirectUrl}
      />

      {savedForm && (
        <ShareModal
          opened={shareOpen}
          onClose={() => setShareOpen(false)}
          form={savedForm}
          onStatusChange={(status) => setSavedForm({ ...savedForm, status })}
        />
      )}
    </AppShell>
  );
}
