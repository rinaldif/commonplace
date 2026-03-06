import { store } from '../store.js';
import { getRoutes, navigate } from '../router.js';
import { el, clear, setHtml } from '../utils/dom.js';

/**
 * Render the bottom tab navigation bar.
 */
export function renderNav(navEl) {
  const unsubs = [];

  function render() {
    clear(navEl);
    const current = store.get('currentView');
    
    for (const route of getRoutes()) {
      const isActive = current === route.name;
      
      const iconSpan = el('span', { class: 'tab-nav__icon' });
      setHtml(iconSpan, route.icon); // SVG string is trusted from icons.js

      const labelSpan = el('span', { class: 'tab-nav__label' }, route.label);
      
      const btn = el('button', {
        class: `tab-nav__item${isActive ? ' tab-nav__item--active' : ''}`,
        'aria-label': route.label,
        onClick: () => navigate(route.name)
      }, iconSpan, labelSpan);

      navEl.appendChild(btn);
    }
  }

  unsubs.push(store.subscribe('currentView', render));
  render();

  return () => unsubs.forEach(fn => fn());
}
