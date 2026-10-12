import { useMemo } from 'react';
import { Button, Menu } from '@mantine/core';
import { ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon, UsersIcon } from 'lucide-react';
import { columnHint, type ImportColumn } from '@/lib/leadImport/importColumns';
import { sampleRows } from '@/lib/leadImport/sampleLeads';
import classes from './ImportLeadsModal.module.css';

const PREVIEW_ROWS = 2;

interface Props {
  columns: ImportColumn[];
  busy: boolean;
  onDownload: (withSamples: boolean) => void;
}

function letter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function ImportTemplateStep({ columns, busy, onDownload }: Props) {
  const samples = useMemo(() => sampleRows(columns, PREVIEW_ROWS), [columns]);
  const questions = columns.filter((column) => !column.meta).length;

  return (
    <section className={classes.help}>
      <div className={classes.helpHead}>
        <div className={classes.helpTitles}>
          <span className={classes.helpTitle}>Template</span>
          <span className={classes.helpMeta}>
            {questions} {questions === 1 ? 'question' : 'questions'} · {columns.length - questions} lead details ·{' '}
            <span className={classes.required}>*</span> required
          </span>
        </div>

        <Menu position="bottom-end" width={250} radius="md" shadow="md" offset={6}>
          <Menu.Target>
            <Button
              variant="default"
              size="xs"
              radius="md"
              loading={busy}
              leftSection={<DownloadIcon size={14} />}
              rightSection={<ChevronDownIcon size={13} />}
              className={classes.downloadButton}
            >
              Download
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<FileSpreadsheetIcon size={16} />}
              onClick={() => onDownload(false)}
              className={classes.menuItem}
            >
              <span className={classes.menuTitle}>Blank template</span>
              <span className={classes.menuText}>Headers only, ready for your leads</span>
            </Menu.Item>
            <Menu.Item
              leftSection={<UsersIcon size={16} />}
              onClick={() => onDownload(true)}
              className={classes.menuItem}
            >
              <span className={classes.menuTitle}>With sample leads</span>
              <span className={classes.menuText}>5 test leads to try the import</span>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      <div className={classes.sheetWrap}>
        <table className={classes.sheet}>
          <thead>
            <tr>
              <th className={classes.sheetCorner} />
              {columns.map((column, i) => (
                <th key={column.id} className={classes.sheetLetter}>
                  {letter(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={classes.sheetRowNum}>1</td>
              {columns.map((column) => (
                <td key={column.id} className={classes.sheetHeader} data-meta={column.meta ? true : undefined}>
                  <span className={classes.sheetHeaderName}>
                    {column.header}
                    {column.required && <span className={classes.required}> *</span>}
                  </span>
                  <span className={classes.sheetHint}>{columnHint(column)}</span>
                </td>
              ))}
            </tr>
            {samples.map((row, r) => (
              <tr key={r}>
                <td className={classes.sheetRowNum}>{r + 2}</td>
                {row.map((value, c) => (
                  <td key={columns[c].id} className={classes.sheetCell}>
                    {value || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
