import { withAuth, gapiReady } from './auth.js';

/**
 * Read all rows from a sheet tab, returning an array of objects.
 */
export async function readRows(spreadsheetId, sheetName) {
  await gapiReady;
  return withAuth(async () => {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });
    const [headers, ...rows] = response.result.values || [];
    if (!headers) return [];
    return rows
      .filter(row => row.some(cell => cell && cell.trim()))
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
        return obj;
      });
  });
}

/**
 * Read just the header row.
 */
export async function readHeaders(spreadsheetId, sheetName) {
  await gapiReady;
  return withAuth(async () => {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    return (response.result.values?.[0] || []).map(h => h.trim());
  });
}

/**
 * Append a single row to the sheet.
 */
export async function appendRow(spreadsheetId, sheetName, headers, data) {
  await gapiReady;
  return withAuth(async () => {
    const rowValues = headers.map(h => data[h] ?? '');
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [rowValues] },
    });
  });
}

/**
 * Extract spreadsheet ID from a Google Sheets URL.
 */
export function extractSpreadsheetId(urlOrId) {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}
