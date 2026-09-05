import { api } from '../api.js';
import { render, loading, errorState } from '../ui.js';
import { esc, date } from '../format.js';

export async function complianceView() {
  loading(6);
  try {
    const clients = await api.clients.list('');
    // fetch detail for each to get documents (small book, so acceptable)
    const details = await Promise.all(clients.map((c) => api.clients.detail(c.id).catch(() => null)));
    draw(clients, details.filter(Boolean));
  } catch (e) {
    errorState('Compliance data could not be loaded', () => complianceView());
  }
}

function draw(summaries, details) {
  // collect doc types
  const allDocs = details.flatMap((d) => d.documents || []);
  const typeSet = [...new Set(allDocs.map((d) => d.type))].sort();
  // if no docs at all, use complianceGapCount fallback
  const showMatrix = typeSet.length > 0;

  render(`
    <div class="view-head">
      <div><h2>Compliance</h2><p>${summaries.length} clients · ${typeSet.length || 0} document types on file</p></div>
      <span class="chip ${summaries.some((c) => c.complianceGapCount) ? 'alert' : 'ok'}">
        ${summaries.filter((c) => c.complianceGapCount).length} with gaps
      </span>
    </div>

    ${showMatrix ? `
    <div class="panel" style="margin-bottom:18px;overflow:auto">
      <div class="panel-head"><h3>Document matrix</h3>
        <div class="legend" style="font-size:11px">
          <span><i class="dot" style="display:inline-block;width:8px;height:8px;background:var(--ok);border-radius:1px;vertical-align:middle;margin-right:4px"></i>Current</span>
          <span><i class="dot" style="display:inline-block;width:8px;height:8px;background:var(--warn);border-radius:1px;vertical-align:middle;margin-right:4px"></i>Due</span>
          <span><i class="dot" style="display:inline-block;width:8px;height:8px;background:var(--alert);border-radius:1px;vertical-align:middle;margin-right:4px"></i>Lapsed / Missing</span>
        </div>
      </div>
      <table class="matrix sticky">
        <thead><tr><th>Client</th>${typeSet.map((t) => `<th class="doc">${esc(shortLabel(t))}</th>`).join('')}<th class="num">Gaps</th></tr></thead>
        <tbody>
          ${details.map((d) => {
            const byType = Object.fromEntries((d.documents || []).map((doc) => [doc.type, doc]));
            return `<tr class="rowlink" onclick="location.hash='/clients/${d.id}'" tabindex="0" role="button">
              <td><b>${esc(d.fullName)}</b><br><span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">${esc(d.reference)}</span></td>
              ${typeSet.map((t) => {
                const doc = byType[t];
                if (!doc) return `<td class="cell"><span class="chip alert">Missing</span></td>`;
                const tone = doc.status === 'CURRENT' ? 'ok' : doc.status === 'DUE' ? 'warn' : 'alert';
                return `<td class="cell"><span class="chip ${tone}">${esc(doc.statusLabel || doc.status)}</span><br><span style="font-size:11px;color:var(--ink-3)">${esc(doc.expiresOn ? date(doc.expiresOn) : '')}</span></td>`;
              }).join('')}
              <td class="num ${summaries.find((s) => s.id === d.id)?.complianceGapCount ? 'neg' : ''}">${summaries.find((s) => s.id === d.id)?.complianceGapCount ?? 0}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : `
    <div class="panel" style="margin-bottom:18px"><div class="empty"><b>No signed documents yet</b>The matrix will populate once the first FICA / disclosure / consent document is signed. Gap counts below come from the summary.</div></div>
    `}

    <div class="panel">
      <div class="panel-head"><h3>Clients with gaps</h3><span class="sub">Sorted by most gaps first</span></div>
      <table>
        <thead><tr><th>Client</th><th>Risk</th><th class="num">Net worth</th><th class="num">Gaps</th><th>Next review</th></tr></thead>
        <tbody>
          ${[...summaries].sort((a, b) => b.complianceGapCount - a.complianceGapCount).map((c) => `
            <tr class="rowlink" onclick="location.hash='/clients/${c.id}'">
              <td><b>${esc(c.fullName)}</b> <span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">${esc(c.reference)}</span></td>
              <td><span class="chip royal">${esc(c.riskProfile)}</span></td>
              <td class="num">${c.netWorth != null ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(c.netWorth) : '—'}</td>
              <td class="num ${c.complianceGapCount ? 'neg' : ''}">${c.complianceGapCount ? `<span class="chip alert">${c.complianceGapCount}</span>` : `<span class="chip ok">0</span>`}</td>
              <td>${date(c.nextReviewDate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `);
}

function shortLabel(type) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
