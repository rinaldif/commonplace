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
    const response = await gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: { title: 'My Commonplace Book' },
      },
    });
    const spreadsheetId = response.result.spreadsheetId;
    const sheetName = response.result.sheets[0].properties.title;

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
    throw new Error('Google Drive API (metadata) failed to load.');
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
  return withAuth(async () => {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });
    return response.result.sheets.map(s => s.properties.title);
  });
}

/**
 * Read all rows from a sheet tab.
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
 * Append a single row to the end.
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
 * Insert a row at the top (Row 2, just below headers).
 */
export async function insertRowAtTop(spreadsheetId, sheetName, headers, data) {
  await gapiReady;
  return withAuth(async () => {
    // 1. Get sheet ID for the tab
    const ss = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const sheet = ss.result.sheets.find(s => s.properties.title === sheetName);
    const sheetId = sheet.properties.sheetId;

    // 2. Insert blank row at index 1 (Row 2)
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2
            },
            inheritFromBefore: false
          }
        }]
      }
    });

    // 3. Update the newly created Row 2 with data
    const rowValues = headers.map(h => data[h] ?? '');
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowValues]
      }
    });
  });
}

export async function appendRows(spreadsheetId, sheetName, headers, rowsData) {
  await gapiReady;
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

export function extractSpreadsheetId(urlOrId) {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}
