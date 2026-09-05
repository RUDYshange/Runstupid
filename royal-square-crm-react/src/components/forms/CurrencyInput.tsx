import React from 'react';

interface CurrencyInputProps {
  id?: string;
  name: string;
  label: string;
  value: number | string | null | undefined;
  onChange: (val: number | null) => void;
  currencyPrefix?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  currencyPrefix = 'R',
  placeholder = '0.00',
  error,
  disabled
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimals
    const parts = raw.split('.');
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += '.' + parts[1].substring(0, 2);
    }

    if (sanitized === '' || isNaN(Number(sanitized))) {
      onChange(null);
    } else {
      onChange(parseFloat(sanitized));
    }
  };

  const formattedValue = value !== null && value !== undefined && value !== '' ? String(value) : '';

  return (
    <div className="form-group">
      <label htmlFor={id || name} className="field-label">
        {label}
      </label>
      <div className="input-affix-wrapper">
        <span className="input-prefix">{currencyPrefix}</span>
        <input
          id={id || name}
          name={name}
          type="text"
          inputMode="decimal"
          className={`form-input has-prefix ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={formattedValue}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
};
