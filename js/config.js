// Google Cloud credentials — replace with your own
export const CLIENT_ID = '326678024332-9lrn3a7dsd9pqpmst41t7unprh4a41it.apps.googleusercontent.com';
export const API_KEY = 'AIzaSyDcjc37jM-q5hdnZlMxu-mRgsiekjmVfRo';

// Google API config
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
export const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

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
export const SHEET_COLUMNS = [
  'qid', 'type', 'quote', 'author', 'label', 'tag',
  'lang', 'book', 'page', 'year', 'entry_date', 'notes', 'translation',
];

// Language options
export const LANGUAGES = {
  eng: 'English',
  ita: 'Italiano',
};
