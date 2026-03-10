// Google Cloud credentials — replace with your own
export const CLIENT_ID = '326678024332-9lrn3a7dsd9pqpmst41t7unprh4a41it.apps.googleusercontent.com';
export const API_KEY = 'AIzaSyDcjc37jM-q5hdnZlMxu-mRgsiekjmVfRo';

// Google API config
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';
export const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];

// Quote types
export const TYPE_PREFIX = {
  index_cards: 'IC',
  random_quotes: 'RQ',
  my_quotes: 'MQ',
};

export const TYPE_LABELS = {
  index_cards: 'Index Cards (from books)',
  random_quotes: 'Random Quotes (heard/read)',
  my_quotes: 'My Quotes (personal)',
};

// Expected sheet columns (order matters for writes)
export const QUOTE_COLUMNS = [
  'qid', 'type', 'quote', 'author', 'label', 'tag',
  'lang', 'book', 'page', 'year', 'entry_date', 'notes', 'translation',
];

export const BOOK_COLUMNS = [
  'title', 'author', 'year_published', 'year_read', 'genre', 'type', 'status', 'notes',
];

export const DEFAULT_SHEET_QUOTES = 'quotes';
export const DEFAULT_SHEET_BOOKS = 'books';

// Language options
export const LANGUAGES = {
  eng: 'English',
  ita: 'Italiano',
};
