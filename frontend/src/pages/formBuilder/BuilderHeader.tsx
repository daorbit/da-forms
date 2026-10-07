import { AppShell, Group, Button, ActionIcon, Tooltip, Burger, Badge, Divider, TextInput } from '@mantine/core';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, GlobeIcon, KeyboardIcon, Redo2Icon, Undo2Icon } from 'lucide-react';
import { DocsButton } from '@/components/ui/DocsButton';
import { DOCS } from '@/lib/docs';
import { MOD } from '@/lib/builderShortcuts';
import type { Form } from '@/types';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { SaveStatus } from './SaveStatus';
import classes from '../FormBuilderPage.module.css';

interface Props {
  name: string;
  onRename: (name: string) => void;
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
  onOpenShortcuts: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  saving: boolean;
  publishing: boolean;
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} position="bottom" withArrow>
      <ActionIcon variant="subtle" color="gray" size="lg" aria-label={label} disabled={disabled} onClick={onClick}>
        {children}
      </ActionIcon>
    </Tooltip>
  );
}

export function BuilderHeader({
  name,
  onRename,
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
  onOpenShortcuts,
  onSave,
  onTogglePublish,
  saving,
  publishing,
}: Props) {
  const live = savedForm?.status === 'published';

  return (
    <AppShell.Header className={classes.header}>
      <Group h="100%" px="sm" gap="sm" justify="space-between" wrap="nowrap">
        <Group gap={6} wrap="nowrap" className={classes.headerLeft}>
          <Burger opened={navOpened} onClick={onToggleNav} hiddenFrom="sm" size="sm" />
          <IconButton label="Back to all forms" onClick={onBack}>
            <ArrowLeftIcon size={18} />
          </IconButton>
          <Divider orientation="vertical" my={14} visibleFrom="sm" />
          <TextInput
            className={classes.nameInput}
            value={name}
            onChange={(e) => onRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
            }}
            placeholder="Untitled form"
            aria-label="Form name"
            size="sm"
            disabled={loadingForm || isDemo}
          />
          {savedForm && (
            <span className={classes.statusPill} data-live={live || undefined}>
              <span className={classes.liveDot} />
              {live ? 'Live' : 'Draft'}
            </span>
          )}
          {!isDemo && (
            <span className={classes.saveStatusWrap}>
              <SaveStatus saving={saving} isDirty={isDirty} hasSaved={Boolean(savedForm)} />
            </span>
          )}
        </Group>

        <Group gap={6} wrap="nowrap">
          <Group gap={2} wrap="nowrap" className={classes.historyGroup}>
            <Tooltip label={`Undo (${MOD}+Z)`} position="bottom" withArrow>
              <ActionIcon variant="subtle" color="gray" size="md" aria-label="Undo" disabled={!canUndo} onClick={undo}>
                <Undo2Icon size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={`Redo (${MOD}+Shift+Z)`} position="bottom" withArrow>
              <ActionIcon variant="subtle" color="gray" size="md" aria-label="Redo" disabled={!canRedo} onClick={redo}>
                <Redo2Icon size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <IconButton label={`Preview (${MOD}+Shift+P)`} onClick={onPreview}>
            <EyeIcon size={18} />
          </IconButton>
          <span className={classes.desktopOnly}>
            <IconButton label="Keyboard shortcuts (?)" onClick={onOpenShortcuts}>
              <KeyboardIcon size={18} />
            </IconButton>
          </span>
          <DocsButton path={DOCS.forms} visibleFrom="sm" />
          <Divider orientation="vertical" my={14} />
          {isDemo ? (
            <Badge color="gray" variant="light" radius="sm" size="lg">
              Demo — changes are not saved
            </Badge>
          ) : (
            <>
              <Button
                radius="xl"
                size="sm"
                className={live ? classes.primaryBtn : classes.secondaryBtn}
                onClick={onSave}
                loading={saving}
                disabled={!isDirty || publishing}
              >
                {live ? 'Save changes' : 'Save'}
              </Button>
              <Button
                radius="xl"
                size="sm"
                className={live ? classes.secondaryBtn : classes.primaryBtn}
                leftSection={live ? <EyeOffIcon size={15} /> : <GlobeIcon size={15} />}
                onClick={onTogglePublish}
                loading={publishing}
                disabled={saving}
              >
                {live ? 'Unpublish' : 'Publish'}
              </Button>
            </>
          )}
          {embedded && <HostNotificationsBell variant="subtle" iconSize={18} />}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
