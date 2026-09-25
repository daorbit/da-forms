import type { ReactNode } from 'react';
import { Switch } from '@mantine/core';
import classes from './settings.module.css';

export function SettingsStack({ children }: { children: ReactNode }) {
  return <div className={classes.stack}>{children}</div>;
}

export function SettingsGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={classes.group}>
      <div className={classes.groupHead}>
        <div className={classes.groupTitle}>{title}</div>
        {hint && <div className={classes.groupHint}>{hint}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function SettingRow({
  label,
  hint,
  stacked = false,
  children,
}: {
  label?: string;
  hint?: ReactNode;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={classes.row} data-stacked={stacked || undefined}>
      {(label || hint) && (
        <div className={classes.rowText}>
          {label && <div className={classes.rowLabel}>{label}</div>}
          {hint && <div className={classes.rowHint}>{hint}</div>}
        </div>
      )}
      <div className={stacked ? undefined : classes.rowControl}>{children}</div>
    </div>
  );
}

export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        disabled={disabled}
        aria-label={label}
      />
    </SettingRow>
  );
}
