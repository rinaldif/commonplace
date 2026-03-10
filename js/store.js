import { DEFAULT_SHEET_QUOTES, DEFAULT_SHEET_BOOKS } from './config.js';

class Store {
// ... (rest of class)
}

export const store = new Store({
  // Auth
  authReady: false,
  isAuthenticated: false,

  // Sheet config
  spreadsheetId: localStorage.getItem('cpb_spreadsheetId') || '',
  sheetName: localStorage.getItem('cpb_sheetName') || DEFAULT_SHEET_QUOTES,
  booksSheetName: localStorage.getItem('cpb_booksSheetName') || DEFAULT_SHEET_BOOKS,

  // Data
  quotes: [],
  filteredQuotes: [],
  books: [],
  filteredBooks: [],
  isLoading: false,
  dataError: null,
  isStarterMode: false,

  // Filters
  filterLang: 'all',
// ... (rest of filters)

  // View
  currentView: 'browse',
});

// Persist to localStorage
store.subscribe('spreadsheetId', v => localStorage.setItem('cpb_spreadsheetId', v));
store.subscribe('sheetName', v => localStorage.setItem('cpb_sheetName', v));
store.subscribe('booksSheetName', v => localStorage.setItem('cpb_booksSheetName', v));
