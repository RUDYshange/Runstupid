/**
 * The client list. This is the pattern every other view follows:
 * loading state, fetch, render, and an error path that offers a retry.
 */

import { api } from '../api.js';
import { money, esc, relativeDays, date } from '../format.js';
import { render, loading, errorState, empty } from '../ui.js';

let sort = { key: 'fullName', dir: 1 };

export async function clientsView(query = '') {
  loading();
  try {
    const clients = await api.clients.list(query);
    draw(clients, query);
  } catch (e) {
    errorState('The client list could not be loaded', () => clientsView(query));
  }
}

function draw(clients, query) {
  const sorted = [...clients].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
  });

  const th = (key, label, cls = '') => `<th class="sortable ${cls} ${sort.key === key ? 'sorted' : ''}"
      data-sort="${key}" tabindex="0" role="button"
      aria-sort="${sort.key === key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"
      >${label}<span class="arrow">${sort.key === key && sort.dir < 0 ? '▼' : '▲'}</span></th>`;

  render(`
    <div class="view-head">
      <div><h2>Clients</h2><p>${clients.length} on the book${query ? ` matching “${esc(query)}”` : ''}</p></div>
      <button class="btn btn-primary" id="addClient">Add client</button>
    </div>
    <div class="panel"><table class="sticky">
      <thead><tr>
        ${th('fullName', 'Client')}<th>Occupation</th>${th('netWorth', 'Net worth', 'num')}
        ${th('riskScore', 'Risk profile')}${th('complianceGapCount', 'File')}${th('nextReviewDate', 'Next review')}
      </tr></thead>
      <tbody>${sorted.map(rowFor).join('') || `<tr><td colspan="6">${
        empty('No match', 'Try a surname or a policy number.')}</td></tr>`}</tbody>
    </table></div>`);

  document.querySelectorAll('[data-sort]').forEach((el) => {
    el.onclick = () => {
      const key = el.dataset.sort;
      sort = sort.key === key ? { key, dir: -sort.dir } : { key, dir: 1 };
      draw(clients, query);
    };
  });
}

function rowFor(c) {
  return `<tr class="rowlink" tabindex="0" role="button"
      onclick="location.hash='/clients/${c.id}'"
      aria-label="Open file for ${esc(c.fullName)}">
    <td><div class="who"><div class="sq">${esc(c.initials)}</div>
      <div><b>${esc(c.fullName)}</b><span>${esc(c.reference)} · ${esc(c.mobileNumber || '')}</span></div></div></td>
    <td>${esc(c.occupation || '—')}<br><span style="color:var(--ink-3);font-size:12px">${esc(c.employer || '')}</span></td>
    <td class="num">${money(c.netWorth)}</td>
    <td><span class="chip royal">${esc(c.riskProfile)}${c.riskScore ? ' · ' + c.riskScore : ''}</span></td>
    <td>${c.complianceGapCount
      ? `<span class="chip alert"><i class="dot"></i>${c.complianceGapCount} gap${c.complianceGapCount > 1 ? 's' : ''}</span>`
      : '<span class="chip ok"><i class="dot"></i>Complete</span>'}</td>
    <td>${date(c.nextReviewDate)}<br><span style="font-size:12px;color:${
      c.daysUntilReview < 0 ? 'var(--alert)' : 'var(--ink-3)'}">${relativeDays(c.daysUntilReview)}</span></td>
  </tr>`;
}
