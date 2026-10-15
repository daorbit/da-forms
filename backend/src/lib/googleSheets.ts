import { googleApi } from './googleOAuth.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
export const RESPONSES_TAB = 'Responses';
const MAX_CELL = 49_000;

export interface CreatedSpreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

function cell(value: string): string {
  return value.length > MAX_CELL ? `${value.slice(0, MAX_CELL)}…` : value;
}

function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export async function createSpreadsheet(accessToken: string, title: string, header: string[]): Promise<CreatedSpreadsheet> {
  const created = await googleApi<CreatedSpreadsheet>(SHEETS_API, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: RESPONSES_TAB, gridProperties: { frozenRowCount: 1 } } }],
    }),
  });
  await writeHeader(accessToken, created.spreadsheetId, header);
  return created;
}

export async function writeHeader(accessToken: string, spreadsheetId: string, header: string[]): Promise<void> {
  const range = `${RESPONSES_TAB}!A1:${columnLetter(header.length - 1)}1`;
  await googleApi(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    accessToken,
    { method: 'PUT', body: JSON.stringify({ values: [header.map(cell)] }) }
  );
}

export async function appendRow(accessToken: string, spreadsheetId: string, row: string[]): Promise<void> {
  const range = encodeURIComponent(`${RESPONSES_TAB}!A1`);
  await googleApi(
    `${SHEETS_API}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ values: [row.map(cell)] }) }
  );
}

export async function deleteSpreadsheet(accessToken: string, spreadsheetId: string): Promise<void> {
  await googleApi(`${DRIVE_FILES_API}/${spreadsheetId}`, accessToken, { method: 'DELETE' });
}
