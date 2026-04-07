import type { ReactNode } from 'react';

interface PageProps {
  children: ReactNode;
  wide?:    boolean;
  center?:  boolean;
}

export function Page({ children, wide = false, center = false }: PageProps) {
  return (
    <main
      style={{
        flex:      1,
        padding:   '3rem 2rem',
        maxWidth:  wide ? '1060px' : '820px',
        margin:    '0 auto',
        width:     '100%',
        ...(center
          ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
          : {}),
      }}
    >
      {children}
    </main>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

interface PageHeadingProps {
  title:     string;
  subtitle?: string;
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h1
        style={{
          fontFamily:   'var(--serif)',
          fontStyle:    'italic',
          fontSize:     '32px',
          fontWeight:   400,
          letterSpacing:'-1px',
          lineHeight:   1.15,
          marginBottom: '6px',
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  padding?: string;
  style?:   React.CSSProperties;
}

export function Card({ children, padding = '1.5rem', style }: CardProps) {
  return (
    <div
      style={{
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background:   'var(--paper)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}