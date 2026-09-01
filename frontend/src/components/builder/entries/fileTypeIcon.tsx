import { FileIcon, defaultStyles, type DefaultExtensionType } from 'react-file-icon';

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/**
 * The real branded file glyph (folded corner + coloured PDF/DOC/XLS label),
 * not a generic outline icon — tabler has one shape for every non-image
 * file, which made a PDF and a spreadsheet look identical apart from the
 * filename text next to them.
 */
export function FileTypeIcon({ fileName, size = 22 }: { fileName: string; size?: number }) {
  const ext = extensionOf(fileName);
  const style = defaultStyles[ext as DefaultExtensionType];
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      <FileIcon extension={ext} {...style} />
    </span>
  );
}
