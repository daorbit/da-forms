import { ActionIcon, Menu } from '@mantine/core';
import { DownloadIcon, EllipsisIcon, PaperclipIcon, UploadIcon } from 'lucide-react';

interface Props {
  onImport?: () => void;
  onExportCsv: () => void;
  onOpenFiles?: () => void;
}

export function EntriesMoreMenu({ onImport, onExportCsv, onOpenFiles }: Props) {
  return (
    <Menu position="bottom-end" width={220} radius="md" shadow="md" offset={6}>
      <Menu.Target>
        <ActionIcon variant="default" size={36} radius="md" aria-label="More actions">
          <EllipsisIcon size={17} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {onImport && (
          <Menu.Item leftSection={<UploadIcon size={15} />} onClick={onImport}>
            Import leads
          </Menu.Item>
        )}
        <Menu.Item leftSection={<DownloadIcon size={15} />} onClick={onExportCsv}>
          Export CSV
        </Menu.Item>
        {onOpenFiles && (
          <>
            <Menu.Divider />
            <Menu.Item leftSection={<PaperclipIcon size={15} />} onClick={onOpenFiles}>
              Uploaded files
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
