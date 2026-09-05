import React, { useEffect, useState } from 'react';
import { secureFetch } from '../services/api';
import { Search, UserPlus, ShieldAlert, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';

interface ClientSummary {
  id: string;
  reference: string;
  fullName: string;
  initials: string;
  occupation?: string;
  employer?: string;
  mobileNumber?: string;
  netWorth: number | string;
  riskProfile: string;
  riskScore?: number;
  complianceGapCount: number;
  nextReviewDate?: string;
  daysUntilReview?: number;
}

interface ClientListViewProps {
  onNewClientClick: () => void;
  onSelectClient?: (clientId: string) => void;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  onNewClientClick
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async (query = '') => {
    setIsLoading(true);
    setError(null);
    const endpoint = query ? `/clients?q=${encodeURIComponent(query)}` : '/clients';
    const res = await secureFetch<ClientSummary[]>(endpoint);
    if (res.error) {
      setError(res.error);
    } else {
      setClients(res.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(search);
  };

  const formatZar = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="view-container">
      {/* Header bar */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Wealth Mandate Portfolio</h1>
          <p className="view-subtitle">FAIS & POPIA compliant client advisory register</p>
        </div>
        <button className="btn btn-primary" onClick={onNewClientClick}>
          <UserPlus size={16} /> Onboard New Client
        </button>
      </div>

      {/* Search & filters */}
      <form className="search-bar-form" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by client name, reference (CLI-xxxx), ID number, or employer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      {/* Content list */}
      {isLoading ? (
        <div className="loading-container">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : error ? (
        <div className="alert-banner alert-error">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found matching your criteria.</p>
        </div>
      ) : (
        <div className="client-grid">
          {clients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-card-header">
                <div className="avatar-initials">{client.initials}</div>
                <div className="client-header-meta">
                  <div className="client-name-row">
                    <h3 className="client-name">{client.fullName}</h3>
                    <span className="client-ref">{client.reference}</span>
                  </div>
                  <p className="client-role">
                    {client.occupation ? `${client.occupation} • ${client.employer || ''}` : 'Private Wealth Client'}
                  </p>
                </div>
              </div>

              <div className="client-card-body">
                <div className="metric-box">
                  <span className="metric-label">Net Worth</span>
                  <span className="metric-value text-gold">
                    <TrendingUp size={15} /> {formatZar(client.netWorth)}
                  </span>
                </div>

                <div className="pill-row">
                  <span className={`pill-badge risk-${client.riskProfile.toLowerCase()}`}>
                    {client.riskProfile} MANDATE
                  </span>

                  {client.complianceGapCount > 0 ? (
                    <span className="pill-badge compliance-warning">
                      <ShieldAlert size={12} /> {client.complianceGapCount} Compliance Gap{client.complianceGapCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="pill-badge compliance-ok">
                      FAIS Compliant
                    </span>
                  )}
                </div>
              </div>

              <div className="client-card-footer">
                <div className="review-date-info">
                  <Calendar size={13} />
                  <span>
                    {client.daysUntilReview !== undefined && client.daysUntilReview !== null
                      ? client.daysUntilReview < 0
                        ? `Review overdue by ${Math.abs(client.daysUntilReview)}d`
                        : `Annual review in ${client.daysUntilReview}d`
                      : 'Review not scheduled'}
                  </span>
                </div>
                <button className="btn-icon-subtle" title="View Full Ledger & Policy File">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
