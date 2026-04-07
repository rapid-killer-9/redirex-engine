import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ─── Label ───────────────────────────────────────────────────────────────────

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
}

export function Label({ children, htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display:       'block',
        fontSize:      '10px',
        color:         'var(--ink3)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom:  '5px',
      }}
    >
      {children}
    </label>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>{error}</p>
      )}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width:       '100%',
  fontFamily:  'var(--mono)',
  fontSize:    '13px',
  color:       'var(--ink)',
  background:  'var(--paper)',
  border:      '1px solid var(--border)',
  borderRadius:'var(--radius-md)',
  padding:     '8px 12px',
  outline:     'none',
  transition:  'border-color 0.12s',
};

// ─── Input ───────────────────────────────────────────────────────────────────

export function Input({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--ink)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function Textarea({ style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputBase, resize: 'vertical', lineHeight: '1.6', ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--ink)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    />
  );
}
