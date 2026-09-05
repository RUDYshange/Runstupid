import React, { useEffect, useState } from 'react';
import { secureFetch } from '../services/api';
import { BellRing, Check, ShieldCheck, Clock, Mail, MessageSquare, Calendar } from 'lucide-react';

interface Reminder {
  key: string;
  clientId: string;
  clientName: string;
  ruleName: string;
  title: string;
  dueOn?: string;
  daysUntilDue: number;
  bucket: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
  recipient: string;
  channel: string;
}

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReminders = async () => {
    setIsLoading(true);
    const res = await secureFetch<Reminder[]>('/reminders');
    if (res.data) {
      setReminders(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDismiss = async (key: string) => {
    await secureFetch('/reminders/dismiss', {
      method: 'POST',
      body: JSON.stringify({ key })
    });
    setReminders((prev) => prev.filter((r) => r.key !== key));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail size={14} />;
      case 'SMS':
        return <MessageSquare size={14} />;
      case 'CALENDAR':
      default:
        return <Calendar size={14} />;
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Compliance & Advisory Reminders</h1>
          <p className="view-subtitle">Derived dynamically from rules engine — zero stale reminders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Clock className="spin-icon text-gold" size={24} />
          <p>Evaluating active rules against client registers...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={40} className="text-gold" />
          <h3>All Clear!</h3>
          <p>No compliance renewals or review milestones require attention.</p>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map((rem) => (
            <div key={rem.key} className={`reminder-card bucket-${rem.bucket.toLowerCase()}`}>
              <div className="reminder-left">
                <div className="reminder-icon-box">
                  <BellRing size={18} />
                </div>
                <div>
                  <div className="reminder-title-row">
                    <h3 className="reminder-title">{rem.title}</h3>
                    <span className={`pill-badge bucket-${rem.bucket.toLowerCase()}`}>
                      {rem.bucket.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="reminder-desc">
                    Rule: <strong>{rem.ruleName}</strong> | Client: <strong>{rem.clientName}</strong>
                  </p>
                  <div className="reminder-meta-row">
                    <span className="channel-tag">
                      {getChannelIcon(rem.channel)} {rem.channel} to {rem.recipient}
                    </span>
                    <span className="due-tag">
                      {rem.daysUntilDue < 0
                        ? `Overdue by ${Math.abs(rem.daysUntilDue)} days`
                        : rem.daysUntilDue === 0
                        ? 'Due Today'
                        : `Due in ${rem.daysUntilDue} days`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="reminder-right">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDismiss(rem.key)}
                  title="Dismiss this notification"
                >
                  <Check size={14} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
