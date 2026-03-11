import { registerRoute } from '../router.js';
import { el, clear } from '../utils/dom.js';
import { ICONS } from '../icons.js';
import { store } from '../store.js';

let unsubs = [];

function render(container) {
  const books = store.get('books') || [];
  const isLoading = store.get('isLoadingBooks');
  
  const header = el('div', { class: 'view-header' },
    el('h2', { class: 'view-title' }, 'My Bookshelf')
  );

  const content = el('div', { class: 'view-content' });
  
  if (isLoading && books.length === 0) {
    content.appendChild(el('p', { class: 'loading' }, 'Loading books...'));
  } else {
    renderStatsAndList(content, books);
  }

  clear(container);
  container.appendChild(header);
  container.appendChild(content);

  unsubs.forEach(fn => fn());
  unsubs = [
    store.subscribe('books', () => render(container)),
    store.subscribe('isLoadingBooks', () => render(container))
  ];
}

function renderStatsAndList(container, books) {
  const realBooks = books.filter(b => b.count && parseInt(b.count) > 0);

  if (realBooks.length === 0) {
    container.appendChild(el('p', { class: 'empty-state' }, 'No books loaded yet. Check your Settings.'));
    return;
  }

  const stats = calculateStats(realBooks);
  const statsGrid = el('div', { class: 'stats-grid' },
    el('div', { class: 'stat-card' },
      el('div', { class: 'stat-value' }, realBooks.length),
      el('div', { class: 'stat-label' }, 'Total Books')
    ),
    el('div', { class: 'stat-card' },
      el('div', { class: 'stat-value' }, stats.thisYear),
      el('div', { class: 'stat-label' }, 'Read this year')
    )
  );

  const yearEntries = Object.entries(stats.byYear).sort((a, b) => a[0] - b[0]);
  const chart = el('div', { class: 'chart-container' },
    el('h3', { class: 'chart-title' }, 'Books per Year'),
    el('div', { class: 'bar-chart-wrapper' },
      el('div', { class: 'bar-chart' }, 
        ...yearEntries.map(([year, count]) => {
          const height = (count / stats.maxPerYear) * 100;
          return el('div', { class: 'bar-wrapper' },
            el('div', { 
              class: 'bar', 
              style: `height: ${height}%`, 
              title: `${count} books in ${year}` 
            }),
            el('div', { class: 'bar-label' }, year)
          );
        })
      )
    )
  );

  const sortedBooks = [...realBooks].sort((a, b) => {
    const yrA = parseInt(a.year_read) || 0;
    const yrB = parseInt(b.year_read) || 0;
    if (yrB !== yrA) return yrB - yrA;
    return (a.book_title || '').localeCompare(b.book_title || '');
  });

  const list = el('div', { class: 'books-list' },
    el('h3', {}, 'Reading History'),
    ...sortedBooks.map(book => el('div', { class: 'book-item' },
      el('div', { class: 'book-info' },
        el('div', { class: 'book-title' }, book.book_title || 'Untitled'),
        el('div', { class: 'book-author' }, `by ${book.author_name || 'Unknown'}`),
      ),
      el('div', { class: 'book-meta' }, 
        el('span', { class: 'badge' }, book.Language || book.genre || 'Book'),
        el('span', { class: 'book-year' }, book.year_read || 'N/A')
      )
    ))
  );

  container.appendChild(statsGrid);
  container.appendChild(chart);
  container.appendChild(list);
}

function calculateStats(books) {
  const currentYear = new Date().getFullYear();
  const byYear = {};
  let thisYearCount = 0;
  
  books.forEach(b => {
    const yr = b.year_read;
    if (yr) {
      byYear[yr] = (byYear[yr] || 0) + 1;
      if (parseInt(yr) === currentYear) thisYearCount++;
    }
  });

  return {
    thisYear: thisYearCount,
    byYear: byYear,
    maxPerYear: Math.max(...Object.values(byYear), 1)
  };
}

function destroy() {
  unsubs.forEach(fn => fn());
  unsubs = [];
}

registerRoute('books', {
  label: 'Books',
  icon: ICONS.books,
  render,
  destroy,
});
