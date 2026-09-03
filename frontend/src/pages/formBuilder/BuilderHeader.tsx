import { AppShell, Group, Button, ThemeIcon, ActionIcon, Tooltip, Text, Skeleton, Burger, Badge, Divider } from '@mantine/core';
import {
  IconFileText,
  IconEye,
  IconEyeOff,
  IconWorld,
  IconArrowLeft,
  IconArrowBackUp,
  IconArrowForwardUp,
} from '@tabler/icons-react';
import type { Form } from '@/types';
import classes from '../FormBuilderPage.module.css';

interface Props {
  name: string;
  savedForm: Form | null;
  isDirty: boolean;
  isDemo: boolean;
  embedded: boolean;
  loadingForm: boolean;
  navOpened: boolean;
  onToggleNav: () => void;
  onBack: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onPreview: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  saving: boolean;
  publishing: boolean;
}

export function BuilderHeader({
  name,
  savedForm,
  isDirty,
  isDemo,
  embedded,
  loadingForm,
  navOpened,
  onToggleNav,
  onBack,
  undo,
  redo,
  canUndo,
  canRedo,
  onPreview,
  onSave,
  onTogglePublish,
  saving,
  publishing,
}: Props) {
  // `loadingForm` is threaded through only so a future skeleton header can use
  // it; the current header renders the same either way.
  void loadingForm;

  return (
    <AppShell.Header>
      <Group h="100%" px="sm" gap="sm" justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          <Burger opened={navOpened} onClick={onToggleNav} hiddenFrom="sm" size="sm" />
          <Tooltip label="Back to all forms" position="bottom" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label="Back to all forms"
              onClick={onBack}
            >
              <IconArrowLeft size={19} />
            </ActionIcon>
          </Tooltip>
          {/* The app icon is the host's job when embedded. */}
          {!embedded && (
            <ThemeIcon variant="light" color="gray" radius="sm">
              <IconFileText size={18} />
            </ThemeIcon>
          )}
          {/* Read-only here — the name is set at creation and renamed from
              the Entries page, not the editor. */}
          <Text fw={600} size="sm" className={classes.nameText}>
            {name}
          </Text>
          {/* Publish state belongs next to the name it describes, not inferred
              from which way the button in the corner is pointing. */}
          {savedForm && (
            <Badge
              variant={savedForm.status === 'published' ? 'filled' : 'light'}
              color={savedForm.status === 'published' ? 'emerald' : 'gray'}
              radius="sm"
              size="sm"
              visibleFrom="sm"
              className={classes.statusBadge}
              leftSection={
                savedForm.status === 'published' ? <span className={classes.liveDot} /> : undefined
              }
            >
              {savedForm.status === 'published' ? 'Live' : 'Draft'}
            </Badge>
          )}
          {isDirty && (
            <Text size="xs" c="dimmed" visibleFrom="sm">
              Unsaved
            </Text>
          )}
        </Group>
        <Group gap={6} wrap="nowrap">
          {/* History and preview are inspection tools; save and publish change
              the form. The divider keeps a mis-aimed click from crossing that
              line. */}
          <Group gap={2} wrap="nowrap" className={classes.historyGroup}>
            <Tooltip label="Undo (Ctrl+Z)" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                aria-label="Undo"
                disabled={!canUndo}
                onClick={undo}
              >
                <IconArrowBackUp size={17} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Redo (Ctrl+Y)" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                aria-label="Redo"
                disabled={!canRedo}
                onClick={redo}
              >
                <IconArrowForwardUp size={17} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Tooltip label="Preview" position="bottom" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label="Preview"
              onClick={onPreview}
            >
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
          <Divider orientation="vertical" my={14} />
          {isDemo ? (
            // Nothing here can be saved, so the editor says so once instead
            // of offering two buttons that would both be refused.
            <Badge color="gray" variant="light" radius="sm" size="lg">
              Demo — changes are not saved
            </Badge>
          ) : (
            <>
              {/* Colours are pinned rather than left to the theme: this editor
                  runs inside the Quantalog shell, whose palette rendered both of
                  these as near-invisible text. Save is the primary action, so it
                  is the filled green one; publish/unpublish is outlined so the
                  two read as a pair without competing. */}
              <Button
                variant="filled"
                radius="md"
                size="sm"
                className={classes.saveBtn}
                onClick={onSave}
                loading={saving}
                disabled={!isDirty || publishing}
              >
                Save
              </Button>
              <Button
                variant="outline"
                radius="md"
                size="sm"
                className={classes.publishBtn}
                leftSection={
                  savedForm?.status === 'published' ? (
                    <IconEyeOff size={16} />
                  ) : (
                    <IconWorld size={16} />
                  )
                }
                onClick={onTogglePublish}
                loading={publishing}
                disabled={saving}
              >
                {savedForm?.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
            </>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
