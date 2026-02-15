import { store } from './store.js';
import { readRows, readHeaders, appendRow } from './sheets.js';
import { generateQid } from './utils/qid.js';
import { todayISO, currentYear } from './utils/format.js';

export async function loadQuotes() {
  const spreadsheetId = store.get('spreadsheetId');
  const sheetName = store.get('sheetName');
  if (!spreadsheetId) return;

  store.set('isLoading', true);
  store.set('dataError', null);
  try {
    const quotes = await readRows(spreadsheetId, sheetName);
    store.set('quotes', quotes);
    applyFilters();
  } catch (err) {
    store.set('dataError', err.message || 'Failed to load quotes');
  } finally {
    store.set('isLoading', false);
  }
}

export function applyFilters() {
  let quotes = store.get('quotes');
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

export async function validateSheet(spreadsheetId) {
  const sheetName = store.get('sheetName');
  const headers = await readHeaders(spreadsheetId, sheetName);
  if (!headers.length) {
    throw new Error('Sheet appears to be empty (no headers found)');
  }
  return headers;
}
