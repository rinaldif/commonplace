/**
 * Create a DOM element with attributes and children.
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes (class, id, onClick, etc.)
 * @param {...(string|Node|Array)} children - Child text or elements
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') {
      element.className = val;
    } else if (key === 'style') {
      if (typeof val === 'object') {
        Object.assign(element.style, val);
      } else {
        element.style.cssText = val;
      }
    } else if (key.startsWith('on') && typeof val === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'hidden' || key === 'disabled') {
      if (val) element.setAttribute(key, '');
    } else {
      element.setAttribute(key, val);
    }
  }
  
  const addChildren = (childList) => {
    for (const child of childList) {
      if (child == null) continue;
      if (Array.isArray(child)) {
        addChildren(child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  };
  
  addChildren(children);
  return element;
}

/**
 * Remove all children from an element.
 */
export function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Set innerHTML safely (only use for trusted content like icons).
 */
export function setHtml(element, html) {
  element.innerHTML = html;
}

/**
 * Simple HTML escaping.
 */
export function escape(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}
