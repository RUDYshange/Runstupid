import { api } from '../api.js';
import { render, loading, errorState, toast } from '../ui.js';
import { esc, date } from '../format.js';

export async function claimDetailView(id) {
  loading(4);
  try {
    const claim = await api.claims.detail(id);
    draw(claim);
  } catch (e) {
    errorState('This claim could not be loaded', () => claimDetailView(id));
  }
}

function draw(c) {
  const pct = Math.round((c.stepNumber / Math.max(1, c.totalSteps)) * 100);
  const stages = buildStages(c.stage, c.totalSteps);

  render(`
    <div class="view-head">
      <div>
        <p style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">${esc(c.reference)} · ${esc(c.insurer || '')}</p>
        <h2>${esc(c.clientName)}</h2>
        <p>${esc(c.claimType)} · ${esc(c.stage)}${c.closed ? ' · closed' : ''}</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" onclick="location.hash='/claims'">← All claims</button>
        ${c.closed ? '' : '<button class="btn btn-primary" id="btnAdvance">Advance stage</button>'}
      </div>
    </div>

    <div class="panel" style="margin-bottom:18px">
      <div class="panel-head"><h3>Pipeline</h3><span class="sub">Step ${c.stepNumber} of ${c.totalSteps} · ${pct}%</span></div>
      <div class="bar" style="margin:14px 18px 0"><i style="width:${pct}%"></i></div>
      <div class="pipe">
        ${stages.map((s, i) => `<div class="pstep" data-state="${s.state}">
          <div class="node">${s.state === 'done' ? '✓' : i + 1}</div>
          <div class="t">${esc(s.label)}</div>
          <div class="when">${esc(s.when || '')}</div>
        </div>`).join('')}
      </div>
      <div class="panel-foot">Incident ${date(c.incidentDate)} · Lodged ${date(c.lodgedDate)} · ${esc(c.insurerClaimNumber || 'no insurer ref yet')}</div>
    </div>

    <div class="grid2">
      <div class="panel">
        <div class="panel-head"><h3>Scene checklist</h3><span class="sub">Tap to toggle</span></div>
        ${(c.sceneChecklist || []).length ? c.sceneChecklist.map((it) => `
          <div class="check" data-done="${it.done ? '1' : '0'}">
            <button class="tick" data-item="${esc(it.item)}" data-done="${it.done ? '1' : '0'}">${it.done ? '✓' : ''}</button>
            <div class="t">${esc(it.label || it.item)}</div>
          </div>
        `).join('') : `<div class="empty"><b>No checklist items</b>Scene items appear after the claim is created.</div>`}
      </div>
      <div class="stack">
        <div class="panel">
          <div class="panel-head"><h3>Detail</h3></div>
          <div class="panel-body">
            <dl class="dl">
              <dt>Handler</dt><dd>${esc(c.claimsHandler || '—')}</dd>
              <dt>Policy</dt><dd class="mono">${esc(c.policyNumber || '—')}</dd>
              <dt>Description</dt><dd style="text-align:left;white-space:pre-wrap">${esc(c.description || '—')}</dd>
            </dl>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Log</h3></div>
          ${(c.log || []).length ? c.log.map((e) => `<div style="padding:10px 18px;border-bottom:1px solid var(--line-2);font-size:13px">
            <div style="color:var(--ink-3);font-family:var(--mono);font-size:11px">${esc(e.recordedAt || e.at || '')}</div>
            <div>${esc(e.text)}</div>
          </div>`).join('') : `<div class="empty"><b>No log entries</b>Advancing the pipeline appends here.</div>`}
        </div>
      </div>
    </div>
  `);

  document.getElementById('btnAdvance')?.addEventListener('click', async () => {
    try {
      const updated = await api.claims.advance(c.id);
      toast(`Advanced to ${updated.stage}`);
      draw(updated);
    } catch (e) { toast(e.message || 'Could not advance'); }
  });

  document.querySelectorAll('[data-item]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = btn.dataset.item;
      try {
        const updated = await api.claims.toggleSceneItem(c.id, item);
        draw(updated);
        toast('Checklist updated');
      } catch (e) { toast(e.message || 'Could not update checklist'); }
    });
  });
}

function buildStages(current, total) {
  const labels = ['Registered', 'Documents requested', 'Documents received', 'Assessor appointed', 'Assessment', 'Decision', 'Offer', 'Accepted', 'Paid', 'Closed'];
  const order = ['REGISTERED','DOCS_REQUESTED','DOCS_RECEIVED','ASSESSOR_APPOINTED','ASSESSMENT','DECISION','OFFER','ACCEPTED','PAID','CLOSED'];
  const idx = order.indexOf(current);
  return labels.slice(0, total).map((label, i) => ({
    label,
    state: idx === -1 ? (i === 0 ? 'active' : '') : i < idx ? 'done' : i === idx ? 'active' : '',
    when: i === idx ? 'current' : i < idx ? 'done' : ''
  }));
}
