import type { ReactNode } from 'react';
import { ActionIcon } from '@mantine/core';
import { Trash2Icon } from 'lucide-react';
import classes from './RuleCardList.module.css';

interface Props {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}

export function RuleCard({ title, onRemove, children }: Props) {
  return (
    <div className={classes.card}>
      <div className={classes.cardHead}>
        <span className={classes.cardTitle}>{title}</span>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onRemove} aria-label={`Remove ${title}`}>
          <Trash2Icon size={14} />
        </ActionIcon>
      </div>
      {children}
    </div>
  );
}

export function RuleCardSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={classes.list}>
      <span className={classes.sectionLabel}>{label}</span>
      {children}
    </div>
  );
}
