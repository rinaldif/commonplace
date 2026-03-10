import { registerRoute } from '../router.js';
import { el, clear } from '../utils/dom.js';
import { ICONS } from '../icons.js';
import { store } from '../store.js';

let activeTab = 'list'; // 'list' or 'add'

function render(container) {
  const books = store.get('books') || [];
  
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
  
  if (activeTab === 'list') {
    renderStatsAndList(content, books);
  } else {
    renderAddForm(content);
  }

  clear(container);
  container.appendChild(header);
  container.appendChild(content);
}

function renderStatsAndList(container, books) {
  if (books.length === 0) {
    container.appendChild(el('p', { class: 'empty-state' }, 'No books loaded yet. Go to "Add Book" to start!'));
    return;
  }

  // Stats section
  const stats = calculateStats(books);
  const statsGrid = el('div', { class: 'stats-grid' },
    el('div', { class: 'stat-card' },
      el('div', { class: 'stat-value' }, books.length),
      el('div', { class: 'stat-label' }, 'Total Books')
    ),
    el('div', { class: 'stat-card' },
      el('div', { class: 'stat-value' }, stats.thisYear),
      el('div', { class: 'stat-label' }, 'Read this year')
    )
  );

  // Simple Chart (Books per year)
  const chart = el('div', { class: 'chart-container' },
    el('h3', { class: 'chart-title' }, 'Books per Year'),
    el('div', { class: 'bar-chart' }, 
      ...Object.entries(stats.byYear).map(([year, count]) => {
        const height = (count / stats.maxPerYear) * 100;
        return el('div', { class: 'bar-wrapper' },
          el('div', { class: 'bar', style: `height: ${height}%`, title: `${count} books` }),
          el('div', { class: 'bar-label' }, year)
        );
      })
    )
  );

  // List section
  const list = el('div', { class: 'books-list' },
    el('h3', {}, 'Recently Read'),
    ...books.slice().reverse().map(book => el('div', { class: 'book-item' },
      el('div', { class: 'book-info' },
        el('div', { class: 'book-title' }, book.title),
        el('div', { class: 'book-author' }, `by ${book.author}`),
      ),
      el('div', { class: 'book-meta' }, 
        el('span', { class: 'badge' }, book.genre),
        el('span', { class: 'book-year' }, book.year_read)
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
      
      try {
        await window.__cpbData.addBook(data);
        activeTab = 'list';
        render(container.parentElement); // Re-render the whole view
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
      el('label', { for: 'status' }, 'Status'),
      el('select', { name: 'status', id: 'status' },
        el('option', { value: 'Read' }, 'Read'),
        el('option', { value: 'Reading' }, 'Reading'),
        el('option', { value: 'To Read' }, 'To Read')
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

  const years = Object.keys(byYear).sort();
  const sortedByYear = {};
  years.forEach(y => sortedByYear[y] = byYear[y]);

  return {
    thisYear: thisYearCount,
    byYear: sortedByYear,
    maxPerYear: Math.max(...Object.values(byYear), 1)
  };
}

registerRoute('books', {
  label: 'Books',
  icon: ICONS.books,
  render,
});
