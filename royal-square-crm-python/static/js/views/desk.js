import { api } from '../api.js';
import { render, loading, errorState, toast } from '../ui.js';
import { esc, date } from '../format.js';

const BUCKETS = [
  { key: 'OVERDUE', label: 'Overdue', tint: 'overdue' },
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: 'Next 7 days' },
  { key: 'MONTH', label: 'Next 30 days' },
  { key: 'LATER', label: 'Later' },
];

export async function deskView() {
  loading(6);
  try {
    const queue = await api.reminders.queue();
    draw(queue);
  } catch (e) {
    errorState('The obligations queue could not be loaded', () => deskView());
  }
}

function draw(queue) {
  const now = new Date();
  const fmt = now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dismissed = new Set(JSON.parse(localStorage.getItem('rs:dismissed') || '[]'));

  const grouped = Object.fromEntries(BUCKETS.map((b) => [b.key, []]));
  for (const r of queue) grouped[r.bucket || 'LATER']?.push(r);

  const total = queue.length;
  const overdue = (grouped.OVERDUE || []).length;
  const today = (grouped.TODAY || []).length;

  // queue panels
  const queueHtml = BUCKETS.map((b) => {
    const items = grouped[b.key] || [];
    if (!items.length) return '';
    return `<div class="qgroup">
      <div class="qlabel ${b.tint || ''}"><span>${esc(b.label)}</span><span>${items.length}</span></div>
      ${items.map((r) => itemHtml(r, dismissed.has(r.key))).join('')}
    </div>`;
  }).join('') || `<div class="empty"><b>All caught up</b>No obligations due. When a review, certificate or consent is due it will appear here.</div>`;

  render(`
    <div class="view-head">
      <div><h2>Desk</h2><p>${esc(fmt)} · ${total} obligation${total !== 1 ? 's' : ''} in the queue</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" id="btnReminders">All reminders →</button>
      </div>
    </div>
    <div class="datestrip">
      <div class="day">${esc(fmt.split(',')[0] || fmt)}<span>${esc(now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }))}</span></div>
      <div class="vr"></div>
      <div class="dstat ${overdue ? 'hot' : ''}"><b>${overdue}</b><span>overdue</span></div>
      <div class="dstat"><b>${today}</b><span>today</span></div>
      <div class="dstat"><b>${total}</b><span>total</span></div>
    </div>
    <div class="desk">
      <div class="panel queue">
        <div class="panel-head"><h3>Obligations queue</h3><span class="sub">Tap to dismiss · restores from Reminders</span></div>
        ${queueHtml}
      </div>
      <div class="stack">
        <div class="panel">
          <div class="panel-head"><h3>At a glance</h3></div>
          <div class="panel-body" style="font-size:13px;color:var(--ink-2);line-height:1.6">
            This is the adviser's morning view. Every rule in <code style="font-family:var(--mono);background:var(--panel-2);padding:1px 5px;border-radius:2px">reminder/rules/</code>
            is evaluated live — nothing is stored, so a changed review date is reflected immediately.
            Dismiss a reminder and it stays dismissed until you reinstate it.
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Shortcuts</h3></div>
          <div style="padding:8px 14px;display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-sm" onclick="location.hash='/clients'">Search clients</button>
            <button class="btn btn-sm" onclick="location.hash='/compliance'">Compliance matrix</button>
            <button class="btn btn-sm" onclick="location.hash='/claims'">Claims pipeline</button>
          </div>
        </div>
      </div>
    </div>
  `);

  document.getElementById('btnReminders')?.addEventListener('click', () => location.hash = '/reminders');

  document.querySelectorAll('[data-dismiss]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = btn.dataset.dismiss;
      const done = btn.dataset.done === '1';
      try {
        if (done) {
          await api.reminders.reinstate(key);
          dismissed.delete(key);
          toast('Reminder reinstated');
        } else {
          await api.reminders.dismiss(key);
          dismissed.add(key);
          toast('Dismissed — restore in Reminders');
        }
      } catch {
        // fallback to local only if API fails (e.g. demo with no backend)
        if (done) dismissed.delete(key); else dismissed.add(key);
        toast(done ? 'Reinstated (local)' : 'Dismissed (local)');
      }
      localStorage.setItem('rs:dismissed', JSON.stringify([...dismissed]));
      // re-render in place for instant feedback
      btn.dataset.done = dismissed.has(key) ? '1' : '0';
      btn.textContent = dismissed.has(key) ? '✓' : '';
      const item = btn.closest('.qitem');
      if (item) item.dataset.done = dismissed.has(key) ? '1' : '0';
    });
  });

  document.querySelectorAll('[data-open-client]').forEach((el) => {
    el.addEventListener('click', () => location.hash = `/clients/${el.dataset.openClient}`);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.hash = `/clients/${el.dataset.openClient}`; });
  });
}

function itemHtml(r, done) {
  const due = date(r.dueOn);
  return `<div class="qitem" data-done="${done ? '1' : '0'}" data-open-client="${esc(r.clientId)}" tabindex="0" role="button" aria-label="${esc(r.title)} for ${esc(r.clientName)}">
    <button class="tick" data-dismiss="${esc(r.key)}" data-done="${done ? '1' : '0'}" aria-label="${done ? 'Reinstate' : 'Dismiss'}">${done ? '✓' : ''}</button>
    <div class="body">
      <div class="t">${esc(r.title)}</div>
      <div class="m">
        <a onclick="event.stopPropagation();location.hash='/clients/${esc(r.clientId)}'">${esc(r.clientName)}</a>
        <span>· ${esc(r.ruleName)} · ${esc(r.recipient)} · ${due}</span>
        <span class="chip ${r.bucket === 'OVERDUE' ? 'alert' : r.bucket === 'TODAY' ? 'warn' : ''}">${esc(r.bucket || '')}</span>
      </div>
    </div>
  </div>`;
}
