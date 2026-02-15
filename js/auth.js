import { CLIENT_ID, API_KEY, SCOPES, DISCOVERY_DOC } from './config.js';
import { store } from './store.js';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let refreshTimer = null;

/** Called when gapi.js script loads. */
export function onGapiLoaded() {
  gapi.load('client', async () => {
    try {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      maybeEnableAuth();
    } catch (err) {
      console.error('gapi init failed:', err);
      store.set('authReady', true); // still show button so user can try
    }
  });
}

/** Called when GIS script loads. */
export function onGisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: handleTokenResponse,
  });
  gisInited = true;
  maybeEnableAuth();
}

function maybeEnableAuth() {
  if (gapiInited && gisInited) {
    store.set('authReady', true);
  }
}

function handleTokenResponse(response) {
  if (response.error) {
    store.set('isAuthenticated', false);
    return;
  }
  store.set('isAuthenticated', true);
  scheduleTokenRefresh(response.expires_in || 3600);
}

function scheduleTokenRefresh(expiresInSeconds) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const refreshMs = Math.max((expiresInSeconds - 300) * 1000, 60000);
  refreshTimer = setTimeout(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }, refreshMs);
}

/** Prompt user to sign in. Must be called from a user gesture. */
export function signIn() {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

/** Sign out and revoke token. */
export function signOut() {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
  }
  if (refreshTimer) clearTimeout(refreshTimer);
  store.batch({
    isAuthenticated: false,
    quotes: [],
    filteredQuotes: [],
    quoteHistory: [],
    quoteIndex: -1,
  });
}

/**
 * Extract a readable error message from a gapi error.
 */
function extractErrorMessage(err) {
  // gapi errors: { result: { error: { message, code, status } }, status }
  if (err?.result?.error?.message) return err.result.error.message;
  if (err?.message) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
}

/**
 * Wrap an API call with automatic 401 retry.
 * @param {Function} apiFn - async function that makes a gapi call
 * @returns {Promise<*>}
 */
export async function withAuth(apiFn) {
  try {
    return await apiFn();
  } catch (err) {
    if (err.status === 401 && tokenClient) {
      // Try to silently refresh
      await new Promise((resolve, reject) => {
        const originalCallback = tokenClient.callback;
        tokenClient.callback = (resp) => {
          tokenClient.callback = originalCallback;
          if (resp.error) {
            reject(new Error('Re-authentication failed'));
          } else {
            handleTokenResponse(resp);
            resolve();
          }
        };
        tokenClient.requestAccessToken({ prompt: '' });
      });
      return await apiFn();
    }
    throw new Error(extractErrorMessage(err));
  }
}
