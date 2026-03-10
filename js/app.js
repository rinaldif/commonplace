import { onGapiLoaded, onGisLoaded, signIn, signOut, gapiReady, trySilentSignIn } from './auth.js';
import { store } from './store.js';
import { initRouter } from './router.js';
import { renderNav } from './components/nav.js';
import { loadQuotes, applyFilters, addQuote, validateSheet, listSpreadsheets, getSheetNames, createNewSheet, importStarterQuotes } from './data.js';

// ... (other imports and setup)

// Auth button
const authBtn = document.getElementById('auth-btn');
store.subscribe('authReady', (ready) => {
  if (ready) {
    authBtn.hidden = false;
    // Attempt silent sign-in if we were previously logged in
    if (localStorage.getItem('cpb_was_authenticated')) {
      trySilentSignIn();
    }
  }
});
store.subscribe('isAuthenticated', (authed) => {
  authBtn.textContent = authed ? 'Sign out' : 'Sign in';
  document.getElementById('tab-nav').hidden = !authed;
  if (authed && store.get('spreadsheetId')) {
    loadQuotes();
  }
});
authBtn.addEventListener('click', () => {
  store.get('isAuthenticated') ? signOut() : signIn();
});

// Init router and nav
const navEl = document.getElementById('tab-nav');
const viewContainer = document.getElementById('view-container');
renderNav(navEl);
initRouter(viewContainer);

// If no sheet configured, go to settings
if (!store.get('spreadsheetId')) {
  window.location.hash = 'settings';
}
