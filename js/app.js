import { onGapiLoaded, onGisLoaded, signIn, signOut } from './auth.js';
import { store } from './store.js';
import { initRouter } from './router.js';
import { renderNav } from './components/nav.js';
import { loadQuotes, applyFilters, addQuote, validateSheet } from './data.js';

// Register views (each calls registerRoute on import)
import './views/browse.js';
import './views/add.js';
import './views/books.js';
import './views/settings.js';

// Expose data functions for views (avoids circular imports)
window.__cpbData = { loadQuotes, applyFilters, addQuote, validateSheet };

// Wire Google library callbacks
window.__onGapiLoaded = onGapiLoaded;
window.__onGisLoaded = onGisLoaded;

// Handle race condition: scripts may have loaded before this module ran
if (window.gapi?.load) onGapiLoaded();
if (window.google?.accounts?.oauth2) onGisLoaded();

// PWA service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Auth button
const authBtn = document.getElementById('auth-btn');
store.subscribe('authReady', (ready) => {
  if (ready) authBtn.hidden = false;
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
