import type { ReactNode } from 'react';
import { Text, Title } from '@mantine/core';
import classes from './PageHeader.module.css';

/**
 * Quantalog's page header: a large title, one dimmed line under it, actions on
 * the right. Kept identical to the host app's `PageHeader` so a page opened
 * inside Quantalog reads as one of its own.
 */
export function PageHeader({
  title,
  description,
  actions,
  leading,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Sits left of the title — a back button on a detail page. */
  leading?: ReactNode;
}) {
  return (
    <div className={classes.root}>
      <div className={classes.row}>
        <div className={classes.main}>
          {leading}
          <div className={classes.text}>
            <Title order={1} fz={24} lh={1.25} className={classes.title}>
              {title}
            </Title>
            {description && (
              <Text c="dimmed" size="sm" mt={4}>
                {description}
              </Text>
            )}
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    </div>
  );
}
