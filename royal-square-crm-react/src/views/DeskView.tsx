import React, { useEffect, useState } from 'react';
import { secureFetch } from '../services/api';
import { Check, FileWarning, ShieldAlert } from 'lucide-react';

interface Reminder {
  key: string;
  clientId: string;
  clientName: string;
  title: string;
  dueOn?: string;
  daysUntilDue: number;
  bucket: string;
}

interface Claim {
  reference: string;
  clientName: string;
  insurer: string;
  stepNumber: number;
  totalSteps: number;
  closed: boolean;
}

const demoReminders: Reminder[] = [
  { key: 'demo-1', clientId: 'C-1042', clientName: 'Thandeka Mokoena', title: 'Annual financial review meeting', dueOn: '2026-08-29', daysUntilDue: -7, bucket: 'OVERDUE' },
  { key: 'demo-2', clientId: 'C-1201', clientName: 'Kobus van Wyk', title: 'Policy renewal', dueOn: '2026-09-11', daysUntilDue: 6, bucket: 'DUE_SOON' },
  { key: 'demo-3', clientId: 'C-1288', clientName: 'Anele Booysen', title: 'Client consent renewal', dueOn: '2026-09-15', daysUntilDue: 10, bucket: 'UPCOMING' }
];

const demoClaims: Claim[] = [
  { reference: 'SAN-88420114', clientName: 'Thandeka Mokoena', insurer: 'Santam', stepNumber: 7, totalSteps: 10, closed: false },
  { reference: 'SAN-88420119', clientName: 'Kobus van Wyk', insurer: 'Santam', stepNumber: 2, totalSteps: 10, closed: false }
];

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`))
  : 'Date pending';

export const DeskView: React.FC<{ onOpenClients: () => void; onOpenClaims: () => void; onOpenReminders: () => void }> = ({
  onOpenClients,
  onOpenClaims,
  onOpenReminders
}) => {
  const [reminders, setReminders] = useState<Reminder[]>(demoReminders);
  const [claims, setClaims] = useState<Claim[]>(demoClaims);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      secureFetch<Reminder[]>('/reminders'),
      secureFetch<Claim[]>('/claims')
    ]).then(([reminderResponse, claimResponse]) => {
      if (reminderResponse.data?.length) setReminders(reminderResponse.data);
      if (claimResponse.data?.length) setClaims(claimResponse.data);
    });
  }, []);

  const openReminders = reminders.filter((item) => !done.includes(item.key));
  const overdue = openReminders.filter((item) => item.daysUntilDue < 0).length;
  const today = openReminders.filter((item) => item.daysUntilDue === 0).length;
  const queue = openReminders.filter((item) => item.daysUntilDue <= 31);
  const grouped = [
    ['Overdue', queue.filter((item) => item.daysUntilDue < 0), 'overdue'],
    ['Today', queue.filter((item) => item.daysUntilDue === 0), ''],
    ['Next 7 days', queue.filter((item) => item.daysUntilDue > 0 && item.daysUntilDue <= 7), ''],
    ['This month', queue.filter((item) => item.daysUntilDue > 7), '']
  ] as const;

  return (
    <div className="desk-view">
      <section className="date-strip">
        <div className="date-strip-day">Saturday, 5 September<span>Qiniso Ntuli · Newtown office</span></div>
        <div className="date-strip-divider" />
        <div className={`desk-stat ${overdue ? 'hot' : ''}`}><b>{overdue}</b><span>overdue</span></div>
        <div className="desk-stat"><b>{today}</b><span>due today</span></div>
        <div className="desk-stat"><b>6</b><span>clients</span></div>
        <div className="desk-stat"><b>R48.6m</b><span>net worth advised</span></div>
        <div className="desk-stat"><b>{claims.filter((claim) => !claim.closed).length}</b><span>claims running</span></div>
      </section>

      <div className="desk-grid">
        <section className="crm-panel queue-panel">
          <div className="panel-heading"><div><h2>What needs doing</h2><p>Generated from 8 rules across 6 clients</p></div><button className="plain-action" onClick={onOpenReminders}>All reminders</button></div>
          {grouped.map(([label, items, tone]) => items.length > 0 && (
            <div className="queue-group" key={label}>
              <div className={`queue-label ${tone}`}><span>{label}</span><span>{items.length}</span></div>
              {items.map((item) => (
                <div className="queue-item" key={item.key}>
                  <button className="tick-button" onClick={() => setDone((current) => [...current, item.key])} aria-label={`Mark ${item.title} done`}><Check size={12} /></button>
                  <div><strong>{item.title}</strong><p><a href="#" onClick={(event) => { event.preventDefault(); onOpenClients(); }}>{item.clientName}</a><span> · {formatDate(item.dueOn)} · {item.daysUntilDue < 0 ? `${Math.abs(item.daysUntilDue)} days late` : `in ${item.daysUntilDue} days`}</span></p></div>
                </div>
              ))}
            </div>
          ))}
          {!queue.length && <div className="empty-panel"><b>Nothing is due</b>The queue is clear for the next month.</div>}
          <div className="panel-footnote">Ticking an item logs it against the client record and stops the reminder going out.</div>
        </section>

        <div className="desk-side-stack">
          <section className="crm-panel">
            <div className="panel-heading"><h2>Claims in progress</h2><button className="plain-action" onClick={onOpenClaims}>All claims</button></div>
            {claims.filter((claim) => !claim.closed).slice(0, 3).map((claim) => (
              <button className="claim-summary" key={claim.reference} onClick={onOpenClaims}>
                <strong>{claim.clientName} <span>· {claim.insurer}</span></strong>
                <p><span className="status-chip blue">Step {claim.stepNumber} of {claim.totalSteps}</span> {claim.reference}</p>
                <div className="progress-track"><i style={{ width: `${claim.stepNumber / claim.totalSteps * 100}%` }} /></div>
              </button>
            ))}
          </section>

          <section className="crm-panel">
            <div className="panel-heading"><h2>Compliance gaps</h2><button className="plain-action" onClick={onOpenClients}>Register</button></div>
            {['Sipho Radebe', 'Thandeka Mokoena', 'Rina Naidoo'].map((name) => (
              <button className="gap-summary" key={name} onClick={onOpenClients}><FileWarning size={15} /><span><strong>{name}</strong><small><span className="status-chip red">Missing</span> FICA proof of address</small></span></button>
            ))}
          </section>

          <section className="desk-note"><ShieldAlert size={16} /><span>Compliance reminders are generated from the live rules engine. Open the register to review a client file.</span></section>
        </div>
      </div>
    </div>
  );
};
