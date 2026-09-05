import { api } from '../api.js';
import { render, loading, errorState, toast } from '../ui.js';
import { esc, date, relativeDays } from '../format.js';

export async function remindersView() {
  loading(6);
  try {
    const [rules, queue] = await Promise.all([api.reminders.rules(), api.reminders.queue()]);
    draw(rules, queue);
  } catch (e) {
    errorState('Reminders could not be loaded', () => remindersView());
  }
}

function draw(rules, queue) {
  const dismissed = new Set(JSON.parse(localStorage.getItem('rs:dismissed') || '[]'));

  render(`
    <div class="view-head">
      <div><h2>Reminders</h2><p>${rules.length} rules · ${queue.length} open obligation${queue.length !== 1 ? 's' : ''}</p></div>
      <div class="seg" role="group" aria-label="Filter">
        <button data-f="all" aria-pressed="true">All</button>
        <button data-f="OVERDUE">Overdue</button>
        <button data-f="TODAY">Today</button>
      </div>
    </div>

    <div class="panel" style="margin-bottom:18px">
      <div class="panel-head"><h3>Rules</h3><span class="sub">One class per rule in <code style="font-family:var(--mono)">reminder/rules/</code></span></div>
      <table>
        <thead><tr><th>Rule</th><th>Recipient</th><th>Channel</th><th>Notice</th><th class="num">Open</th><th></th></tr></thead>
        <tbody>
          ${rules.map((r) => `<tr>
            <td><b>${esc(r.name)}</b><br><span style="font-size:12px;color:var(--ink-3)">${esc(r.rationale || r.key)}</span></td>
            <td><span class="chip">${esc(r.recipient)}</span></td>
            <td><span class="chip royal">${esc(r.channel)}</span></td>
            <td class="num">${r.noticeDays}d</td>
            <td class="num">${r.openCount ?? queue.filter((q) => q.key.includes(':' + r.key + ':')).length}</td>
            <td><button class="btn btn-sm" data-filter="${esc(r.key)}">view</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="panel" id="queuePanel">
      <div class="panel-head"><h3>Queue</h3><span class="sub">Dismissed items are kept locally and can be reinstated</span></div>
      <div id="queueList">${queueListHtml(queue, dismissed, 'all')}</div>
    </div>
  `);

  // filter buttons
  document.querySelectorAll('.seg [data-f]').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.seg [data-f]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      document.getElementById('queueList').innerHTML = queueListHtml(queue, dismissed, btn.dataset.f);
      wireDismiss(queue, dismissed);
    };
  });
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.filter;
      const filtered = queue.filter((q) => q.key.includes(':' + key + ':'));
      document.getElementById('queueList').innerHTML = queueListHtml(filtered, dismissed, 'all', key);
      wireDismiss(queue, dismissed);
      toast(`${filtered.length} for ${key}`);
    };
  });
  wireDismiss(queue, dismissed);
}

function queueListHtml(queue, dismissed, filter, ruleKey) {
  let list = queue;
  if (filter === 'OVERDUE') list = list.filter((q) => q.bucket === 'OVERDUE');
  if (filter === 'TODAY') list = list.filter((q) => q.bucket === 'TODAY');
  if (!list.length) return `<div class="empty"><b>No reminders</b>${ruleKey ? `No open items for ${esc(ruleKey)}.` : 'All caught up for this filter.'}</div>`;
  return list.map((r) => `
    <div class="qitem" data-done="${dismissed.has(r.key) ? '1' : '0'}">
      <button class="tick" data-dismiss="${esc(r.key)}" data-done="${dismissed.has(r.key) ? '1' : '0'}">${dismissed.has(r.key) ? '✓' : ''}</button>
      <div class="body">
        <div class="t">${esc(r.title)}</div>
        <div class="m">
          <a href="#/clients/${esc(r.clientId)}">${esc(r.clientName)}</a>
          <span>· ${esc(r.ruleName)} · ${date(r.dueOn)} · ${relativeDays(r.daysUntilDue)}</span>
          <span class="chip ${r.bucket === 'OVERDUE' ? 'alert' : r.bucket === 'TODAY' ? 'warn' : ''}">${esc(r.bucket)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function wireDismiss(queue, dismissed) {
  document.querySelectorAll('[data-dismiss]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const key = btn.dataset.dismiss;
      const done = btn.dataset.done === '1';
      try {
        if (done) await api.reminders.reinstate(key);
        else await api.reminders.dismiss(key);
      } catch {}
      if (done) dismissed.delete(key); else dismissed.add(key);
      localStorage.setItem('rs:dismissed', JSON.stringify([...dismissed]));
      btn.dataset.done = dismissed.has(key) ? '1' : '0';
      btn.textContent = dismissed.has(key) ? '✓' : '';
      btn.closest('.qitem').dataset.done = dismissed.has(key) ? '1' : '0';
      toast(done ? 'Reinstated' : 'Dismissed');
    };
  });
}
