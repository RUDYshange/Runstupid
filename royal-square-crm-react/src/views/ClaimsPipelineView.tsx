import React, { useEffect, useState } from 'react';
import { secureFetch } from '../services/api';
import { ChevronRight, CheckSquare, Square, Clock } from 'lucide-react';

interface SceneItem {
  item: string;
  label: string;
  done: boolean;
}

interface ClaimLog {
  text: string;
  recordedAt: string;
}

interface ClaimResponse {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  insurer: string;
  policyNumber?: string;
  insurerClaimNumber?: string;
  claimsHandler?: string;
  claimType: string;
  incidentDate: string;
  lodgedDate: string;
  description?: string;
  stage: string;
  stepNumber: number;
  totalSteps: number;
  closed: boolean;
  sceneChecklist: SceneItem[];
  log: ClaimLog[];
}

export const ClaimsPipelineView: React.FC = () => {
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchClaims = async () => {
    setIsLoading(true);
    const res = await secureFetch<ClaimResponse[]>('/claims');
    if (res.data) {
      setClaims(res.data);
      if (res.data.length > 0 && !selectedClaim) {
        setSelectedClaim(res.data[0]);
      } else if (selectedClaim) {
        const updated = res.data.find((c) => c.id === selectedClaim.id);
        if (updated) setSelectedClaim(updated);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAdvance = async (claimId: string) => {
    const res = await secureFetch<ClaimResponse>(`/claims/${claimId}/advance`, { method: 'POST' });
    if (res.data) {
      setSelectedClaim(res.data);
      fetchClaims();
    }
  };

  const handleToggleChecklist = async (claimId: string, item: string) => {
    const res = await secureFetch<ClaimResponse>(`/claims/${claimId}/checklist/${item}/toggle`, { method: 'POST' });
    if (res.data) {
      setSelectedClaim(res.data);
      fetchClaims();
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Insurance Claims Pipeline</h1>
          <p className="view-subtitle">Ten-stage claims adjudication workflow & scene investigation</p>
        </div>
      </div>

      {isLoading && claims.length === 0 ? (
        <div className="loading-container">
          <Clock className="spin-icon text-gold" size={24} />
          <p>Loading active claims pipeline...</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <p>No claims currently registered. Use the Server-Driven UI tab to lodge a new claim.</p>
        </div>
      ) : (
        <div className="claims-layout">
          {/* Claims List sidebar */}
          <div className="claims-sidebar">
            <h3 className="sidebar-title">Active Claims ({claims.length})</h3>
            <div className="claims-list">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className={`claim-list-item ${selectedClaim?.id === claim.id ? 'active' : ''}`}
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="claim-item-top">
                    <span className="claim-ref">{claim.reference}</span>
                    <span className="claim-stage-tag">{claim.stage.replace('_', ' ')}</span>
                  </div>
                  <h4 className="claim-client">{claim.clientName}</h4>
                  <p className="claim-meta">{claim.insurer} • {claim.claimType.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Claim detail */}
          {selectedClaim && (
            <div className="claim-detail-panel">
              <div className="claim-detail-header">
                <div>
                  <div className="flex-row items-center gap-2">
                    <h2 className="detail-title">{selectedClaim.reference}</h2>
                    <span className="badge-stage">{selectedClaim.stage}</span>
                  </div>
                  <p className="detail-subtitle">
                    Client: <strong>{selectedClaim.clientName}</strong> | Insurer: <strong>{selectedClaim.insurer}</strong>
                  </p>
                </div>

                {!selectedClaim.closed && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAdvance(selectedClaim.id)}
                  >
                    Advance Pipeline Stage <ChevronRight size={15} />
                  </button>
                )}
              </div>

              {/* Progress step bar */}
              <div className="stage-tracker">
                <div className="stage-tracker-header">
                  <span>Stage {selectedClaim.stepNumber} of {selectedClaim.totalSteps}</span>
                  <span>{Math.round((selectedClaim.stepNumber / selectedClaim.totalSteps) * 100)}% Completed</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(selectedClaim.stepNumber / selectedClaim.totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Scene Checklist */}
              <div className="checklist-card">
                <h4 className="card-subheading">Scene & Verification Checklist</h4>
                <div className="checklist-items">
                  {selectedClaim.sceneChecklist.map((item) => (
                    <div
                      key={item.item}
                      className={`checklist-item ${item.done ? 'done' : ''}`}
                      onClick={() => handleToggleChecklist(selectedClaim.id, item.item)}
                    >
                      {item.done ? (
                        <CheckSquare size={18} className="text-gold" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Log */}
              <div className="audit-log-card">
                <h4 className="card-subheading">Adjudication Audit Trail</h4>
                <div className="audit-timeline">
                  {selectedClaim.log.map((entry, idx) => (
                    <div key={idx} className="timeline-entry">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <p className="timeline-text">{entry.text}</p>
                        <span className="timeline-time">
                          {new Date(entry.recordedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
