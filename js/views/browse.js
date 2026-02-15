import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el, clear } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { formatQuoteForCopy } from '../utils/format.js';
import { TYPE_LABELS, LANGUAGES } from '../config.js';
import { ICONS } from '../icons.js';

let unsubs = [];
let openDropdown = null; // track which multiselect is open
let outsideClickHandler = null;

function render(container) {
  unsubs = [];
  const wrapper = el('div', { class: 'browse' });

  // ──── Hero: Generate button + count ────
  const hero = el('div', { class: 'browse-hero' });
  const countEl = el('div', { class: 'browse-hero__count' });
  const heroActions = el('div', { class: 'browse-hero__actions' });
  const generateBtn = el('button', {
    class: 'btn btn--primary btn--generate',
    onClick: generateRandomQuote,
  }, 'Generate');
  const refreshBtn = el('button', {
    class: 'btn btn--secondary btn--icon btn--refresh',
    onClick: refreshData,
    'aria-label': 'Refresh data',
  }, '\u21BB');
  heroActions.append(generateBtn, refreshBtn);
  hero.append(countEl, heroActions);
  wrapper.appendChild(hero);

  // ──── Quote card (hidden until first generate) ────
  const card = el('div', { class: 'quote-card', hidden: true });
  const cardText = el('div', { class: 'quote-card__text' });
  const cardDivider = el('div', { class: 'quote-card__divider' });
  const cardAuthor = el('div', { class: 'quote-card__author' });
  const cardSource = el('div', { class: 'quote-card__source' });
  const cardFooter = el('div', { class: 'quote-card__footer' });
  const cardNavInfo = el('span', { class: 'quote-card__nav-info' });
  const copyBtn = el('button', { class: 'quote-card__copy-btn', onClick: copyQuote }, 'Copy');
  cardFooter.append(cardNavInfo, copyBtn);
  card.append(cardText, cardDivider, cardAuthor, cardSource, cardFooter);
  wrapper.appendChild(card);

  // ──── Quote navigation ────
  const nav = el('div', { class: 'quote-nav', hidden: true });
  const prevBtn = el('button', { class: 'btn btn--secondary btn--sm', onClick: prevQuote, disabled: true }, '\u2190 Prev');
  const nextBtn = el('button', { class: 'btn btn--secondary btn--sm', onClick: nextQuote, disabled: true }, 'Next \u2192');
  nav.append(prevBtn, nextBtn);
  wrapper.appendChild(nav);

  // ──── Prompt (shown before first generate) ────
  const prompt = el('div', { class: 'browse-prompt' },
    el('div', { class: 'browse-prompt__icon' }, '\u2728'),
    el('div', { class: 'browse-prompt__text' }, 'Tap Generate to discover a random quote'),
  );
  wrapper.appendChild(prompt);

  // ──── Filter section (collapsible) ────
  const filterSection = el('div', { class: 'filter-section' });
  const filterToggle = el('button', { class: 'filter-toggle', onClick: toggleFilters });
  const filterArrow = el('span', { class: 'filter-toggle__arrow' }, '\u25B6');
  const filterBadge = el('span', { class: 'filter-toggle__badge', hidden: true });
  filterToggle.append(filterArrow, el('span', {}, 'Filters'), filterBadge);
  filterSection.appendChild(filterToggle);

  // Active filter tags
  const activeFiltersEl = el('div', { class: 'active-filters' });
  filterSection.appendChild(activeFiltersEl);

  // Filter panel (hidden by default)
  const filterPanel = el('div', { class: 'filter-panel', hidden: true });

  // Language
  const langGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Language'),
  );
  const langSelect = el('select', { class: 'form-select' });
  langSelect.innerHTML = `<option value="all">All</option>` +
    Object.entries(LANGUAGES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  langSelect.value = store.get('filterLang');
  langSelect.addEventListener('change', () => {
    store.set('filterLang', langSelect.value);
    applyAndRefreshFilters();
  });
  langGroup.appendChild(langSelect);
  filterPanel.appendChild(langGroup);

  // Type
  const typeGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Type'),
  );
  const typeSelect = el('select', { class: 'form-select' });
  typeSelect.innerHTML = `<option value="all">All</option>` +
    Object.entries(TYPE_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  typeSelect.value = store.get('filterType');
  typeSelect.addEventListener('change', () => {
    store.set('filterType', typeSelect.value);
    applyAndRefreshFilters();
  });
  typeGroup.appendChild(typeSelect);
  filterPanel.appendChild(typeGroup);

  // Spacer for grid alignment on desktop
  filterPanel.appendChild(el('div'));

  // Author multiselect
  const authorMs = createMultiselect('Authors', 'author', 'filterAuthors');
  filterPanel.appendChild(authorMs.el);

  // Label multiselect
  const labelMs = createMultiselect('Labels', 'label', 'filterLabels');
  filterPanel.appendChild(labelMs.el);

  // Tag multiselect
  const tagMs = createMultiselect('Tags', 'tag', 'filterTags');
  filterPanel.appendChild(tagMs.el);

  filterSection.appendChild(filterPanel);
  wrapper.appendChild(filterSection);

  // ──── Loading state ────
  const loadingEl = el('div', { class: 'loading-state', hidden: true },
    el('div', { class: 'spinner' }),
    el('span', {}, 'Loading quotes...'),
  );
  wrapper.appendChild(loadingEl);

  container.appendChild(wrapper);

  // ──── Close dropdowns on outside click ────
  outsideClickHandler = (e) => {
    if (openDropdown && !openDropdown.contains(e.target)) {
      closeAllDropdowns();
    }
  };
  document.addEventListener('click', outsideClickHandler);

  // ──── Filter toggle state ────
  let filtersOpen = false;
  function toggleFilters() {
    filtersOpen = !filtersOpen;
    filterPanel.hidden = !filtersOpen;
    filterToggle.className = `filter-toggle${filtersOpen ? ' filter-toggle--open' : ''}`;
  }

  // ──── Reactive updates ────
  function updateCard() {
    const history = store.get('quoteHistory');
    const index = store.get('quoteIndex');
    const hasQuote = index >= 0 && history.length > 0;

    card.hidden = !hasQuote;
    nav.hidden = !hasQuote;
    prompt.hidden = hasQuote;

    if (!hasQuote) return;

    const q = history[index];
    cardText.textContent = q.quote;
    cardAuthor.textContent = `\u2014 ${q.author}`;
    cardSource.textContent = q.book ? `${q.book}${q.page ? ', p. ' + q.page : ''}` : '';
    cardNavInfo.textContent = `Quote ${index + 1} of ${history.length}`;
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= history.length - 1;
  }

  function updateCount() {
    const filtered = store.get('filteredQuotes');
    const total = store.get('quotes');
    if (filtered.length === total.length) {
      countEl.innerHTML = `<strong>${total.length}</strong> quotes`;
    } else {
      countEl.innerHTML = `<strong>${filtered.length}</strong> of ${total.length} quotes`;
    }
  }

  function updateFilterBadge() {
    const count = getActiveFilterCount();
    filterBadge.hidden = count === 0;
    filterBadge.textContent = count;
  }

  function updateActiveFilterTags() {
    clear(activeFiltersEl);
    const lang = store.get('filterLang');
    const type = store.get('filterType');
    const authors = store.get('filterAuthors');
    const labels = store.get('filterLabels');
    const tags = store.get('filterTags');

    if (lang !== 'all') {
      activeFiltersEl.appendChild(createFilterTag(LANGUAGES[lang] || lang, () => {
        store.set('filterLang', 'all');
        langSelect.value = 'all';
        applyAndRefreshFilters();
      }));
    }
    if (type !== 'all') {
      activeFiltersEl.appendChild(createFilterTag(TYPE_LABELS[type] || type, () => {
        store.set('filterType', 'all');
        typeSelect.value = 'all';
        applyAndRefreshFilters();
      }));
    }
    for (const a of authors) {
      activeFiltersEl.appendChild(createFilterTag(a, () => {
        store.set('filterAuthors', authors.filter(v => v !== a));
        applyAndRefreshFilters();
      }));
    }
    for (const l of labels) {
      activeFiltersEl.appendChild(createFilterTag(l, () => {
        store.set('filterLabels', labels.filter(v => v !== l));
        applyAndRefreshFilters();
      }));
    }
    for (const t of tags) {
      activeFiltersEl.appendChild(createFilterTag(t, () => {
        store.set('filterTags', tags.filter(v => v !== t));
        applyAndRefreshFilters();
      }));
    }
  }

  function refreshMultiselects() {
    authorMs.refresh();
    labelMs.refresh();
    tagMs.refresh();
  }

  function onDataChange() {
    updateCount();
    updateFilterBadge();
    updateActiveFilterTags();
    refreshMultiselects();
  }

  function updateLoading() {
    loadingEl.hidden = !store.get('isLoading');
  }

  unsubs.push(store.subscribe('quoteHistory', updateCard));
  unsubs.push(store.subscribe('quoteIndex', updateCard));
  unsubs.push(store.subscribe('filteredQuotes', onDataChange));
  unsubs.push(store.subscribe('quotes', onDataChange));
  unsubs.push(store.subscribe('filterLang', onDataChange));
  unsubs.push(store.subscribe('filterType', onDataChange));
  unsubs.push(store.subscribe('filterAuthors', onDataChange));
  unsubs.push(store.subscribe('filterLabels', onDataChange));
  unsubs.push(store.subscribe('filterTags', onDataChange));
  unsubs.push(store.subscribe('isLoading', updateLoading));

  updateCard();
  onDataChange();
  updateLoading();
}

// ──── Multi-select dropdown component ────

function createMultiselect(label, column, storeKey) {
  const wrapper = el('div', { class: 'form-group' });
  wrapper.appendChild(el('label', { class: 'form-label' }, label));

  const msEl = el('div', { class: 'multiselect' });

  const trigger = el('button', { class: 'multiselect__trigger', type: 'button' });
  const triggerText = el('span', {}, label);
  const triggerCount = el('span', { class: 'multiselect__trigger-count', hidden: true });
  const chevron = el('span', { class: 'multiselect__chevron' }, '\u25BE');
  trigger.append(triggerText, triggerCount, chevron);
  msEl.appendChild(trigger);

  let dropdown = null;
  let isOpen = false;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) {
      close();
    } else {
      closeAllDropdowns();
      open();
    }
  });

  function open() {
    isOpen = true;
    msEl.classList.add('multiselect--open');
    trigger.classList.add('multiselect__trigger--active');
    openDropdown = msEl;

    dropdown = el('div', { class: 'multiselect__dropdown' });
    const search = el('input', {
      class: 'multiselect__search',
      type: 'text',
      placeholder: `Search ${label.toLowerCase()}...`,
    });
    search.addEventListener('click', (e) => e.stopPropagation());
    search.addEventListener('input', () => renderOptions(search.value));
    dropdown.appendChild(search);

    const optionsContainer = el('div', { class: 'multiselect__options' });
    dropdown.appendChild(optionsContainer);
    msEl.appendChild(dropdown);

    renderOptions('');
    search.focus();

    function renderOptions(query) {
      clear(optionsContainer);
      const quotes = getPreFilteredQuotes();
      const allValues = uniqueValues(quotes, column);
      const selected = store.get(storeKey);
      const q = query.toLowerCase();
      const filtered = q ? allValues.filter(v => v.toLowerCase().includes(q)) : allValues;

      if (!filtered.length) {
        optionsContainer.appendChild(el('div', { class: 'multiselect__empty' }, 'No matches'));
        return;
      }

      for (const val of filtered) {
        const isSel = selected.includes(val);
        const opt = el('button', {
          class: `multiselect__option${isSel ? ' multiselect__option--selected' : ''}`,
          type: 'button',
          onClick: (e) => {
            e.stopPropagation();
            toggleValue(storeKey, val);
            renderOptions(search.value);
          },
        },
          el('span', { class: 'multiselect__check' }, isSel ? '\u2713' : ''),
          el('span', {}, val),
        );
        optionsContainer.appendChild(opt);
      }
    }
  }

  function close() {
    isOpen = false;
    msEl.classList.remove('multiselect--open');
    trigger.classList.remove('multiselect__trigger--active');
    if (dropdown) { dropdown.remove(); dropdown = null; }
    if (openDropdown === msEl) openDropdown = null;
  }

  function refresh() {
    const selected = store.get(storeKey);
    const count = selected.length;
    triggerCount.hidden = count === 0;
    triggerCount.textContent = count;
    triggerText.textContent = count > 0 ? `${label} (${count})` : label;
  }

  wrapper.appendChild(msEl);
  refresh();

  return { el: wrapper, refresh, close };
}

function closeAllDropdowns() {
  // Force-close by removing all open dropdown elements
  document.querySelectorAll('.multiselect--open').forEach(ms => {
    ms.classList.remove('multiselect--open');
    ms.querySelector('.multiselect__trigger')?.classList.remove('multiselect__trigger--active');
    ms.querySelector('.multiselect__dropdown')?.remove();
  });
  openDropdown = null;
}

function createFilterTag(label, onRemove) {
  const tag = el('span', { class: 'active-filter-tag' },
    el('span', {}, label),
    el('button', { class: 'active-filter-tag__remove', onClick: onRemove, 'aria-label': `Remove ${label}` }, '\u00D7'),
  );
  return tag;
}

// ──── Helpers ────

function getPreFilteredQuotes() {
  let quotes = store.get('quotes');
  const lang = store.get('filterLang');
  const type = store.get('filterType');
  if (lang !== 'all') quotes = quotes.filter(q => q.lang === lang);
  if (type !== 'all') quotes = quotes.filter(q => q.type === type);
  return quotes;
}

function uniqueValues(data, column) {
  const values = new Set();
  for (const row of data) {
    const v = (row[column] || '').trim();
    if (v) values.add(v);
  }
  return [...values].sort();
}

function toggleValue(storeKey, value) {
  const current = store.get(storeKey);
  if (current.includes(value)) {
    store.set(storeKey, current.filter(v => v !== value));
  } else {
    store.set(storeKey, [...current, value]);
  }
  applyAndRefreshFilters();
}

function getActiveFilterCount() {
  let count = 0;
  if (store.get('filterLang') !== 'all') count++;
  if (store.get('filterType') !== 'all') count++;
  count += store.get('filterAuthors').length;
  count += store.get('filterLabels').length;
  count += store.get('filterTags').length;
  return count;
}

function applyAndRefreshFilters() {
  const { applyFilters } = window.__cpbData || {};
  if (applyFilters) applyFilters();
}

function generateRandomQuote() {
  const filtered = store.get('filteredQuotes');
  if (!filtered.length) {
    showToast('No quotes match your filters', 'error');
    return;
  }
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  const history = [...store.get('quoteHistory'), quote];
  store.batch({
    quoteHistory: history,
    quoteIndex: history.length - 1,
  });
}

function prevQuote() {
  const index = store.get('quoteIndex');
  if (index > 0) store.set('quoteIndex', index - 1);
}

function nextQuote() {
  const index = store.get('quoteIndex');
  const history = store.get('quoteHistory');
  if (index < history.length - 1) store.set('quoteIndex', index + 1);
}

async function copyQuote() {
  const history = store.get('quoteHistory');
  const index = store.get('quoteIndex');
  if (index < 0) return;
  const text = formatQuoteForCopy(history[index]);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success', 2000);
  } catch {
    showToast('Failed to copy', 'error');
  }
}

function refreshData() {
  const { loadQuotes } = window.__cpbData || {};
  if (loadQuotes) loadQuotes();
}

function destroy() {
  unsubs.forEach(fn => fn());
  unsubs = [];
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler);
    outsideClickHandler = null;
  }
  openDropdown = null;
}

registerRoute('browse', {
  label: 'Browse',
  icon: ICONS.browse,
  render,
  destroy,
});
