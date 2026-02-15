import { store } from './store.js';

const routes = new Map();

/**
 * Register a view.
 * @param {string} name - route hash (e.g., 'browse' -> #browse)
 * @param {Object} view - { label, icon, render(container), destroy?() }
 */
export function registerRoute(name, view) {
  routes.set(name, view);
}

/**
 * Get all registered routes (for rendering nav).
 */
export function getRoutes() {
  return [...routes.entries()].map(([name, view]) => ({
    name,
    label: view.label,
    icon: view.icon,
  }));
}

/**
 * Navigate to a route.
 */
export function navigate(name) {
  window.location.hash = name;
}

/**
 * Initialize the router. Call once at startup.
 */
export function initRouter(containerEl) {
  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'browse';
    const currentView = store.get('currentView');

    if (currentView && routes.has(currentView)) {
      routes.get(currentView).destroy?.();
    }

    store.set('currentView', hash);
    const view = routes.get(hash);
    if (view) {
      containerEl.innerHTML = '';
      view.render(containerEl);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
