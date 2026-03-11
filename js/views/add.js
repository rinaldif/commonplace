import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el, clear } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { TYPE_LABELS } from '../config.js';
import { ICONS } from '../icons.js';

let unsubs = [];
let activeMode = 'quote'; // 'quote' or 'book'

function render(container) {
  unsubs = [];
  const wrapper = el('div', { class: 'add-view' });

  if (!store.get('isAuthenticated') || !store.get('spreadsheetId')) {
    wrapper.appendChild(el('div', { class: 'empty-state' },
      el('div', { class: 'empty-state__icon' }, '\uD83D\uDD12'),
      el('p', {}, 'Sign in and connect a Google Sheet to add content.'),
    ));
    container.appendChild(wrapper);
    return;
  }

  // Toggle mode
  const modeToggle = el('div', { class: 'view-tabs', style: 'margin-bottom: var(--space-6)' },
    el('button', { 
      class: `btn btn--tab ${activeMode === 'quote' ? 'active' : ''}`,
      onclick: () => { activeMode = 'quote'; render(container); }
    }, 'Add Quote'),
    el('button', { 
      class: `btn btn--tab ${activeMode === 'book' ? 'active' : ''}`,
      onclick: () => { activeMode = 'book'; render(container); }
    }, 'Add Book')
  );
  wrapper.appendChild(modeToggle);

  const formContainer = el('div', { class: 'add-form-container' });
  if (activeMode === 'quote') {
    renderQuoteForm(formContainer);
  } else {
    renderBookForm(formContainer);
  }
  wrapper.appendChild(formContainer);

  clear(container);
  container.appendChild(wrapper);
}

function renderQuoteForm(container) {
  const formEl = el('div', { class: 'add-form' });

  // Type selector
  const typeGroup = el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Quote Type'),
  );
  const typeSelect = el('select', { class: 'form-select' },
    ...Object.entries(TYPE_LABELS).map(([k, v]) => el('option', { value: k }, v))
  );
  typeGroup.appendChild(typeSelect);
  formEl.appendChild(typeGroup);

  // Quote text
  const quoteInput = el('textarea', {
    class: 'form-textarea',
    placeholder: 'Enter the quote text...',
  });
  formEl.appendChild(el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Quote *'),
    quoteInput,
  ));

  // Author
  const authorInput = el('input', {
    class: 'form-input',
    type: 'text',
    placeholder: 'Who said or wrote this?',
  });
  formEl.appendChild(el('div', { class: 'form-group' },
    el('label', { class: 'form-label' }, 'Author *'),
    authorInput,
  ));

  const row3 = el('div', { class: 'add-form__row add-form__row--3col' });
  const labelCombo = createComboSelect('Label', 'label');
  const tagCombo = createComboSelect('Tag', 'tag');
  const langCombo = createComboSelect('Language', 'lang');
  row3.append(labelCombo.el, tagCombo.el, langCombo.el);
  formEl.appendChild(row3);

  const bookInput = el('input', { class: 'form-input', type: 'text', placeholder: 'Book title' });
  const pageInput = el('input', { class: 'form-input', type: 'text', placeholder: 'Page' });
  const row2 = el('div', { class: 'add-form__row add-form__row--2col' });
  row2.append(
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Book'), bookInput),
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Page'), pageInput)
  );
  formEl.appendChild(row2);

  const notesInput = el('textarea', { class: 'form-textarea', placeholder: 'Notes...' });
  formEl.appendChild(el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Notes'), notesInput));

  const submitBtn = el('button', {
    class: 'btn btn--primary btn--block',
    onclick: async () => {
      const data = {
        type: typeSelect.value,
        quote: quoteInput.value.trim(),
        author: authorInput.value.trim(),
        label: labelCombo.getValue(),
        tag: tagCombo.getValue(),
        lang: langCombo.getValue(),
        book: bookInput.value.trim(),
        page: pageInput.value.trim(),
        notes: notesInput.value.trim(),
      };

      if (!data.quote || !data.author) return showToast('Quote and Author are required', 'error');

      submitBtn.disabled = true;
      try {
        await window.__cpbData.addQuote(data);
        showToast('Quote added!', 'success');
        renderQuoteForm(container);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
      }
    }
  }, 'Add Quote');
  formEl.appendChild(submitBtn);

  clear(container);
  container.appendChild(formEl);
}

function renderBookForm(container) {
  const formEl = el('div', { class: 'add-form' });

  const titleInput = el('input', { class: 'form-input', type: 'text', required: true });
  const authorInput = el('input', { class: 'form-input', type: 'text', required: true });
  
  formEl.append(
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Book Title *'), titleInput),
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Author *'), authorInput)
  );

  const yearPubInput = el('input', { class: 'form-input', type: 'number' });
  const yearReadInput = el('input', { class: 'form-input', type: 'number', value: new Date().getFullYear() });
  const row2 = el('div', { class: 'add-form__row add-form__row--2col' });
  row2.append(
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Year Published'), yearPubInput),
    el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Year Read'), yearReadInput)
  );
  formEl.appendChild(row2);

  const genreInput = el('input', { class: 'form-input', type: 'text' });
  formEl.appendChild(el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Genre'), genreInput));

  const formatSelect = el('select', { class: 'form-select' },
    el('option', { value: 'eBook' }, 'eBook'),
    el('option', { value: 'Paperback' }, 'Paperback'),
    el('option', { value: 'Audiobook' }, 'Audiobook'),
    el('option', { value: 'Hardcover' }, 'Hardcover')
  );
  formEl.appendChild(el('div', { class: 'form-group' }, el('label', { class: 'form-label' }, 'Format'), formatSelect));

  const submitBtn = el('button', {
    class: 'btn btn--primary btn--block',
    onclick: async () => {
      const data = {
        count: '1',
        book_title: titleInput.value.trim(),
        author_name: authorInput.value.trim(),
        year_published: yearPubInput.value,
        year_read: yearReadInput.value,
        genre: genreInput.value.trim(),
        Format: formatSelect.value
      };

      if (!data.book_title || !data.author_name) return showToast('Title and Author are required', 'error');

      submitBtn.disabled = true;
      try {
        await window.__cpbData.addBook(data);
        showToast('Book added!', 'success');
        renderBookForm(container);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
      }
    }
  }, 'Add Book');
  formEl.appendChild(submitBtn);

  clear(container);
  container.appendChild(formEl);
}

function createComboSelect(label, column) {
  const group = el('div', { class: 'form-group' });
  group.appendChild(el('label', { class: 'form-label' }, label));

  const select = el('select', { class: 'form-select' });
  const quotes = store.get('quotes') || [];
  const values = [...new Set(quotes.map(q => (q[column] || '').trim()).filter(Boolean))].sort();

  select.appendChild(el('option', { value: '' }, '-- Select --'));
  select.appendChild(el('option', { value: '__new__' }, '+ Add new...'));
  values.forEach(v => select.appendChild(el('option', { value: v }, v)));
  
  const newInput = el('input', {
    class: 'form-input',
    type: 'text',
    placeholder: `New ${label.toLowerCase()}...`,
    hidden: true,
    style: 'margin-top: 4px'
  });

  select.addEventListener('change', () => { newInput.hidden = select.value !== '__new__'; });
  group.append(select, newInput);

  return {
    el: group,
    getValue() {
      return select.value === '__new__' ? newInput.value.trim() : select.value;
    }
  };
}

function destroy() {
  unsubs.forEach(fn => fn());
  unsubs = [];
}

registerRoute('add', {
  label: 'Add',
  icon: ICONS.add,
  render,
  destroy,
});
