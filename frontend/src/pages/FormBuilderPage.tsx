import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { AppShell, Group, TextInput, Button, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { IconFileText, IconEye, IconArrowLeft } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { createForm, getForm, updateForm } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { Form, FormField, FieldType } from '@/types';
import { ShareModal } from '@/components/share/ShareModal';
import { makeField } from '@/lib/fieldPalette';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { FormSettings } from '@/components/builder/FormSettings';
import { PropertiesDrawer } from '@/components/builder/PropertiesDrawer';
import { IconRail, type RailPanel } from '@/components/builder/IconRail';
import { ThankYouDrawer } from '@/components/builder/ThankYouDrawer';
import { PreviewModal } from '@/components/builder/PreviewModal';
import classes from './FormBuilderPage.module.css';

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const workspaceId = useWorkspaceId();
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
  const [hideHeader, setHideHeader] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(routeFormId ?? null);
  const [savedForm, setSavedForm] = useState<Form | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!routeFormId) return;
    getForm(routeFormId, workspaceId).then((form) => {
      setSavedForm(form);
      setTitle(form.title);
      setDescription(form.description ?? '');
      setFields(form.fields);
      setRedirectUrl(form.redirectUrl ?? '');
      setHideHeader(form.hideHeader ?? false);
      if (form.thankYouMessage) setThankYouMessage(form.thankYouMessage);
    });
  }, [routeFormId, workspaceId]);

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
    const payload = { title, description, fields, redirectUrl, thankYouMessage, hideHeader };
    const form = savedFormId
      ? await updateForm(savedFormId, payload, workspaceId)
      : await createForm(payload, workspaceId);
    setSaving(false);
    setSavedFormId(form._id);
    setSavedForm(form);
    notifications.show({ message: 'Form saved', color: 'emerald' });
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
            <Tooltip label="Back to all forms" position="bottom" withArrow>
              <ActionIcon
                component={Link}
                to={`/${workspaceId}/forms`}
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Back to all forms"
              >
                <IconArrowLeft size={19} />
              </ActionIcon>
            </Tooltip>
            <ThemeIcon variant="light" color="gray" radius="sm">
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
            <Button
              variant="default"
              radius="md"
              leftSection={<IconEye size={16} />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button color="emerald" radius="md" onClick={handleSave} loading={saving}>
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
          hideHeader={hideHeader}
          onHideHeader={() => setHideHeader(true)}
          offsetRight={!!editingId}
        />
      </AppShell.Main>

      <PropertiesDrawer field={editingField} onClose={() => setEditingId(null)} onChange={updateField} />

      <FormSettings
        opened={formSettingsOpen}
        onClose={() => setFormSettingsOpen(false)}
        title={title}
        description={description}
        hideHeader={hideHeader}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onHideHeaderChange={setHideHeader}
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

      <PreviewModal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        fields={fields}
        hideHeader={hideHeader}
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
