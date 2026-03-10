import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el, clear } from '../utils/dom.js';
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
    onclick: async () => {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      try {
        const { createNewSheet } = window.__cpbData || {};
        if (createNewSheet) {
          await createNewSheet();
          showToast('New Commonplace Book created!', 'success');
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
    onclick: () => fetchSheets(),
  }, 'Refresh list');

  sheetGroup.append(sheetSelect, refreshBtn);
  sheetSection.appendChild(sheetGroup);

  // Quotes Tab section
  const quotesTabGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Quotes Tab (e.g., quotes)'),
  );
  const quotesTabSelect = el('select', { class: 'form-input' },
    el('option', { value: '' }, 'Select a tab...'),
  );
  quotesTabGroup.appendChild(quotesTabSelect);
  sheetSection.appendChild(quotesTabGroup);

  // Books Tab section
  const booksTabGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Books Tab (e.g., books)'),
  );
  const booksTabSelect = el('select', { class: 'form-input' },
    el('option', { value: '' }, 'Select a tab...'),
  );
  booksTabGroup.appendChild(booksTabSelect);
  sheetSection.appendChild(booksTabGroup);

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
    clear(sheetSelect);
    sheetSelect.appendChild(el('option', { value: '' }, 'Loading spreadsheets...'));
    
    try {
      const { listSpreadsheets } = window.__cpbData || {};
      if (!listSpreadsheets) return;
      
      const files = await listSpreadsheets();
      clear(sheetSelect);
      sheetSelect.appendChild(el('option', { value: '' }, 'Select a spreadsheet...'));
      files.forEach(file => {
        const opt = el('option', { value: file.id, selected: file.id === store.get('spreadsheetId') }, file.name);
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
    quotesTabSelect.disabled = true;
    booksTabSelect.disabled = true;
    clear(quotesTabSelect);
    clear(booksTabSelect);
    quotesTabSelect.appendChild(el('option', { value: '' }, 'Loading...'));
    booksTabSelect.appendChild(el('option', { value: '' }, 'Loading...'));

    try {
      const { getSheetNames } = window.__cpbData || {};
      if (!getSheetNames) return;

      const tabs = await getSheetNames(spreadsheetId);
      clear(quotesTabSelect);
      clear(booksTabSelect);
      
      quotesTabSelect.appendChild(el('option', { value: '' }, 'Select Quotes tab...'));
      booksTabSelect.appendChild(el('option', { value: '' }, 'Select Books tab...'));

      tabs.forEach(tab => {
        // Auto-select "quotes" or "books" if they exist and nothing is selected
        const isQuotesTab = tab.toLowerCase() === 'quotes';
        const isBooksTab = tab.toLowerCase() === 'books';
        
        const quotesSelected = tab === store.get('sheetName') || (!store.get('sheetName') && isQuotesTab);
        const booksSelected = tab === store.get('booksSheetName') || (!store.get('booksSheetName') && isBooksTab);

        quotesTabSelect.appendChild(el('option', { value: tab, selected: quotesSelected }, tab));
        booksTabSelect.appendChild(el('option', { value: tab, selected: booksSelected }, tab));
        
        if (quotesSelected && !store.get('sheetName')) store.set('sheetName', tab);
        if (booksSelected && !store.get('booksSheetName')) store.set('booksSheetName', tab);
      });

      // Load data for the newly selected tabs if they were auto-selected
      const { loadQuotes, loadBooks } = window.__cpbData || {};
      if (loadQuotes) loadQuotes();
      if (loadBooks) loadBooks();

    } catch (err) {
      showToast(`Failed to fetch tabs: ${err.message}`, 'error');
    } finally {
      quotesTabSelect.disabled = false;
      booksTabSelect.disabled = false;
    }
  }

  sheetSelect.addEventListener('change', () => {
    const id = sheetSelect.value;
    if (id) {
      store.set('spreadsheetId', id);
      fetchTabs(id);
    }
  });

  quotesTabSelect.addEventListener('change', () => {
    const name = quotesTabSelect.value;
    if (name) {
      store.set('sheetName', name);
      const { loadQuotes } = window.__cpbData || {};
      if (loadQuotes) loadQuotes();
    }
  });

  booksTabSelect.addEventListener('change', () => {
    const name = booksTabSelect.value;
    if (name) {
      store.set('booksSheetName', name);
      const { loadBooks } = window.__cpbData || {};
      if (loadBooks) loadBooks();
    }
  });

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
