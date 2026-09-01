import { IconEye } from '@tabler/icons-react';
import { FileIcon, defaultStyles, type DefaultExtensionType } from 'react-file-icon';

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

 
export function FileTypeIcon({
  fileName,
  size = 22,
  previewable = false,
}: {
  fileName: string;
  size?: number;
  previewable?: boolean;
}) {
  const ext = extensionOf(fileName);
  const style = defaultStyles[ext as DefaultExtensionType];
  return (
    <span
      className={previewable ? 'fileTypeIcon fileTypeIcon--previewable' : 'fileTypeIcon'}
      style={{ display: 'inline-flex', position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <FileIcon extension={ext} {...style} />
      {previewable && (
        <span className="fileTypeIcon-hoverEye">
          <IconEye size={Math.round(size * 0.5)} color="#fff" />
        </span>
      )}
    </span>
  );
}
