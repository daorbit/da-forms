import { ActionIcon, Tooltip } from '@mantine/core';
import { DownloadIcon } from 'lucide-react';

interface Props {
  onExport: () => void;
  disabled?: boolean;
  hint?: string;
}

export function ExportButton({ onExport, disabled, hint = 'Export CSV' }: Props) {
  return (
    <Tooltip label={hint} withArrow>
      <ActionIcon variant="default" size={36} radius="md" onClick={onExport} disabled={disabled} aria-label={hint}>
        <DownloadIcon size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
