import { registerRoute } from '../router.js';
import { el, clear } from '../utils/dom.js';
import { ICONS } from '../icons.js';
import { store } from '../store.js';

let activeTab = 'list'; // 'list' or 'add'
let unsubs = [];

function render(container) {
  const books = store.get('books') || [];
  const isLoading = store.get('isLoadingBooks');
  
  const header = el('div', { class: 'view-header' },
    el('h2', { class: 'view-title' }, 'My Bookshelf'),
    el('div', { class: 'view-tabs' },
      el('button', { 
        class: `btn btn--tab ${activeTab === 'list' ? 'active' : ''}`,
        onclick: () => { activeTab = 'list'; render(container); }
      }, 'Stats & List'),
      el('button', { 
        class: `btn btn--tab ${activeTab === 'add' ? 'active' : ''}`,
        onclick: () => { activeTab = 'add'; render(container); }
      }, 'Add Book')
    )
  );

  const content = el('div', { class: 'view-content' });
  
  if (isLoading && books.length === 0) {
    content.appendChild(el('p', { class: 'loading' }, 'Loading books...'));
  } else if (activeTab === 'list') {
    renderStatsAndList(content, books);
  } else {
    renderAddForm(content);
  }

  clear(container);
  container.appendChild(header);
  container.appendChild(content);

  // Subscribe to data changes to re-render if needed
  unsubs.forEach(fn => fn());
  unsubs = [
    store.subscribe('books', () => render(container)),
    store.subscribe('isLoadingBooks', () => render(container))
  ];
}

function renderStatsAndList(container, books) {
  // Filter out the blank/separator rows
  const realBooks = books.filter(b => b.count && parseInt(b.count) > 0);

  if (realBooks.length === 0) {
    container.appendChild(el('p', { class: 'empty-state' }, 'No books loaded yet. Check your Settings to select the correct "Books Tab".'));
    return;
  }

  // Stats section
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

  // Chart (Books per year)
  // Ensure we only show recent years if there are many, or all of them
  const yearEntries = Object.entries(stats.byYear).sort((a, b) => a[0] - b[0]);
  const chart = el('div', { class: 'chart-container' },
    el('h3', { class: 'chart-title' }, 'Books per Year'),
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
  );

  // List section - Sorted descending by year_read, then by title
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

function renderAddForm(container) {
  const form = el('form', { 
    class: 'add-book-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      const bookData = {
        count: '1',
        book_title: data.title,
        author_name: data.author,
        year_published: data.year_published,
        year_read: data.year_read,
        genre: data.genre,
        Format: data.format,
        Notes: data.notes
      };

      try {
        await window.__cpbData.addBook(bookData);
        activeTab = 'list';
        render(container);
      } catch (err) {
        alert('Failed to add book: ' + err.message);
      }
    }
  },
    el('div', { class: 'form-group' },
      el('label', { for: 'title' }, 'Title'),
      el('input', { type: 'text', name: 'title', id: 'title', required: true })
    ),
    el('div', { class: 'form-group' },
      el('label', { for: 'author' }, 'Author'),
      el('input', { type: 'text', name: 'author', id: 'author', required: true })
    ),
    el('div', { class: 'form-row' },
      el('div', { class: 'form-group' },
        el('label', { for: 'year_published' }, 'Published'),
        el('input', { type: 'number', name: 'year_published', id: 'year_published' })
      ),
      el('div', { class: 'form-group' },
        el('label', { for: 'year_read' }, 'Year Read'),
        el('input', { type: 'number', name: 'year_read', id: 'year_read', value: new Date().getFullYear() })
      )
    ),
    el('div', { class: 'form-group' },
      el('label', { for: 'genre' }, 'Genre'),
      el('input', { type: 'text', name: 'genre', id: 'genre', placeholder: 'e.g. Fiction, History' })
    ),
    el('div', { class: 'form-group' },
      el('label', { for: 'format' }, 'Format'),
      el('select', { name: 'format', id: 'format' },
        el('option', { value: 'eBook' }, 'eBook'),
        el('option', { value: 'Paperback' }, 'Paperback'),
        el('option', { value: 'Audiobook' }, 'Audiobook'),
        el('option', { value: 'Hardcover' }, 'Hardcover')
      )
    ),
    el('button', { type: 'submit', class: 'btn btn--primary' }, 'Save Book')
  );

  container.appendChild(form);
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
