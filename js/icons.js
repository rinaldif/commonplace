// Minimal SVG icons — 20x20 viewBox, stroke-based, 1.5px stroke
const s = (d) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const ICONS = {
  browse: s('<path d="M6.5 7.5h7M6.5 10h5M6.5 12.5h6"/>'),
  add: s('<path d="M10 5v10M5 10h10"/>'),
  books: s('<path d="M3 4.5c0-.83.67-1.5 1.5-1.5H8c.83 0 2 .67 2 1.5V17c0-.83-1.17-1.5-2-1.5H4.5c-.83 0-1.5.67-1.5 1.5V4.5z"/><path d="M17 4.5c0-.83-.67-1.5-1.5-1.5H12c-.83 0-2 .67-2 1.5V17c0-.83 1.17-1.5 2-1.5h3.5c.83 0 1.5.67 1.5 1.5V4.5z"/>'),
  settings: s('<circle cx="10" cy="10" r="2.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/>'),
};
