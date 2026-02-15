import { registerRoute } from '../router.js';
import { el } from '../utils/dom.js';
import { ICONS } from '../icons.js';

function render(container) {
  container.appendChild(el('div', { class: 'books-stub' },
    el('div', { class: 'books-stub__icon' }, '\uD83D\uDCDA'),
    el('h2', { class: 'books-stub__title' }, 'Books'),
    el('p', { class: 'books-stub__text' },
      'Track your reading list, book notes, and metadata. This feature is coming soon.',
    ),
  ));
}

registerRoute('books', {
  label: 'Books',
  icon: ICONS.books,
  render,
});
