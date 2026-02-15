class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = {};
    this._globalListeners = [];
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    if (old !== value) {
      this._notify(key, value, old);
    }
  }

  subscribe(keyOrStar, fn) {
    if (keyOrStar === '*') {
      this._globalListeners.push(fn);
      return () => {
        this._globalListeners = this._globalListeners.filter(f => f !== fn);
      };
    }
    if (!this._listeners[keyOrStar]) this._listeners[keyOrStar] = [];
    this._listeners[keyOrStar].push(fn);
    return () => {
      this._listeners[keyOrStar] = this._listeners[keyOrStar].filter(f => f !== fn);
    };
  }

  batch(updates) {
    const changes = [];
    for (const [key, value] of Object.entries(updates)) {
      const old = this._state[key];
      this._state[key] = value;
      if (old !== value) changes.push([key, value, old]);
    }
    for (const [key, value, old] of changes) {
      this._notify(key, value, old);
    }
  }

  _notify(key, value, old) {
    const fns = this._listeners[key] || [];
    for (const fn of fns) fn(value, old, key);
    for (const fn of this._globalListeners) fn(key, value, old);
  }
}

export const store = new Store({
  // Auth
  authReady: false,
  isAuthenticated: false,

  // Sheet config
  spreadsheetId: localStorage.getItem('cpb_spreadsheetId') || '',
  sheetName: localStorage.getItem('cpb_sheetName') || 'Sheet1',

  // Data
  quotes: [],
  filteredQuotes: [],
  isLoading: false,
  dataError: null,

  // Filters
  filterLang: 'all',
  filterType: 'all',
  filterAuthors: [],
  filterLabels: [],
  filterTags: [],

  // Quote display
  quoteHistory: [],
  quoteIndex: -1,

  // View
  currentView: 'browse',
});

// Persist to localStorage
store.subscribe('spreadsheetId', v => localStorage.setItem('cpb_spreadsheetId', v));
store.subscribe('sheetName', v => localStorage.setItem('cpb_sheetName', v));
