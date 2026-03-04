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
    'Select a spreadsheet from your Google Drive or create a new one.',
  ));

  const createBtn = el('button', {
    class: 'btn btn--primary btn--full',
    style: 'margin-bottom: 1.5rem',
    onClick: async () => {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      try {
        const { createNewSheet } = window.__cpbData || {};
        if (createNewSheet) {
          await createNewSheet();
          showToast('New Commonplace Book created!', 'success');
          // Refresh lists
          fetchSheets();
        }
      } catch (err) {
        showToast(`Failed to create sheet: ${err.message}`, 'error');
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create New Commonplace Book';
      }
    }
  }, 'Create New Commonplace Book');
  sheetSection.appendChild(createBtn);

  sheetSection.appendChild(el('p', { class: 'settings__description', style: 'font-size: 0.8rem; margin-bottom: 0.5rem;' },
    'OR SELECT EXISTING:',
  ));

  const sheetGroup = el('div', { class: 'form-group' });
  const sheetSelect = el('select', { class: 'form-input' },
    el('option', { value: '' }, 'Select a spreadsheet...'),
  );
  const refreshBtn = el('button', {
    class: 'btn btn--ghost btn--sm',
    style: 'margin-top: 0.5rem',
    onClick: () => fetchSheets(),
  }, 'Refresh list');

  sheetGroup.append(sheetSelect, refreshBtn);
  sheetSection.appendChild(sheetGroup);

  // Tab section
  const tabGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Sheet Tab (e.g., Sheet1)'),
  );
  const tabSelect = el('select', { class: 'form-input' },
    el('option', { value: '' }, 'Select a tab...'),
  );
  tabGroup.appendChild(tabSelect);
  sheetSection.appendChild(tabGroup);

  // Current connection status
  const sheetStatus = el('div', { class: 'settings__status' });
  const sheetDot = el('span', { class: 'settings__status-dot' });
  const sheetText = el('span');
  sheetStatus.append(sheetDot, sheetText);
  sheetSection.appendChild(sheetStatus);

  wrapper.appendChild(sheetSection);
  container.appendChild(wrapper);

  async function fetchSheets() {
    const isAuth = store.get('isAuthenticated');
    if (!isAuth) return;

    sheetSelect.disabled = true;
    sheetSelect.innerHTML = '<option value="">Loading spreadsheets...</option>';
    
    try {
      const { listSpreadsheets } = window.__cpbData || {};
      if (!listSpreadsheets) return;
      
      const files = await listSpreadsheets();
      sheetSelect.innerHTML = '<option value="">Select a spreadsheet...</option>';
      files.forEach(file => {
        const opt = el('option', { value: file.id }, file.name);
        if (file.id === store.get('spreadsheetId')) opt.selected = true;
        sheetSelect.appendChild(opt);
      });
      
      if (store.get('spreadsheetId')) {
        fetchTabs(store.get('spreadsheetId'));
      }
    } catch (err) {
      showToast(`Failed to fetch sheets: ${err.message}`, 'error');
    } finally {
      sheetSelect.disabled = false;
    }
  }

  async function fetchTabs(spreadsheetId) {
    if (!spreadsheetId) return;
    tabSelect.disabled = true;
    tabSelect.innerHTML = '<option value="">Loading tabs...</option>';

    try {
      const { getSheetNames } = window.__cpbData || {};
      if (!getSheetNames) return;

      const tabs = await getSheetNames(spreadsheetId);
      tabSelect.innerHTML = '';
      tabs.forEach(tab => {
        const opt = el('option', { value: tab }, tab);
        if (tab === store.get('sheetName')) opt.selected = true;
        tabSelect.appendChild(opt);
      });

      // If current sheetName isn't in the list, select the first one
      if (!tabs.includes(store.get('sheetName')) && tabs.length > 0) {
        store.set('sheetName', tabs[0]);
      }
    } catch (err) {
      showToast(`Failed to fetch tabs: ${err.message}`, 'error');
    } finally {
      tabSelect.disabled = false;
    }
  }

  sheetSelect.addEventListener('change', () => {
    const id = sheetSelect.value;
    if (id) {
      store.set('spreadsheetId', id);
      fetchTabs(id);
      // Load data for the new sheet
      const { loadQuotes } = window.__cpbData || {};
      if (loadQuotes) loadQuotes();
    }
  });

  tabSelect.addEventListener('change', () => {
    const name = tabSelect.value;
    if (name) {
      store.set('sheetName', name);
      const { loadQuotes } = window.__cpbData || {};
      if (loadQuotes) loadQuotes();
    }
  });

  // Reactive updates
  function updateAuth() {
    const isAuth = store.get('isAuthenticated');
    authDot.className = `settings__status-dot settings__status-dot--${isAuth ? 'connected' : 'disconnected'}`;
    authText.textContent = isAuth ? 'Signed in' : 'Not signed in';
    if (isAuth) fetchSheets();
  }

  function updateSheet() {
    const id = store.get('spreadsheetId');
    const hasSheet = !!id;
    sheetDot.className = `settings__status-dot settings__status-dot--${hasSheet ? 'connected' : 'disconnected'}`;
    sheetText.textContent = hasSheet ? `Connected` : 'Not connected';
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
