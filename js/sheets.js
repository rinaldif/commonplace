import { withAuth, gapiReady } from './auth.js';

/**
 * Create a new "Commonplace Book" spreadsheet with headers.
 */
export async function createSpreadsheet(headers) {
  await gapiReady;
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load.');
  }
  return withAuth(async () => {
    // 1. Create the spreadsheet
    const response = await gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: { title: 'My Commonplace Book' },
      },
    });
    const spreadsheetId = response.result.spreadsheetId;
    const sheetName = response.result.sheets[0].properties.title;

    // 2. Add headers to the first row
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!1:1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers],
      },
    });

    return { spreadsheetId, sheetName };
  });
}

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
 * Append multiple rows to the sheet in one call.
 */
export async function appendRows(spreadsheetId, sheetName, headers, rowsData) {
  await gapiReady;
  if (!gapi.client?.sheets) {
    throw new Error('Google Sheets API failed to load.');
  }
  return withAuth(async () => {
    const values = rowsData.map(data => headers.map(h => data[h] ?? ''));
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values },
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
