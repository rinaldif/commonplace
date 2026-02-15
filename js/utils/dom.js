/**
 * Create a DOM element with attributes and children.
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes (class, id, onClick, etc.)
 * @param {...(string|Node)} children - Child text or elements
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') {
      element.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(element.style, val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'hidden' || key === 'disabled') {
      if (val) element.setAttribute(key, '');
    } else {
      element.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * Remove all children from an element.
 */
export function clear(element) {
  element.innerHTML = '';
}
