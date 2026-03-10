import { store } from './store.js';
import { readRows, readHeaders, appendRow, appendRows, listSpreadsheets, getSheetNames, createSpreadsheet } from './sheets.js';
import { generateQid } from './utils/qid.js';
import { todayISO, currentYear } from './utils/format.js';
import { QUOTE_COLUMNS } from './config.js';
import { STARTER_QUOTES } from './starter.js';

export { listSpreadsheets, getSheetNames, createSpreadsheet };

export async function createNewSheet() {
  const result = await createSpreadsheet(QUOTE_COLUMNS);
  store.batch({
    spreadsheetId: result.spreadsheetId,
    sheetName: result.sheetName,
  });
  await loadQuotes();
  return result;
}

export async function loadQuotes() {
  const spreadsheetId = store.get('spreadsheetId');
  const sheetName = store.get('sheetName');
  if (!spreadsheetId || !sheetName) return;

  store.set('isLoadingQuotes', true);
  store.set('dataError', null);
  try {
    const quotes = await readRows(spreadsheetId, sheetName);
    
    if (quotes.length === 0 && (sheetName === 'quotes' || sheetName === 'Sheet1')) {
      // Enable starter mode only if it's a default/empty sheet
      store.batch({
        isStarterMode: true,
        quotes: STARTER_QUOTES,
      });
    } else {
      store.batch({
        isStarterMode: false,
        quotes: quotes,
      });
    }
    applyFilters();
  } catch (err) {
    console.error('loadQuotes error:', err);
    store.set('dataError', err.message || 'Failed to load quotes. Ensure your sheet tab is named correctly.');
  } finally {
    store.set('isLoadingQuotes', false);
  }
}

export async function loadBooks() {
  const spreadsheetId = store.get('spreadsheetId');
  const booksSheetName = store.get('booksSheetName');
  if (!spreadsheetId || !booksSheetName) return;

  store.set('isLoadingBooks', true);
  try {
    const books = await readRows(spreadsheetId, booksSheetName);
    store.batch({
      books: books,
      filteredBooks: books,
    });
  } catch (err) {
    console.warn('Failed to load books:', err.message);
  } finally {
    store.set('isLoadingBooks', false);
  }
}

export async function importStarterQuotes() {
  const spreadsheetId = store.get('spreadsheetId');
  const sheetName = store.get('sheetName');
  if (!spreadsheetId || !sheetName) return;

  store.set('isLoadingQuotes', true);
  try {
    const headers = await readHeaders(spreadsheetId, sheetName);
    const quotesWithMetadata = STARTER_QUOTES.map((q, i) => ({
      ...q,
      qid: `S${(i + 1).toString().padStart(3, '0')}`,
      year: currentYear(),
      entry_date: todayISO(),
    }));

    await appendRows(spreadsheetId, sheetName, headers, quotesWithMetadata);
    store.set('isStarterMode', false);
    await loadQuotes();
  } catch (err) {
    throw new Error(`Failed to import: ${err.message}`);
  } finally {
    store.set('isLoadingQuotes', false);
  }
}

export function applyFilters() {
  let quotes = store.get('quotes') || [];
  const lang = store.get('filterLang');
  const type = store.get('filterType');
  const authors = store.get('filterAuthors');
  const labels = store.get('filterLabels');
  const tags = store.get('filterTags');

  if (lang !== 'all') quotes = quotes.filter(q => q.lang === lang);
  if (type !== 'all') quotes = quotes.filter(q => q.type === type);
  if (authors.length) quotes = quotes.filter(q => authors.includes(q.author));
  if (labels.length) quotes = quotes.filter(q => labels.includes(q.label));
  if (tags.length) quotes = quotes.filter(q => tags.includes(q.tag));

  store.set('filteredQuotes', quotes);
}

export async function addQuote(quoteData) {
  const spreadsheetId = store.get('spreadsheetId');
  const sheetName = store.get('sheetName');
  const quotes = store.get('quotes');

  const qid = generateQid(quotes, quoteData.type);
  const fullData = {
    qid,
    ...quoteData,
    year: currentYear(),
    entry_date: todayISO(),
  };

  const headers = await readHeaders(spreadsheetId, sheetName);
  await appendRow(spreadsheetId, sheetName, headers, fullData);

  await loadQuotes();
  return qid;
}

export async function addBook(bookData) {
  const spreadsheetId = store.get('spreadsheetId');
  const booksSheetName = store.get('booksSheetName');

  // Dynamically read headers from the "books" tab to ensure we match your structure
  const headers = await readHeaders(spreadsheetId, booksSheetName);
  if (!headers.length) {
    throw new Error(`Sheet tab "${booksSheetName}" appears to be empty or has no headers.`);
  }
  
  await appendRow(spreadsheetId, booksSheetName, headers, bookData);
  await loadBooks();
}

export async function validateSheet(spreadsheetId) {
  const sheetName = store.get('sheetName');
  const headers = await readHeaders(spreadsheetId, sheetName);
  if (!headers.length) {
    throw new Error('Sheet appears to be empty (no headers found)');
  }
  return headers;
}
