/** Shared rendering helpers used by every view. */

import { esc } from './format.js';

export const view = () => document.getElementById('view');

export function render(html) {
  view().innerHTML = html;
  window.scrollTo(0, 0);
}

/**
 * Screens fetch over the network now, so every view needs a loading state.
 * Skeleton rows rather than a spinner: the page does not jump when data lands.
 */
export function loading(rows = 5) {
  render(`<div class="panel">${'<div class="qitem"><div class="body">'
    + '<div class="skeleton" style="width:40%"></div>'
    + '<div class="skeleton" style="width:65%;margin-top:8px"></div></div></div>'
    ).repeat(rows)}</div>`);
}

/** Errors say what happened and how to fix it. They never just apologise. */
export function errorState(message, retry) {
  render(`<div class="panel"><div class="empty">
    <b>${esc(message)}</b>
    Check your connection and try again.
    ${retry ? '<div style="margin-top:14px"><button class="btn" id="retry">Try again</button></div>' : ''}
  </div></div>`);
  if (retry) document.getElementById('retry').onclick = retry;
}

export function empty(title, guidance) {
  return `<div class="empty"><b>${esc(title)}</b>${esc(guidance)}</div>`;
}

export function toast(message) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export const statusChip = (status, label) => {
  const tone = { CURRENT: 'ok', DUE: 'warn', LAPSED: 'alert', MISSING: 'alert' }[status] || '';
  return `<span class="chip ${tone}"><i class="dot"></i>${esc(label)}</span>`;
};
