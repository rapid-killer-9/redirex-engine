import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    border:         '1px solid var(--border)',
    borderRadius:   'var(--radius-md)',
    background:     'transparent',
    color:          'var(--ink)',
    fontSize:       '12px',
    fontFamily:     'var(--mono)',
    letterSpacing:  '0.01em',
    cursor:         'pointer',
    transition:     'background 0.12s, opacity 0.12s, transform 0.08s',
    userSelect:     'none',
    whiteSpace:     'nowrap',
  },
};

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary: {
    background:   'var(--ink)',
    color:        'var(--paper)',
    borderColor:  'var(--ink)',
  },
  ghost: {
    background:  'transparent',
    color:       'var(--ink)',
    borderColor: 'var(--border)',
  },
  danger: {
    background:  'transparent',
    color:       'var(--red)',
    borderColor: 'var(--red)',
  },
};

const sizeStyle: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: '11px' },
  md: { padding: '7px 16px', fontSize: '12px' },
};

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        ...styles.base,
        ...variantStyle[variant],
        ...sizeStyle[size],
        ...(isDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      onMouseEnter={e => {
        if (isDisabled) return;
        const el = e.currentTarget;
        if (variant === 'primary') el.style.opacity = '0.82';
        else if (variant === 'danger') el.style.background = 'var(--red-bg)';
        else el.style.background = 'var(--surface)';
      }}
      onMouseLeave={e => {
        if (isDisabled) return;
        const el = e.currentTarget;
        el.style.opacity = '1';
        if (variant === 'primary') el.style.background = 'var(--ink)';
        else el.style.background = 'transparent';
      }}
      onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? '...' : children}
    </button>
  );
}
