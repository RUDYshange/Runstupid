import React from 'react';

interface HoneypotFieldProps {
  value: string;
  onChange: (val: string) => void;
}

/**
 * Invisible honeypot field. Legitimate users never see or interact with this field.
 * Malicious scrapers / auto-fill bots fill it in, flagging the submission as fraudulent.
 */
export const HoneypotField: React.FC<HoneypotFieldProps> = ({ value, onChange }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        opacity: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        pointerEvents: 'none'
      }}
    >
      <label htmlFor="crm_security_trap">Leave this field blank</label>
      <input
        type="text"
        id="crm_security_trap"
        name="crm_security_trap"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
