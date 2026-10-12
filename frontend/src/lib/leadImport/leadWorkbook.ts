import type { CellValue, Workbook } from 'exceljs';
import { columnHint, hasDropdown, MAX_IMPORT_ROWS, normalizeValue, type ImportColumn } from './importColumns';
import { sampleRows } from './sampleLeads';

const SHEET = 'Leads';
const VALIDATED_ROWS = 1000;

export interface ParsedImport {
  rows: Record<string, string>[];
  matched: ImportColumn[];
  unmatched: string[];
  missingRequired: number;
  truncated: boolean;
}

async function newWorkbook(): Promise<Workbook> {
  const mod = await import('exceljs');
  const lib = (mod as unknown as { default?: typeof mod }).default ?? mod;
  return new lib.Workbook();
}

function headerOf(column: ImportColumn): string {
  return column.required ? `${column.header} *` : column.header;
}

function cleanHeader(text: string): string {
  return text.replace(/\*+\s*$/, '').trim().toLowerCase();
}

function fileSafe(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'form';
}

function download(buffer: BlobPart, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function headerFill(column: ImportColumn): string {
  if (column.meta) return 'FFEEF2FF';
  return column.required ? 'FFDDF3F0' : 'FFF1F3F5';
}

export async function downloadTemplate(formName: string, columns: ImportColumn[], withSamples: boolean) {
  const workbook = await newWorkbook();
  const sheet = workbook.addWorksheet(SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });

  sheet.columns = columns.map((column) => ({
    header: headerOf(column),
    key: column.id,
    width: Math.min(40, Math.max(16, column.header.length + 6)),
  }));

  const head = sheet.getRow(1);
  head.height = 22;
  head.eachCell((cell, index) => {
    const column = columns[index - 1];
    cell.font = { bold: true, color: { argb: 'FF1A1B1E' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill(column) } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCED4DA' } } };
    cell.note = columnHint(column);
  });

  if (withSamples) sheet.addRows(sampleRows(columns));

  columns.forEach((column, index) => {
    const options = column.options ?? [];
    const list = options.join(',');
    if (!hasDropdown(column) || list.length > 250 || options.some((o) => o.includes(','))) return;
    for (let r = 2; r <= VALIDATED_ROWS; r++) {
      sheet.getCell(r, index + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${list.replace(/"/g, '""')}"`],
        showErrorMessage: true,
        errorTitle: 'Pick an option',
        error: `Choose one of: ${options.join(', ')}`,
      };
    }
  });

  const guide = workbook.addWorksheet('How to fill');
  guide.columns = [
    { header: 'Column', key: 'column', width: 30 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Required', key: 'required', width: 12 },
    { header: 'Format', key: 'format', width: 44 },
    { header: 'Options', key: 'options', width: 60 },
  ];
  guide.getRow(1).font = { bold: true };
  for (const column of columns) {
    guide.addRow({
      column: column.header,
      type: column.meta ? 'Lead details' : 'Form question',
      required: column.required ? 'Yes' : 'No',
      format: columnHint(column),
      options: (column.options ?? []).join(', '),
    });
  }
  guide.addRow({});
  guide.addRow({ column: `Fill the "${SHEET}" sheet, one lead per row. Keep the header row as it is.` });
  guide.addRow({ column: `Up to ${MAX_IMPORT_ROWS} rows per file. Columns marked * are required.` });
  guide.addRow({ column: 'Lead details columns are optional. Leave them empty to use the defaults.' });

  const buffer = await workbook.xlsx.writeBuffer();
  download(buffer as unknown as BlobPart, `${fileSafe(formName)} - ${withSamples ? 'sample leads' : 'import template'}.xlsx`);
}

function cellText(value: CellValue): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  if ('result' in value) return value.result instanceof Date ? value.result : (value.result ?? '');
  if ('text' in value) return value.text;
  return '';
}

export async function parseLeadFile(file: File, columns: ImportColumn[]): Promise<ParsedImport> {
  const workbook = await newWorkbook();
  await workbook.xlsx.load((await file.arrayBuffer()) as unknown as Parameters<Workbook['xlsx']['load']>[0]);
  const sheet = workbook.getWorksheet(SHEET) ?? workbook.worksheets[0];
  if (!sheet) return { rows: [], matched: [], unmatched: [], missingRequired: 0, truncated: false };

  const byHeader = new Map<string, ImportColumn>();
  for (const column of columns) byHeader.set(column.header.toLowerCase(), column);
  for (const column of columns) {
    const label = (column.field?.label ?? '').trim().toLowerCase();
    if (label && !byHeader.has(label)) byHeader.set(label, column);
  }

  const positions: { index: number; column: ImportColumn }[] = [];
  const unmatched: string[] = [];
  sheet.getRow(1).eachCell((cell, index) => {
    const text = String(cellText(cell.value) ?? '').trim();
    if (!text) return;
    const column = byHeader.get(cleanHeader(text));
    if (column && !positions.some((p) => p.column === column)) positions.push({ index, column });
    else unmatched.push(text);
  });

  const rows: Record<string, string>[] = [];
  let missingRequired = 0;
  let truncated = false;

  const lastRow = Math.min(sheet.rowCount, MAX_IMPORT_ROWS * 5 + 1);
  for (let r = 2; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    const data: Record<string, string> = {};
    for (const { index, column } of positions) {
      const value = normalizeValue(column, cellText(row.getCell(index).value));
      if (value) data[column.id] = value;
    }
    if (!positions.some(({ column }) => !column.meta && data[column.id])) continue;
    if (rows.length >= MAX_IMPORT_ROWS) {
      truncated = true;
      break;
    }
    if (positions.some(({ column }) => column.required && !data[column.id])) missingRequired++;
    rows.push(data);
  }

  return { rows, matched: positions.map((p) => p.column), unmatched, missingRequired, truncated };
}
