import { onGapiLoaded, onGisLoaded, signIn, signOut, gapiReady, trySilentSignIn } from './auth.js';
import { store } from './store.js';
import { initRouter } from './router.js';
import { renderNav } from './components/nav.js';
import { loadQuotes, loadBooks, applyFilters, addQuote, addBook, validateSheet, listSpreadsheets, getSheetNames, createNewSheet, importStarterQuotes } from './data.js';

// Global error handler for debugging
window.onerror = function(msg, url, line, col, error) {
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
  errDiv.textContent = 'Error: ' + msg + ' at ' + line + ':' + col;
  document.body.appendChild(errDiv);
};

// Register views (each calls registerRoute on import)
import './views/browse.js';
import './views/add.js';
import './views/books.js';
import './views/settings.js';

// Expose data functions for views (avoids circular imports)
window.__cpbData = { loadQuotes, loadBooks, applyFilters, addQuote, addBook, validateSheet, listSpreadsheets, getSheetNames, createNewSheet, importStarterQuotes };

// Wire Google library callbacks
window.__onGapiLoaded = onGapiLoaded;
window.__onGisLoaded = onGisLoaded;

// Handle race condition: scripts may have loaded before this module ran
if (window.gapi?.load) onGapiLoaded();
if (window.google?.accounts?.oauth2) onGisLoaded();

// PWA service worker registration with update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; it will be used on next reload.
              console.log('New version available. Please refresh.');
            }
          }
        };
      };
    }).catch(err => console.error('SW registration failed:', err));
  });

  // Reload when the new service worker takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}

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
    loadQuotes().catch(e => console.error('Initial quotes load failed', e));
    loadBooks().catch(e => console.error('Initial books load failed', e));
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
