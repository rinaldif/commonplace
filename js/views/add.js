import { registerRoute } from '../router.js';
import { store } from '../store.js';
import { el, clear } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { TYPE_LABELS } from '../config.js';
import { ICONS } from '../icons.js';

let unsubs = [];

function render(container) {
  unsubs = [];
  const wrapper = el('div');

  if (!store.get('isAuthenticated') || !store.get('spreadsheetId')) {
    wrapper.appendChild(el('div', { class: 'empty-state' },
      el('div', { class: 'empty-state__icon' }, '\uD83D\uDD12'),
      el('p', {}, 'Sign in and connect a Google Sheet to add quotes.'),
    ));
    container.appendChild(wrapper);
    return;
  }

  // Type selector
  const typeGroup = el('div', { class: 'form-group add-type-selector' },
    el('label', { class: 'form-label' }, 'Quote Type'),
  );
  const typeSelect = el('select', { class: 'form-select' });
  typeSelect.innerHTML = Object.entries(TYPE_LABELS)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  typeGroup.appendChild(typeSelect);
  wrapper.appendChild(typeGroup);

  // Form container
  const formEl = el('div', { class: 'add-form', id: 'add-form' });
  wrapper.appendChild(formEl);

  function renderForm() {
    clear(formEl);
    const selectedType = typeSelect.value;

    // Quote text
    const quoteInput = el('textarea', {
      class: 'form-textarea',
      placeholder: 'Enter the quote text...',
      id: 'add-quote-text',
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
      id: 'add-author',
    });
    formEl.appendChild(el('div', { class: 'form-group' },
      el('label', { class: 'form-label' }, 'Author *'),
      authorInput,
    ));

    // Label, Tag, Language (3-column row)
    const row3 = el('div', { class: 'add-form__row add-form__row--3col' });

    const labelCombo = createComboSelect('Label', 'label');
    row3.appendChild(labelCombo.el);

    const tagCombo = createComboSelect('Tag', 'tag');
    row3.appendChild(tagCombo.el);

    const langCombo = createComboSelect('Language', 'lang');
    row3.appendChild(langCombo.el);

    formEl.appendChild(row3);

    // Book & Page (only for index_cards)
    let bookInput, pageInput;
    if (selectedType === 'index_cards') {
      const row2 = el('div', { class: 'add-form__row add-form__row--2col' });
      bookInput = el('input', { class: 'form-input', type: 'text', placeholder: 'Book title' });
      pageInput = el('input', { class: 'form-input', type: 'text', placeholder: 'Page number' });
      row2.appendChild(el('div', { class: 'form-group' },
        el('label', { class: 'form-label' }, 'Book'),
        bookInput,
      ));
      row2.appendChild(el('div', { class: 'form-group' },
        el('label', { class: 'form-label' }, 'Page'),
        pageInput,
      ));
      formEl.appendChild(row2);
    }

    // Notes
    const notesInput = el('textarea', {
      class: 'form-textarea',
      placeholder: 'Additional notes (optional)',
      style: { minHeight: '60px' },
    });
    formEl.appendChild(el('div', { class: 'form-group' },
      el('label', { class: 'form-label' }, 'Notes'),
      notesInput,
    ));

    // Submit
    const submitBtn = el('button', {
      class: 'btn btn--primary btn--block',
      onClick: async () => {
        const quoteText = quoteInput.value.trim();
        const author = authorInput.value.trim();

        if (!quoteText || !author) {
          showToast('Quote and Author are required', 'error');
          return;
        }

        const data = {
          type: selectedType,
          quote: quoteText,
          author: author,
          label: labelCombo.getValue(),
          tag: tagCombo.getValue(),
          lang: langCombo.getValue(),
          book: bookInput?.value.trim() || '',
          page: pageInput?.value.trim() || '',
          notes: notesInput.value.trim(),
          translation: '',
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
          const { addQuote } = window.__cpbData || {};
          if (!addQuote) throw new Error('Data layer not initialized');
          const qid = await addQuote(data);
          showToast(`Quote added! (${qid})`, 'success');
          renderForm(); // Reset form
        } catch (err) {
          showToast(`Failed to add quote: ${err.message}`, 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Add Quote';
        }
      },
    }, 'Add Quote');

    formEl.appendChild(el('div', { class: 'add-form__actions' }, submitBtn));
  }

  typeSelect.addEventListener('change', renderForm);
  renderForm();
  container.appendChild(wrapper);
}

function createComboSelect(label, column) {
  const group = el('div', { class: 'form-group' });
  group.appendChild(el('label', { class: 'form-label' }, label));

  const select = el('select', { class: 'form-select' });
  const quotes = store.get('quotes');
  const values = getUniqueValues(quotes, column);

  select.innerHTML = `<option value="">-- Select --</option>` +
    `<option value="__new__">+ Add new...</option>` +
    values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  group.appendChild(select);

  const newInput = el('input', {
    class: 'form-input combo-select__new-input',
    type: 'text',
    placeholder: `New ${label.toLowerCase()}...`,
    hidden: true,
  });
  group.appendChild(newInput);

  select.addEventListener('change', () => {
    newInput.hidden = select.value !== '__new__';
  });

  return {
    el: group,
    getValue() {
      if (select.value === '__new__') return newInput.value.trim();
      return select.value;
    },
  };
}

function getUniqueValues(data, column) {
  const values = new Set();
  for (const row of data) {
    const v = (row[column] || '').trim();
    if (v) values.add(v);
  }
  return [...values].sort();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
