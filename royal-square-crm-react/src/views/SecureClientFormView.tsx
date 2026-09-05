import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, ClientFormData } from '../schemas/clientSchema';
import { MaskedIdInput } from '../components/forms/MaskedIdInput';
import { CurrencyInput } from '../components/forms/CurrencyInput';
import { HoneypotField } from '../components/forms/HoneypotField';
import { sanitizeInput } from '../security/sanitizer';
import { acquireSubmissionLock, releaseSubmissionLock } from '../security/csrf';
import { secureFetch } from '../services/api';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

interface SecureClientFormViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const SecureClientFormView: React.FC<SecureClientFormViewProps> = ({
  onBack,
  onSuccess
}) => {
  const [honeypot, setHoneypot] = useState<string>('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      title: 'Mr',
      firstName: '',
      secondName: '',
      surname: '',
      idNumber: '',
      dateOfBirth: '',
      emailAddress: '',
      mobileNumber: '',
      occupation: '',
      employer: '',
      annualIncome: null,
      riskProfile: 'MODERATE',
      primaryAddress: ''
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    setStatusMessage(null);

    // 1. Honeypot check
    if (honeypot.trim() !== '') {
      console.warn('Bot submission blocked via Honeypot trap.');
      setSubmissionStatus('error');
      setStatusMessage('Security verification failed. Please reload.');
      return;
    }

    // 2. Double submit prevention
    if (!acquireSubmissionLock('client-form')) {
      return;
    }

    setSubmissionStatus('submitting');

    try {
      const payload = {
        title: sanitizeInput(data.title),
        firstName: sanitizeInput(data.firstName),
        secondName: data.secondName ? sanitizeInput(data.secondName) : null,
        surname: sanitizeInput(data.surname),
        idNumber: data.idNumber, // Raw 13 digits for database
        dateOfBirth: data.dateOfBirth || null,
        emailAddress: sanitizeInput(data.emailAddress),
        mobileNumber: sanitizeInput(data.mobileNumber),
        occupation: data.occupation ? sanitizeInput(data.occupation) : null,
        employer: data.employer ? sanitizeInput(data.employer) : null,
        annualIncome: data.annualIncome || null,
        riskProfile: data.riskProfile,
        primaryAddress: data.primaryAddress ? sanitizeInput(data.primaryAddress) : null
      };

      const res = await secureFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.error) {
        setSubmissionStatus('error');
        setStatusMessage(res.error);
      } else {
        setSubmissionStatus('success');
        setStatusMessage(`Client ${res.data.fullName} registered successfully with reference ${res.data.reference}!`);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setSubmissionStatus('error');
      setStatusMessage(err.message || 'Submission error');
    } finally {
      releaseSubmissionLock('client-form');
    }
  };

  return (
    <div className="view-container">
      <button className="btn-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Portfolio Register
      </button>

      <div className="form-card-wrapper">
        <div className="security-banner">
          <div className="security-banner-icon">
            <Lock size={20} className="text-gold" />
          </div>
          <div>
            <h4 className="security-banner-title">Hardened Form Architecture (React Hook Form + Zod + POPIA)</h4>
            <p className="security-banner-desc">
              Features active XSS stripping, RSA Luhn validation, POPIA field masking, CSRF header token injection, and anti-bot honeypots.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`alert-banner ${submissionStatus === 'success' ? 'alert-success' : 'alert-error'}`}>
            {submissionStatus === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="hardened-form" noValidate>
          <HoneypotField value={honeypot} onChange={setHoneypot} />

          {/* Personal Particulars */}
          <div className="form-section">
            <h3 className="section-title">1. Personal Particulars</h3>
            <div className="form-grid grid-cols-2">
              <div className="form-group">
                <label className="field-label">Title *</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <select className="form-input" {...field}>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Adv">Adv</option>
                      <option value="Prof">Prof</option>
                    </select>
                  )}
                />
                {errors.title && <p className="field-error">{errors.title.message}</p>}
              </div>

              <div className="form-group">
                <label className="field-label">First Name *</label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <input
                      className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                      placeholder="e.g. Sipho"
                      {...field}
                    />
                  )}
                />
                {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
              </div>

              <div className="form-group">
                <label className="field-label">Second Name (Optional)</label>
                <Controller
                  name="secondName"
                  control={control}
                  render={({ field }) => (
                    <input
                      className="form-input"
                      placeholder="e.g. Bheki"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Surname *</label>
                <Controller
                  name="surname"
                  control={control}
                  render={({ field }) => (
                    <input
                      className={`form-input ${errors.surname ? 'input-error' : ''}`}
                      placeholder="e.g. Dlamini"
                      {...field}
                    />
                  )}
                />
                {errors.surname && <p className="field-error">{errors.surname.message}</p>}
              </div>

              {/* Masked RSA ID Input */}
              <div className="form-group span-full">
                <Controller
                  name="idNumber"
                  control={control}
                  render={({ field }) => (
                    <MaskedIdInput
                      value={field.value}
                      onChange={field.onChange}
                      onDobDetected={(dob) => setValue('dateOfBirth', dob)}
                      error={errors.idNumber?.message}
                      disabled={submissionStatus === 'submitting'}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Date of Birth</label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      className="form-input"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Mandate Risk Profile *</label>
                <Controller
                  name="riskProfile"
                  control={control}
                  render={({ field }) => (
                    <select className="form-input" {...field}>
                      <option value="CONSERVATIVE">Conservative (Capital Preservation)</option>
                      <option value="MODERATE">Moderate (Balanced Growth)</option>
                      <option value="AGGRESSIVE">Aggressive (Long-Term Capital Gain)</option>
                    </select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Contact & Financial Details */}
          <div className="form-section">
            <h3 className="section-title">2. Contact & Financial Particulars</h3>
            <div className="form-grid grid-cols-2">
              <div className="form-group">
                <label className="field-label">Email Address *</label>
                <Controller
                  name="emailAddress"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="email"
                      className={`form-input ${errors.emailAddress ? 'input-error' : ''}`}
                      placeholder="sipho.dlamini@naspers.com"
                      {...field}
                    />
                  )}
                />
                {errors.emailAddress && <p className="field-error">{errors.emailAddress.message}</p>}
              </div>

              <div className="form-group">
                <label className="field-label">Mobile Number *</label>
                <Controller
                  name="mobileNumber"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="tel"
                      className={`form-input ${errors.mobileNumber ? 'input-error' : ''}`}
                      placeholder="+27 82 555 1234"
                      {...field}
                    />
                  )}
                />
                {errors.mobileNumber && <p className="field-error">{errors.mobileNumber.message}</p>}
              </div>

              <div className="form-group">
                <label className="field-label">Occupation</label>
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <input
                      className="form-input"
                      placeholder="e.g. Chief Technology Officer"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Employer</label>
                <Controller
                  name="employer"
                  control={control}
                  render={({ field }) => (
                    <input
                      className="form-input"
                      placeholder="e.g. Naspers Fintech"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Currency Input (ZAR) */}
              <div className="form-group span-full">
                <Controller
                  name="annualIncome"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      name="annualIncome"
                      label="Gross Annual Remuneration (ZAR)"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="2,400,000.00"
                      currencyPrefix="R"
                      error={errors.annualIncome?.message}
                      disabled={submissionStatus === 'submitting'}
                    />
                  )}
                />
              </div>

              <div className="form-group span-full">
                <label className="field-label">Primary Residential Address</label>
                <Controller
                  name="primaryAddress"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Street address, Suburb, City, Postal code"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={onBack} disabled={submissionStatus === 'submitting'}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submissionStatus === 'submitting'}>
              {submissionStatus === 'submitting' ? (
                <>
                  <Loader2 size={16} className="spin-icon" /> Validating & Encrypting...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Register Client Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
