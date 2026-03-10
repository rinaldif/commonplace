import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el, clear, setHtml } from '../utils/dom.js';
import { ICONS } from '../icons.js';

let unsubs = [];

function render(container) {
  const quotes = store.get('filteredQuotes') || [];
  const isLoading = store.get('isLoadingQuotes');
  const error = store.get('dataError');

  const header = el('div', { class: 'view-header' },
    el('h2', { class: 'view-title' }, 'Browse Quotes'),
  );

  const content = el('div', { class: 'view-content' });

  if (isLoading && quotes.length === 0) {
    content.appendChild(el('p', { class: 'loading' }, 'Loading quotes...'));
  } else if (error) {
    content.appendChild(el('div', { class: 'error-state' },
      el('p', {}, error),
      el('button', { 
        class: 'btn btn--primary', 
        onclick: () => window.__cpbData.loadQuotes() 
      }, 'Try Again')
    ));
  } else if (quotes.length === 0) {
    content.appendChild(el('p', { class: 'empty-state' }, 
      'No quotes found. Try adjusting your filters or check your Settings.'
    ));
  } else {
    const list = el('div', { class: 'quote-list' });
    quotes.forEach(quote => {
      list.appendChild(renderQuoteCard(quote));
    });
    content.appendChild(list);
  }

  clear(container);
  container.appendChild(header);
  container.appendChild(content);

  // Subscribe to changes
  unsubs.forEach(fn => fn());
  unsubs = [
    store.subscribe('filteredQuotes', () => render(container)),
    store.subscribe('isLoadingQuotes', () => render(container)),
    store.subscribe('dataError', () => render(container))
  ];
}

function renderQuoteCard(q) {
  return el('div', { class: 'quote-card' },
    el('div', { class: 'quote-card__content' }, q.quote),
    el('div', { class: 'quote-card__meta' },
      el('span', { class: 'quote-card__author' }, q.author || 'Unknown'),
      q.book ? el('span', { class: 'quote-card__source' }, ` — ${q.book}`) : null
    ),
    q.tag ? el('div', { class: 'quote-card__tags' }, 
      el('span', { class: 'badge' }, q.tag)
    ) : null
  );
}

function destroy() {
  unsubs.forEach(fn => fn());
  unsubs = [];
}

registerRoute('browse', {
  label: 'Browse',
  icon: ICONS.browse,
  render,
  destroy,
});
