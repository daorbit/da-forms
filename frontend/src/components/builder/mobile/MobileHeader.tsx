import { ActionIcon, Button } from '@mantine/core';
import { ChevronLeftIcon, EyeOffIcon, GlobeIcon } from 'lucide-react';
import { SaveStatus } from '@/pages/formBuilder/SaveStatus';
import classes from './mobileBuilder.module.css';

interface Props {
  name: string;
  live: boolean;
  isDemo: boolean;
  isDirty: boolean;
  hasSaved: boolean;
  saving: boolean;
  publishing: boolean;
  onBack: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
}

export function MobileHeader({ name, live, isDemo, isDirty, hasSaved, saving, publishing, onBack, onSave, onTogglePublish }: Props) {
  return (
    <header className={classes.header}>
      <ActionIcon variant="transparent" size="lg" className={classes.back} onClick={onBack} aria-label="Back to all forms">
        <ChevronLeftIcon size={24} strokeWidth={2.1} />
      </ActionIcon>
      <div className={classes.headerTitle}>
        <span className={classes.headerName}>{name || 'Untitled form'}</span>
        <span className={classes.headerStatus} data-live={live || undefined}>
          {isDemo ? 'Demo, not saved' : <SaveStatus saving={saving} isDirty={isDirty} hasSaved={hasSaved} />}
        </span>
      </div>
      {!isDemo && (
        <div className={classes.headerActions}>
          <Button
            size="xs"
            variant="default"
            className={classes.saveButton}
            onClick={onSave}
            loading={saving}
            disabled={!isDirty || publishing}
          >
            Save
          </Button>
          <ActionIcon
            className={classes.publishButton}
            variant={live ? 'default' : 'filled'}
            onClick={onTogglePublish}
            loading={publishing}
            disabled={saving}
            aria-label={live ? 'Unpublish' : 'Publish'}
          >
            {live ? <EyeOffIcon size={16} /> : <GlobeIcon size={16} />}
          </ActionIcon>
        </div>
      )}
    </header>
  );
}
