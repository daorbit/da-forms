import { Switch } from '@mantine/core';
import { CheckIcon, FileSpreadsheetIcon, MinusIcon } from 'lucide-react';
import type { ImportColumn } from '@/lib/leadImport/importColumns';
import type { ParsedImport } from '@/lib/leadImport/leadWorkbook';
import { formatAnswer } from '../entriesTypes';
import classes from './ImportLeadsModal.module.css';

const PREVIEW_ROWS = 3;
const PREVIEW_COLS = 3;

interface Props {
  fileName: string;
  columns: ImportColumn[];
  parsed: ParsedImport;
  asTest: boolean;
  disabled: boolean;
  onAsTestChange: (value: boolean) => void;
}

export function ImportPreview({ fileName, columns, parsed, asTest, disabled, onAsTestChange }: Props) {
  const matched = new Set(parsed.matched.map((c) => c.field.id));
  const cols = parsed.matched.slice(0, PREVIEW_COLS);
  const notes = [
    parsed.truncated && 'Only the first 2,000 rows will be imported.',
    parsed.missingRequired > 0 &&
      `${parsed.missingRequired} ${parsed.missingRequired === 1 ? 'lead is' : 'leads are'} missing a required answer.`,
    parsed.unmatched.length > 0 &&
      `Skipped ${parsed.unmatched.length === 1 ? 'column' : 'columns'} not on this form: ${parsed.unmatched.join(', ')}.`,
  ].filter(Boolean) as string[];

  return (
    <div className={classes.review}>
      <div className={classes.summary}>
        <span className={classes.summaryIcon}>
          <FileSpreadsheetIcon size={18} strokeWidth={1.75} />
        </span>
        <div className={classes.summaryBody}>
          <span className={classes.summaryName}>{fileName}</span>
          <span className={classes.summaryMeta}>
            {parsed.matched.length} of {columns.length} columns found
          </span>
        </div>
        <div className={classes.summaryCount}>
          <span className={classes.summaryNum}>{parsed.rows.length.toLocaleString()}</span>
          <span className={classes.summaryUnit}>{parsed.rows.length === 1 ? 'lead' : 'leads'}</span>
        </div>
      </div>

      <div className={classes.block}>
        <span className={classes.blockTitle}>Columns</span>
        <ul className={classes.mapList}>
          {columns.map((column) => {
            const found = matched.has(column.field.id);
            return (
              <li key={column.field.id} className={classes.mapItem} data-found={found || undefined}>
                <span className={classes.mapMark}>{found ? <CheckIcon size={12} /> : <MinusIcon size={12} />}</span>
                <span className={classes.mapName}>{column.header}</span>
                <span className={classes.mapState}>{found ? 'Found' : 'Not in file'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={classes.block}>
        <span className={classes.blockTitle}>Preview</span>
        <div className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                {cols.map((column) => (
                  <th key={column.field.id}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                <tr key={i}>
                  {cols.map((column) => (
                    <td key={column.field.id}>{formatAnswer(column.field.type, row[column.field.id] ?? '') || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {notes.map((note) => (
          <span key={note} className={classes.note}>
            {note}
          </span>
        ))}
      </div>

      <label className={classes.option}>
        <span className={classes.optionBody}>
          <span className={classes.optionTitle}>Mark as test leads</span>
          <span className={classes.optionText}>Tags them “test” so you can filter or delete them later.</span>
        </span>
        <Switch checked={asTest} onChange={(e) => onAsTestChange(e.currentTarget.checked)} disabled={disabled} />
      </label>
    </div>
  );
}
