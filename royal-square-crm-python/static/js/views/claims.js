import { api } from '../api.js';
import { render, loading, errorState, empty } from '../ui.js';
import { esc, date } from '../format.js';

export async function claimsView() {
  loading(5);
  try {
    const claims = await api.claims.list();
    draw(claims);
  } catch (e) {
    errorState('Claims could not be loaded', () => claimsView());
  }
}

function draw(claims) {
  render(`
    <div class="view-head">
      <div><h2>Claims</h2><p>${claims.length} claim${claims.length !== 1 ? 's' : ''} on file</p></div>
      <button class="btn btn-primary" id="btnNewClaim">Log a claim</button>
    </div>
    <div class="panel">
      ${!claims.length ? `<div class="empty"><b>No claims yet</b>When a claim is registered it will appear here with its ten-stage pipeline.</div>`
        : `<table class="sticky">
            <thead><tr><th>Reference</th><th>Client</th><th>Type</th><th>Stage</th><th>Incident</th><th>Lodged</th></tr></thead>
            <tbody>${claims.map(row).join('')}</tbody>
          </table>`}
    </div>
    <div id="claimModalHost"></div>
  `);
  document.getElementById('btnNewClaim')?.addEventListener('click', () => showRegisterModal());
}

function row(c) {
  const pct = Math.round((c.stepNumber / c.totalSteps) * 100);
  return `<tr class="rowlink" tabindex="0" role="button" onclick="location.hash='/claims/${c.id}'" aria-label="Open ${esc(c.reference)}">
    <td><b>${esc(c.reference)}</b><br><span style="font-size:12px;color:var(--ink-3)">${esc(c.insurer || '')}</span></td>
    <td>${esc(c.clientName)}</td>
    <td><span class="chip">${esc(c.claimType)}</span></td>
    <td>
      <span class="chip ${c.closed ? 'ok' : 'royal'}">${esc(c.stage)}</span>
      <div style="margin-top:6px;display:flex;align-items:center;gap:8px">
        <div class="bar" style="flex:1;margin:0;height:6px"><i style="width:${pct}%"></i></div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">${c.stepNumber}/${c.totalSteps}</span>
      </div>
    </td>
    <td>${date(c.incidentDate)}</td>
    <td>${date(c.lodgedDate)}</td>
  </tr>`;
}

function showRegisterModal() {
  const host = document.getElementById('claimModalHost');
  host.innerHTML = `
    <div class="scrim" id="scrim">
      <div class="modal" role="dialog" aria-modal="true" aria-label="Log a claim">
        <div class="m-head"><h3>Log a claim</h3><button class="btn btn-ghost" id="closeModal">✕</button></div>
        <div class="m-body">
          <div class="field"><label>Client ID (UUID)</label><input id="fClientId" placeholder="paste client id from Clients → open a file → copy UUID"></div>
          <div class="frow">
            <div class="field"><label>Insurer</label><input id="fInsurer" placeholder="e.g. OUTsurance"></div>
            <div class="field"><label>Claim type</label><select id="fType"><option>Motor</option><option>Property</option><option>Liability</option><option>Other</option></select></div>
          </div>
          <div class="frow">
            <div class="field"><label>Incident date</label><input id="fIncident" type="date"></div>
            <div class="field"><label>Lodged date</label><input id="fLodged" type="date"></div>
          </div>
          <div class="field"><label>Description</label><textarea id="fDesc" rows="3" placeholder="What happened"></textarea></div>
          <p class="note" style="margin-top:10px">Tip: open a client file first — the detail screen shows the correct UUID in the address bar pattern <code style="font-family:var(--mono)">/clients/{id}</code>.</p>
        </div>
        <div class="m-foot"><button class="btn" id="cancelModal">Cancel</button><button class="btn btn-primary" id="submitClaim">Create claim</button></div>
      </div>
    </div>`;
  const close = () => host.innerHTML = '';
  document.getElementById('closeModal').onclick = close;
  document.getElementById('cancelModal').onclick = close;
  document.getElementById('scrim').onclick = (e) => { if (e.target.id === 'scrim') close(); };
  document.getElementById('submitClaim').onclick = async () => {
    const payload = {
      clientId: document.getElementById('fClientId').value.trim(),
      insurer: document.getElementById('fInsurer').value.trim(),
      claimType: document.getElementById('fType').value,
      incidentDate: document.getElementById('fIncident').value,
      lodgedDate: document.getElementById('fLodged').value,
      description: document.getElementById('fDesc').value.trim(),
    };
    if (!payload.clientId || !payload.insurer) { alert('Client ID and insurer are required'); return; }
    try {
      const created = await api.claims.register(payload);
      close();
      location.hash = `/claims/${created.id}`;
    } catch (e) {
      alert(e.message || 'Could not create claim');
    }
  };
}
