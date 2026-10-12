import { Switch } from '@mantine/core';
import { CheckIcon, FileSpreadsheetIcon, MinusIcon } from 'lucide-react';
import type { ImportColumn } from '@/lib/leadImport/importColumns';
import type { ParsedImport } from '@/lib/leadImport/leadWorkbook';
import type { SubmissionStage } from '@/types';
import { STAGE_BY_ID } from '@/lib/stages';
import { formatAnswer, formatDateTime } from '../entriesTypes';
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

function previewText(column: ImportColumn, value: string): string {
  if (!value) return '';
  if (column.meta === 'stage') return STAGE_BY_ID[value as SubmissionStage]?.label ?? value;
  if (column.meta === 'submittedAt') return formatDateTime(value);
  if (column.meta) return value;
  return formatAnswer(column.field!.type, value);
}

function ColumnStatus({
  title,
  columns,
  matched,
  optional,
}: {
  title: string;
  columns: ImportColumn[];
  matched: Set<string>;
  optional?: boolean;
}) {
  if (!columns.length) return null;
  return (
    <div className={classes.block}>
      <span className={classes.blockTitle}>
        {title}
        {optional && <span className={classes.blockHint}>Optional</span>}
      </span>
      <ul className={classes.mapList}>
        {columns.map((column) => {
          const found = matched.has(column.id);
          return (
            <li key={column.id} className={classes.mapItem} data-found={found || undefined}>
              <span className={classes.mapMark}>{found ? <CheckIcon size={12} /> : <MinusIcon size={12} />}</span>
              <span className={classes.mapName}>{column.header}</span>
              <span className={classes.mapState}>{found ? 'Found' : optional ? 'Not used' : 'Not in file'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ImportPreview({ fileName, columns, parsed, asTest, disabled, onAsTestChange }: Props) {
  const matched = new Set(parsed.matched.map((c) => c.id));
  const cols = [...parsed.matched.filter((c) => !c.meta), ...parsed.matched.filter((c) => c.meta)].slice(0, PREVIEW_COLS);
  const questions = columns.filter((c) => !c.meta);
  const details = columns.filter((c) => c.meta);
  const foundQuestions = questions.filter((c) => matched.has(c.id)).length;
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
            {foundQuestions} of {questions.length} questions found
          </span>
        </div>
        <div className={classes.summaryCount}>
          <span className={classes.summaryNum}>{parsed.rows.length.toLocaleString()}</span>
          <span className={classes.summaryUnit}>{parsed.rows.length === 1 ? 'lead' : 'leads'}</span>
        </div>
      </div>

      <ColumnStatus title="Form questions" columns={questions} matched={matched} />
      <ColumnStatus title="Lead details" columns={details} matched={matched} optional />

      <div className={classes.block}>
        <span className={classes.blockTitle}>Preview</span>
        <div className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                {cols.map((column) => (
                  <th key={column.id}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                <tr key={i}>
                  {cols.map((column) => (
                    <td key={column.id}>{previewText(column, row[column.id] ?? '') || '—'}</td>
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
