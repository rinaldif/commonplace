import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { ICONS } from '../icons.js';

let unsubs = [];

function render(container) {
  unsubs = [];
  const wrapper = el('div', { class: 'settings' });

  // Auth section
  const authSection = el('div', { class: 'settings__section' });
  authSection.appendChild(el('h2', { class: 'settings__section-title' }, 'Account'));

  const authStatus = el('div', { class: 'settings__status' });
  const authDot = el('span', { class: 'settings__status-dot' });
  const authText = el('span');
  authStatus.append(authDot, authText);
  authSection.appendChild(authStatus);
  authSection.appendChild(el('p', { class: 'settings__description' },
    'Sign in with your Google account to access your Google Sheets.',
  ));
  wrapper.appendChild(authSection);

  // Sheet section
  const sheetSection = el('div', { class: 'settings__section' });
  sheetSection.appendChild(el('h2', { class: 'settings__section-title' }, 'Google Sheet'));
  sheetSection.appendChild(el('p', { class: 'settings__description' },
    'Paste the URL of your Google Sheet (or just the spreadsheet ID).',
  ));

  const sheetRow = el('div', { class: 'settings__sheet-input' });
  const sheetInput = el('input', {
    class: 'form-input',
    type: 'text',
    placeholder: 'https://docs.google.com/spreadsheets/d/.../edit',
    value: store.get('spreadsheetId'),
  });
  const connectBtn = el('button', {
    class: 'btn btn--primary',
    onClick: async () => {
      const raw = sheetInput.value.trim();
      if (!raw) {
        showToast('Please enter a sheet URL or ID', 'error');
        return;
      }
      const id = extractSpreadsheetId(raw);
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting...';
      try {
        const { validateSheet } = window.__cpbData || {};
        if (validateSheet) {
          await validateSheet(id);
        }
        store.set('spreadsheetId', id);
        sheetInput.value = id;
        showToast('Sheet connected!', 'success');
        // Load data
        const { loadQuotes } = window.__cpbData || {};
        if (loadQuotes) loadQuotes();
      } catch (err) {
        showToast(`Failed to connect: ${err.message}`, 'error');
      } finally {
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect';
      }
    },
  }, 'Connect');
  sheetRow.append(sheetInput, connectBtn);
  sheetSection.appendChild(sheetRow);

  // Sheet name
  const sheetNameGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Sheet tab name (default: Sheet1)'),
  );
  const sheetNameInput = el('input', {
    class: 'form-input',
    type: 'text',
    value: store.get('sheetName'),
    placeholder: 'Sheet1',
  });
  sheetNameInput.addEventListener('change', () => {
    store.set('sheetName', sheetNameInput.value.trim() || 'Sheet1');
  });
  sheetNameGroup.appendChild(sheetNameInput);
  sheetSection.appendChild(sheetNameGroup);

  // Current connection status
  const sheetStatus = el('div', { class: 'settings__status' });
  const sheetDot = el('span', { class: 'settings__status-dot' });
  const sheetText = el('span');
  sheetStatus.append(sheetDot, sheetText);
  sheetSection.appendChild(sheetStatus);

  wrapper.appendChild(sheetSection);
  container.appendChild(wrapper);

  // Reactive updates
  function updateAuth() {
    const isAuth = store.get('isAuthenticated');
    authDot.className = `settings__status-dot settings__status-dot--${isAuth ? 'connected' : 'disconnected'}`;
    authText.textContent = isAuth ? 'Signed in' : 'Not signed in';
  }

  function updateSheet() {
    const id = store.get('spreadsheetId');
    const hasSheet = !!id;
    sheetDot.className = `settings__status-dot settings__status-dot--${hasSheet ? 'connected' : 'disconnected'}`;
    sheetText.textContent = hasSheet ? `Connected: ${id.slice(0, 20)}...` : 'Not connected';
  }

  unsubs.push(store.subscribe('isAuthenticated', updateAuth));
  unsubs.push(store.subscribe('spreadsheetId', updateSheet));
  updateAuth();
  updateSheet();
}

function extractSpreadsheetId(urlOrId) {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}

function destroy() {
  unsubs.forEach(fn => fn());
  unsubs = [];
}

registerRoute('settings', {
  label: 'Settings',
  icon: ICONS.settings,
  render,
  destroy,
});
