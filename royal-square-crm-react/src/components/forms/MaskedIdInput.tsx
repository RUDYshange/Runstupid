import React, { useState } from 'react';
import { validateRsaId, maskRsaId } from '../../security/popia';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface MaskedIdInputProps {
  value: string;
  onChange: (val: string) => void;
  onDobDetected?: (dob: string) => void;
  error?: string;
  disabled?: boolean;
}

export const MaskedIdInput: React.FC<MaskedIdInputProps> = ({
  value,
  onChange,
  onDobDetected,
  error,
  disabled
}) => {
  const [isMasked, setIsMasked] = useState<boolean>(true);

  // Clean value (only digits, max 13)
  const cleanValue = (value || '').replace(/\D/g, '').substring(0, 13);
  const validation = cleanValue.length === 13 ? validateRsaId(cleanValue) : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 13);
    onChange(raw);

    if (raw.length === 13) {
      const res = validateRsaId(raw);
      if (res.isValid && res.dateOfBirth && onDobDetected) {
        onDobDetected(res.dateOfBirth);
      }
    }
  };

  const displayValue = isMasked && cleanValue.length === 13 ? maskRsaId(cleanValue) : cleanValue;

  return (
    <div className="form-group">
      <div className="label-row">
        <label htmlFor="idNumber" className="field-label">
          RSA ID Number <span className="badge-popia">POPIA Protected</span>
        </label>
        <button
          type="button"
          className="btn-toggle-mask"
          onClick={() => setIsMasked(!isMasked)}
          title={isMasked ? 'Reveal unmasked ID' : 'Mask ID number'}
          disabled={disabled || !cleanValue}
        >
          {isMasked ? (
            <>
              <Eye size={14} /> Reveal
            </>
          ) : (
            <>
              <EyeOff size={14} /> Mask
            </>
          )}
        </button>
      </div>

      <div className="input-affix-wrapper">
        <input
          id="idNumber"
          type={isMasked ? 'text' : 'text'}
          className={`form-input font-mono ${error ? 'input-error' : ''} ${
            validation?.isValid ? 'input-valid' : ''
          }`}
          placeholder="13-digit RSA National ID"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          maxLength={isMasked && cleanValue.length === 13 ? 15 : 13}
          autoComplete="off"
        />
        {validation?.isValid && (
          <span className="input-badge valid" title="Passed RSA Luhn Verification">
            <ShieldCheck size={16} /> Valid
          </span>
        )}
      </div>

      {cleanValue.length === 13 && validation && !validation.isValid && (
        <p className="field-feedback error">
          <AlertCircle size={14} /> {validation.error}
        </p>
      )}

      {validation?.isValid && (
        <div className="id-meta-info">
          <span>DOB: <strong>{validation.dateOfBirth}</strong></span>
          <span>Gender: <strong>{validation.gender}</strong></span>
          <span>Status: <strong>{validation.citizenStatus}</strong></span>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
};
