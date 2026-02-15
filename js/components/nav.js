import { store } from '../store.js';
import { getRoutes, navigate } from '../router.js';

/**
 * Render the bottom tab navigation bar.
 */
export function renderNav(navEl) {
  const unsubs = [];

  function render() {
    navEl.innerHTML = '';
    const current = store.get('currentView');
    for (const route of getRoutes()) {
      const isActive = current === route.name;
      const btn = document.createElement('button');
      btn.className = `tab-nav__item${isActive ? ' tab-nav__item--active' : ''}`;
      btn.setAttribute('aria-label', route.label);
      btn.addEventListener('click', () => navigate(route.name));

      const iconSpan = document.createElement('span');
      iconSpan.className = 'tab-nav__icon';
      iconSpan.innerHTML = route.icon; // SVG string
      btn.appendChild(iconSpan);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tab-nav__label';
      labelSpan.textContent = route.label;
      btn.appendChild(labelSpan);

      navEl.appendChild(btn);
    }
  }

  unsubs.push(store.subscribe('currentView', render));
  render();

  return () => unsubs.forEach(fn => fn());
}
