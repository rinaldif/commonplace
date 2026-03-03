import { withAuth, gapiReady } from './auth.js';

/**
 * List all spreadsheets the user has access to.
 */
export async function listSpreadsheets() {
  await gapiReady;
  if (!gapi.client?.drive) {
    throw new Error('Google Drive API (metadata) failed to load. Ensure you have enabled it in Google Cloud Console.');
  }
  return withAuth(async () => {
    const response = await gapi.client.drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)',
      orderBy: 'viewedByMeTime desc',
      pageSize: 50,
    });
    return response.result.files || [];
  });
}

/**
 * Get the names of all sheets (tabs) within a spreadsheet.
 */
export async function getSheetNames(spreadsheetId) {
  await gapiReady;
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load. Ensure you have enabled it in Google Cloud Console.');
  }
  return withAuth(async () => {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });
    return response.result.sheets.map(s => s.properties.title);
  });
}

/**
 * Read all rows from a sheet tab, returning an array of objects.
 */
export async function readRows(spreadsheetId, sheetName) {
  await gapiReady;
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load. Please check your internet connection and try again.');
  }
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
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load. Please check your internet connection and try again.');
  }
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
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load. Please check your internet connection and try again.');
  }
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
