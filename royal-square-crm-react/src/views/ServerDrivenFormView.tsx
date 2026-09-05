import React, { useEffect, useState } from 'react';
import { DynamicForm } from '../components/forms/DynamicForm';
import { DynamicFormSchema } from '../schemas/formTypes';
import { secureFetch } from '../services/api';
import { RefreshCw, Code2, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export const ServerDrivenFormView: React.FC = () => {
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<'client-form' | 'claim-form'>('client-form');
  const [schema, setSchema] = useState<DynamicFormSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);

  const loadSchema = async (key: 'client-form' | 'claim-form') => {
    setIsLoading(true);
    setError(null);
    const res = await secureFetch<DynamicFormSchema>(`/ui/schemas/${key}`);
    if (res.error) {
      setError(res.error);
    } else {
      setSchema(res.data || null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSchema(selectedSchemaKey);
  }, [selectedSchemaKey]);

  return (
    <div className="view-container">
      {/* Explanation Banner */}
      <div className="sdui-banner">
        <div className="sdui-banner-left">
          <Sparkles className="text-gold" size={24} />
          <div>
            <h2 className="sdui-title">Server-Driven UI (SDUI) Live Engine</h2>
            <p className="sdui-text">
              The layout, fields, input types, POPIA protections, and validation below are completely controlled by the <strong>Python backend</strong>. 
              Switching the schema or updating the Python schema instantly transforms this form with zero frontend changes!
            </p>
          </div>
        </div>

        <div className="sdui-controls">
          <div className="schema-toggle-group">
            <button
              className={`toggle-btn ${selectedSchemaKey === 'client-form' ? 'active' : ''}`}
              onClick={() => setSelectedSchemaKey('client-form')}
            >
              Client Onboarding Schema
            </button>
            <button
              className={`toggle-btn ${selectedSchemaKey === 'claim-form' ? 'active' : ''}`}
              onClick={() => setSelectedSchemaKey('claim-form')}
            >
              Lodge Claim Schema
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowJsonModal(!showJsonModal)}>
            <Code2 size={14} /> {showJsonModal ? 'Hide Backend Schema' : 'Inspect Schema JSON'}
          </button>
        </div>
      </div>

      {showJsonModal && schema && (
        <div className="json-inspector">
          <div className="json-header">
            <span>Live Response from /api/ui/schemas/{selectedSchemaKey}</span>
            <Layers size={14} />
          </div>
          <pre className="json-code">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <RefreshCw size={24} className="spin-icon text-gold" />
          <p>Fetching UI Schema from Python Backend...</p>
        </div>
      ) : error ? (
        <div className="alert-banner alert-error">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      ) : schema ? (
        <div className="dynamic-form-card">
          <DynamicForm
            schema={schema}
            onSuccess={(data) => {
              console.log('Form submission completed:', data);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
