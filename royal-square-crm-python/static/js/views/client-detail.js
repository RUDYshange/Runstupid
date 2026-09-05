import { api } from '../api.js';
import { render, loading, errorState, toast } from '../ui.js';
import { esc, money, moneyShort, date, relativeDays } from '../format.js';

const TABS = ['overview', 'position', 'goals', 'policies', 'documents'];

export async function clientDetailView(id, tab = 'overview') {
  if (!TABS.includes(tab)) tab = 'overview';
  loading(5);
  try {
    const detail = await api.clients.detail(id);
    draw(detail, tab);
  } catch (e) {
    errorState('This client file could not be loaded', () => clientDetailView(id, tab));
  }
}

function draw(d, activeTab) {
  const worth = d.netWorth;

  render(`
    <div class="chero">
      <div class="top">
        <div class="sq">${esc(initials(d.fullName))}</div>
        <div>
          <h2>${esc(d.fullName)}</h2>
          <div class="meta">
            <span>${esc(d.reference)} · ${esc(d.maskedIdNumber || '')} · ${d.age ? d.age + ' yrs' : ''}</span>
            <span class="chip royal">${esc(d.riskProfile || 'NOT_ASSESSED')}${d.riskScore ? ' · ' + d.riskScore : ''}</span>
          </div>
        </div>
        <div class="worth">
          <b>${money(worth)}</b><span>net worth · ${moneyShort(d.balanceSheet?.totalAssets)} assets</span>
        </div>
      </div>
    </div>

    <div class="tabs" role="tablist">
      ${TABS.map((t) => `<button role="tab" aria-selected="${t === activeTab}" data-tab="${t}">${esc(tabLabel(t))}</button>`).join('')}
    </div>

    <div id="tabBody">${tabBody(d, activeTab)}</div>
  `);

  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.onclick = () => {
      const t = btn.dataset.tab;
      // push hash without full reload
      location.hash = `/clients/${d.id}/${t}`;
      // also immediate swap for snappy feel
      document.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      document.getElementById('tabBody').innerHTML = tabBody(d, t);
      wireTabActions(d, t);
    };
  });
  wireTabActions(d, activeTab);
}

function tabLabel(t) {
  return { overview: 'Overview', position: 'Position', goals: 'Goals', policies: 'Policies', documents: 'Documents' }[t] || t;
}

function tabBody(d, tab) {
  if (tab === 'overview') return overviewTab(d);
  if (tab === 'position') return positionTab(d.balanceSheet);
  if (tab === 'goals') return goalsTab(d.goals || []);
  if (tab === 'policies') return policiesTab(d.policies || []);
  if (tab === 'documents') return documentsTab(d.documents || []);
  return overviewTab(d);
}

function overviewTab(d) {
  return `<div class="grid2">
    <div class="panel">
      <div class="panel-head"><h3>Personal</h3></div>
      <div class="panel-body"><dl class="dl">
        <dt>Full name</dt><dd>${esc(d.fullName)}</dd>
        <dt>ID (masked)</dt><dd class="mono">${esc(d.maskedIdNumber || '—')}</dd>
        <dt>Date of birth</dt><dd>${date(d.dateOfBirth)} · ${d.age ? d.age + ' yrs' : ''}</dd>
        <dt>Occupation</dt><dd>${esc(d.occupation || '—')} ${d.employer ? '· ' + esc(d.employer) : ''}</dd>
        <dt>Income (p.a.)</dt><dd class="mono">${money(d.annualIncome)}</dd>
        <dt>Mobile</dt><dd class="mono">${esc(d.mobileNumber || '—')}</dd>
        <dt>Email</dt><dd>${esc(d.emailAddress || '—')}</dd>
        <dt>Address</dt><dd style="text-align:left">${esc(d.primaryAddress || '—')}</dd>
        <dt>Client since</dt><dd>${date(d.clientSince)}</dd>
        <dt>Next review</dt><dd>${date(d.nextReviewDate)} <span style="color:${d.nextReviewDate && new Date(d.nextReviewDate) < new Date() ? 'var(--alert)' : 'var(--ink-3)'};font-size:12px"> ${relativeDays(daysUntil(d.nextReviewDate))}</span></dd>
        <dt>Licence exp.</dt><dd>${date(d.licenceExpiry)}</dd>
      </dl></div>
    </div>
    <div class="stack">
      <div class="panel">
        <div class="panel-head"><h3>Position summary</h3><span class="sub">Full ledger in Position tab</span></div>
        <div class="panel-body">
          <dl class="dl">
            <dt>Assets</dt><dd class="mono">${money(d.balanceSheet?.totalAssets)}</dd>
            <dt>Liabilities</dt><dd class="mono neg">${money(d.balanceSheet?.totalLiabilities)}</dd>
            <dt>Net worth</dt><dd class="mono"><b>${money(d.balanceSheet?.netWorth)}</b></dd>
            <dt>Monthly surplus</dt><dd class="mono">${money(d.balanceSheet?.monthlySurplus)}</dd>
          </dl>
          ${d.balanceSheet ? `<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="chip">Debt/assets ${d.balanceSheet.debtToAssetsPercent ?? '—'}%</span>
            <span class="chip">Cover ${d.balanceSheet.monthsOfExpensesCovered ?? '—'} mo</span>
          </div>` : ''}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Goals</h3><span class="sub">${(d.goals || []).length} tracked</span></div>
        ${(d.goals || []).slice(0, 3).map(goalRow).join('') || `<div class="empty"><b>No goals yet</b>Add one to track pace vs target.</div>`}
        ${(d.goals || []).length > 3 ? `<div class="panel-foot"><a href="#/clients/${d.id}/goals">View all ${d.goals.length} →</a></div>` : ''}
      </div>
    </div>
  </div>`;
}

function positionTab(bs) {
  if (!bs) return `<div class="panel"><div class="empty"><b>No position data</b>Ledger entries will appear here.</div></div>`;
  const group = (groups, title) => `
    <div class="panel">
      <div class="panel-head"><h3>${esc(title)}</h3></div>
      <table class="ledger">
        <tbody>
          ${(groups || []).map((g) => `
            <tr class="section"><td>${esc(g.label || g.category)}</td><td class="num">${money(g.total)}</td></tr>
            ${(g.lines || g.entries || []).map((l) => `<tr class="sub"><td>${esc(l.label)}${l.creditor ? ' · ' + esc(l.creditor) : ''}${l.interestRate ? ' · ' + l.interestRate + '%' : ''}</td><td class="num">${money(l.amount)}</td></tr>`).join('')}
          `).join('')}
        </tbody>
      </table>
    </div>`;

  return `<div class="grid2">
    ${group(bs.assets, 'Assets — ' + money(bs.totalAssets))}
    ${group(bs.liabilities, 'Liabilities — ' + money(bs.totalLiabilities))}
  </div>
  <div class="grid2" style="margin-top:18px">
    ${group(bs.income, 'Income — ' + money(bs.monthlyIncome) + ' / mo')}
    ${group(bs.expenses, 'Expenses — ' + money(bs.monthlyExpenses) + ' / mo')}
  </div>
  <div class="panel" style="margin-top:18px">
    <div class="panel-body" style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px">
      <span><b>Net worth</b> ${money(bs.netWorth)}</span>
      <span><b>Surplus</b> ${money(bs.monthlySurplus)} / mo</span>
      <span><b>Debt/assets</b> ${bs.debtToAssetsPercent ?? '—'}%</span>
      <span><b>Cover</b> ${bs.monthsOfExpensesCovered ?? '—'} months</span>
    </div>
  </div>`;
}

function goalsTab(goals) {
  if (!goals.length) return `<div class="panel"><div class="empty"><b>No goals yet</b>Goals track funded vs expected pace and surface drift early.</div></div>`;
  return `<div class="panel">${goals.map(goalRow).join('')}</div>`;
}

function goalRow(g) {
  const pct = Math.min(100, Math.max(0, Number(g.percentFunded || 0)));
  const expected = Number(g.percentExpected || 0);
  const paceClass = g.pace === 'AHEAD' ? 'ahead' : g.pace === 'BEHIND' ? 'behind' : '';
  return `<div class="goal">
    <div class="g-top">
      <div><h4>${esc(g.name)}</h4><div class="g-sub">${esc(g.kind || '')}${g.vehicle ? ' · ' + esc(g.vehicle) : ''} · ${date(g.targetDate)} · ${g.yearsRemaining != null ? g.yearsRemaining.toFixed(1) + ' yrs left' : ''}</div></div>
      <div class="g-fig"><b>${money(g.currentAmount)}</b> <span>/ ${money(g.targetAmount)}</span><br><span>${pct.toFixed(0)}% funded</span></div>
    </div>
    <div class="bar"><i class="${paceClass}" style="width:${pct}%"></i><i class="pace" style="left:${Math.min(100, expected)}%"></i></div>
    <div class="g-foot"><span>${esc(g.paceLabel || g.pace || '')}</span><span>${money(g.monthlyContribution || 0)}/mo</span></div>
  </div>`;
}

function policiesTab(policies) {
  if (!policies.length) return `<div class="panel"><div class="empty"><b>No policies on file</b>Products in force will appear here.</div></div>`;
  return `<div class="panel"><table>
    <thead><tr><th>Provider</th><th>Product</th><th>Policy no.</th><th class="num">Sum assured</th><th class="num">Premium</th><th>Renewal</th></tr></thead>
    <tbody>${policies.map((p) => `<tr>
      <td><b>${esc(p.provider)}</b></td>
      <td><span class="chip brass">${esc(p.productType)}</span></td>
      <td class="mono" style="font-family:var(--mono);font-size:12.5px">${esc(p.policyNumber)}</td>
      <td class="num">${money(p.sumAssured)}</td>
      <td class="num">${money(p.monthlyPremium)}/mo</td>
      <td>${date(p.renewalDate)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function documentsTab(docs) {
  if (!docs.length) return `<div class="panel"><div class="empty"><b>No documents signed</b>Compliance gaps will surface in the Compliance matrix.</div></div>`;
  return `<div class="panel"><table>
    <thead><tr><th>Document</th><th>Signed</th><th>Expires</th><th>Status</th></tr></thead>
    <tbody>${docs.map((d) => `<tr>
      <td><b>${esc(d.label || d.type)}</b><br><span style="font-size:11px;color:var(--ink-3)">${esc(d.renewalRule || '')}</span></td>
      <td>${date(d.signedOn)}</td>
      <td>${date(d.expiresOn)}</td>
      <td><span class="chip ${statusTone(d.status)}">${esc(d.statusLabel || d.status)}</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function statusTone(s) {
  return { CURRENT: 'ok', DUE: 'warn', LAPSED: 'alert', MISSING: 'alert', EXPIRED: 'alert' }[s] || '';
}

function initials(name) {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '—';
}
function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso); const n = new Date(); n.setHours(0,0,0,0);
  return Math.round((d - n) / 86400000);
}
function wireTabActions() {}
