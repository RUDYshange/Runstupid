import React, { useState } from 'react';
import { DynamicFormSchema, FormFieldSchema } from '../../schemas/formTypes';
import { SecureInput } from './SecureInput';
import { MaskedIdInput } from './MaskedIdInput';
import { CurrencyInput } from './CurrencyInput';
import { HoneypotField } from './HoneypotField';
import { acquireSubmissionLock, releaseSubmissionLock } from '../../security/csrf';
import { secureFetch } from '../../services/api';
import { Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DynamicFormProps {
  schema: DynamicFormSchema;
  initialValues?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (errorMsg: string) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialValues = {},
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = { ...initialValues };
    for (const sec of schema.sections) {
      for (const f of sec.fields) {
        if (defaults[f.name] === undefined) {
          defaults[f.name] = f.defaultValue ?? '';
        }
      }
    }
    return defaults;
  });

  const [honeypot, setHoneypot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // 1. Honeypot check (Bot detection)
    if (schema.security?.enableHoneypot && honeypot.trim() !== '') {
      console.warn('Bot submission blocked via Honeypot trap.');
      setSubmitError('Verification error. Please refresh and try again.');
      return;
    }

    // 2. Double-submit lock (Idempotency)
    if (schema.security?.preventDoubleSubmit) {
      const lockAcquired = acquireSubmissionLock(schema.formId);
      if (!lockAcquired) {
        console.warn('Submission blocked: Form submission already in flight.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 3. Make secure API request
      const response = await secureFetch(schema.submitEndpoint, {
        method: schema.method || 'POST',
        body: JSON.stringify(formData)
      });

      if (response.error) {
        setSubmitError(response.error);
        if (onError) onError(response.error);
      } else {
        setSubmitSuccess('Form submitted successfully and secured under POPIA protocols.');
        if (onSuccess) onSuccess(response.data);
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred';
      setSubmitError(msg);
      if (onError) onError(msg);
    } finally {
      setIsSubmitting(false);
      if (schema.security?.preventDoubleSubmit) {
        releaseSubmissionLock(schema.formId);
      }
    }
  };

  const renderField = (field: FormFieldSchema) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'masked_rsa_id':
        return (
          <MaskedIdInput
            key={field.name}
            value={value}
            onChange={(val) => handleFieldChange(field.name, val)}
            onDobDetected={(dob) => {
              if (formData['dateOfBirth'] !== undefined) {
                handleFieldChange('dateOfBirth', dob);
              }
            }}
            disabled={isSubmitting}
          />
        );

      case 'currency':
        return (
          <CurrencyInput
            key={field.name}
            name={field.name}
            label={field.label}
            value={value}
            onChange={(val) => handleFieldChange(field.name, val)}
            placeholder={field.placeholder}
            currencyPrefix={field.currency === 'ZAR' ? 'R' : '$'}
            disabled={isSubmitting}
          />
        );

      case 'select':
        return (
          <div key={field.name} className="form-group">
            <label className="field-label">
              {field.label} {field.required && <span className="text-required">*</span>}
            </label>
            <select
              className="form-input select-input"
              value={value ?? ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isSubmitting}
              required={field.required}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="form-group span-full">
            <label className="field-label">
              {field.label} {field.required && <span className="text-required">*</span>}
            </label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder={field.placeholder}
              value={value ?? ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isSubmitting}
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <SecureInput
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type as any}
            placeholder={field.placeholder}
            value={value}
            onChange={(val) => handleFieldChange(field.name, val)}
            required={field.required}
            disabled={isSubmitting}
            helpText={field.helpText}
          />
        );
    }
  };

  return (
    <form className="dynamic-form" onSubmit={handleSubmit} noValidate>
      {schema.security?.enableHoneypot && (
        <HoneypotField value={honeypot} onChange={setHoneypot} />
      )}

      <div className="form-header">
        <div className="form-title-wrap">
          <h2 className="form-title">{schema.title}</h2>
          {schema.description && <p className="form-description">{schema.description}</p>}
        </div>
        <div className="security-badge-header">
          <Shield size={16} className="text-gold" />
          <span>Server-Driven Form Engine</span>
        </div>
      </div>

      {submitError && (
        <div className="alert-banner alert-error">
          <AlertTriangle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={18} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {schema.sections.map((section) => (
        <div key={section.id} className="form-section">
          <h3 className="section-title">{section.title}</h3>
          <div className={`form-grid grid-cols-${section.columns || 2}`}>
            {section.fields.map((field) => renderField(field))}
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spin-icon" /> Securing & Submitting...
            </>
          ) : (
            'Save Record'
          )}
        </button>
      </div>
    </form>
  );
};
