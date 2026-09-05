/**
 * Wires routes to views + renders the rail navigation.
 * Each view is loaded as a module so the browser only parses what a screen needs.
 */

import { route, start, navigate } from './router.js';
import { clientsView } from './views/clients.js';
import { api } from './api.js';

const NAV = [
  { group: 'Desk' },
  { label: 'Desk', path: '/', glyph: '◧', exact: true },
  { label: 'Reminders', path: '/reminders', glyph: '◷', badge: 'reminders' },
  { group: 'Book' },
  { label: 'Clients', path: '/clients', glyph: '◩' },
  { label: 'Claims', path: '/claims', glyph: '⬡' },
  { label: 'Compliance', path: '/compliance', glyph: '⧉' },
];

let reminderCount = null;

route('/', () => import('./views/desk.js').then((m) => m.deskView()));
route('/clients', () => clientsView());
route('/clients/:id', ({ id }) => import('./views/client-detail.js').then((m) => m.clientDetailView(id)));
route('/clients/:id/:tab', ({ id, tab }) => import('./views/client-detail.js').then((m) => m.clientDetailView(id, tab)));
route('/reminders', () => import('./views/reminders.js').then((m) => m.remindersView()));
route('/claims', () => import('./views/claims.js').then((m) => m.claimsView()));
route('/claims/:id', ({ id }) => import('./views/claim-detail.js').then((m) => m.claimDetailView(id)));
route('/compliance', () => import('./views/compliance.js').then((m) => m.complianceView()));

function currentPath() {
  return window.location.hash.slice(1) || '/';
}

function isActive(item) {
  const cur = currentPath();
  if (item.exact) return cur === item.path;
  if (item.path === '/clients') return cur.startsWith('/clients');
  if (item.path === '/claims') return cur.startsWith('/claims');
  return cur === item.path || cur.startsWith(item.path + '/');
}

function renderNav() {
  const el = document.getElementById('nav');
  el.innerHTML = NAV.map((item) => {
    if (item.group) return `<div class="nav-group">${item.group}</div>`;
    const active = isActive(item);
    const count = item.badge === 'reminders' && reminderCount != null
      ? `<span class="count ${reminderCount ? 'hot' : ''}">${reminderCount}</span>` : '';
    return `<button ${active ? 'aria-current="true"' : ''} data-nav="${item.path}"><span class="glyph">${item.glyph}</span>${item.label}${count}</button>`;
  }).join('');
  el.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.nav);
  });
}

async function refreshReminderBadge() {
  try {
    const q = await api.reminders.queue();
    reminderCount = q.filter((r) => r.bucket === 'OVERDUE' || r.bucket === 'TODAY').length;
    if (!reminderCount) reminderCount = q.length || 0;
    // only show if there are reminders
    if (q.length === 0) reminderCount = null;
    renderNav();
  } catch { /* backend may be down during dev */ }
}

// search: live filter on clients list
const searchInput = document.getElementById('q');
let searchTimer = null;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const v = e.target.value.trim();
    if (!location.hash.startsWith('#/clients')) navigate('/clients');
    clientsView(v);
  }, 220);
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const v = e.target.value.trim();
    if (!location.hash.startsWith('#/clients')) navigate('/clients');
    clientsView(v);
  }
});

document.getElementById('btnClient').onclick = () => {
  // if already on clients, focus search; otherwise navigate
  if (location.hash.startsWith('#/clients')) {
    document.getElementById('q').focus();
  }
  navigate('/clients');
  // gentle hint: scroll to add button will be visible
  setTimeout(() => document.getElementById('addClient')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
};
document.getElementById('btnClaim').onclick = () => navigate('/claims');

window.addEventListener('hashchange', () => {
  renderNav();
  // keep search in sync when navigating away
  if (!location.hash.startsWith('#/clients')) searchInput.value = '';
});

renderNav();
refreshReminderBadge();
start(() => navigate('/'));

// refresh badge when returning to desk / after dismiss
window.addEventListener('hashchange', () => {
  if (currentPath() === '/' || currentPath().startsWith('/reminders')) refreshReminderBadge();
});
