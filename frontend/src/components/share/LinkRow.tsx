import type { ReactNode } from 'react';
import { ActionIcon, CopyButton, Text, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';
import classes from './PublishedDialog.module.css';

interface Props {
  icon: ReactNode;
  label: string;
  hint: string;
  url: string;
  openUrl?: string;
}

export function LinkRow({ icon, label, hint, url, openUrl }: Props) {
  return (
    <div className={classes.linkRow}>
      <div className={classes.linkHead}>
        <span className={classes.linkIcon}>{icon}</span>
        <div className={classes.linkText}>
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Text size="xs" c="dimmed">
            {hint}
          </Text>
        </div>
      </div>
      <div className={classes.linkField}>
        <input
          className={classes.linkInput}
          value={url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          aria-label={label}
        />
        <CopyButton value={url} timeout={1600}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
              <ActionIcon variant="subtle" color="gray" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
                {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Tooltip label={openUrl ? 'Open preview' : 'Open in new tab'} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            component="a"
            href={openUrl ?? url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${label.toLowerCase()}`}
          >
            <ExternalLinkIcon size={15} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}
