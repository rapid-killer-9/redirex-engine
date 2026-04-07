import type { ReactNode } from 'react';
import { useCopy } from '../../hooks/useCopy';

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'active' | 'inactive' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const badgeColors: Record<BadgeVariant, React.CSSProperties> = {
  active:   { color: 'var(--green)',  border: '1px solid var(--green)',  background: 'var(--green-bg)' },
  inactive: { color: 'var(--ink3)',   border: '1px solid var(--border)', background: 'transparent'     },
  neutral:  { color: 'var(--amber)',  border: '1px solid var(--amber)',  background: 'var(--amber-bg)' },
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      style={{
        fontSize:     '10px',
        padding:      '2px 7px',
        borderRadius: 'var(--radius-sm)',
        fontFamily:   'var(--mono)',
        ...badgeColors[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        width:        '32px',
        height:       '18px',
        borderRadius: '9px',
        border:       'none',
        background:   checked ? 'var(--ink)' : 'var(--border)',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        padding:      '3px',
        transition:   'background 0.18s',
        flexShrink:   0,
      }}
    >
      <span
        style={{
          width:       '12px',
          height:      '12px',
          borderRadius:'50%',
          background:  'var(--paper)',
          transform:   checked ? 'translateX(14px)' : 'translateX(0)',
          transition:  'transform 0.18s',
          display:     'block',
          flexShrink:  0,
        }}
      />
    </button>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const { copied, copy } = useCopy();

  return (
    <button
      onClick={() => copy(text)}
      style={{
        fontSize:    '10px',
        padding:     '2px 8px',
        border:      `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
        borderRadius:'var(--radius-sm)',
        background:  copied ? 'var(--green-bg)' : 'transparent',
        color:       copied ? 'var(--green)' : 'var(--ink3)',
        fontFamily:  'var(--mono)',
        cursor:      'pointer',
        transition:  'all 0.15s',
      }}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding:   '3rem',
        color:     'var(--ink3)',
        fontSize:  '12px',
      }}
    >
      loading...
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyProps {
  message: string;
  hint?: string;
}

export function Empty({ message, hint }: EmptyProps) {
  return (
    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
      <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>{message}</p>
      {hint && <p style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '6px' }}>{hint}</p>}
    </div>
  );
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

interface ErrorMsgProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMsgProps) {
  if (!message) return null;
  return (
    <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '6px' }}>{message}</p>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        background:   'var(--surface)',
        borderRadius: 'var(--radius-md)',
        padding:      '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily:   'var(--serif)',
          fontStyle:    'italic',
          fontSize:     '28px',
          letterSpacing:'-1px',
          lineHeight:   1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize:      '10px',
          color:         'var(--ink3)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginTop:     '4px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs:      string[];
  active:    string;
  onChange:  (tab: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      style={{
        display:       'flex',
        borderBottom:  '1px solid var(--border)',
        marginBottom:  '1.5rem',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            fontFamily:    'var(--mono)',
            fontSize:      '12px',
            padding:       '8px 16px',
            color:         active === tab ? 'var(--ink)' : 'var(--ink3)',
            background:    'transparent',
            border:        'none',
            borderBottom:  active === tab ? '2px solid var(--ink)' : '2px solid transparent',
            marginBottom:  '-1px',
            cursor:        'pointer',
            transition:    'all 0.12s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ margin = '1.5rem 0' }: { margin?: string }) {
  return <div style={{ borderTop: '1px solid var(--border)', margin }} />;
}