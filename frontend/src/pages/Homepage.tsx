import { Page } from '../components/layout/Page';
import { ShortenForm } from '../components/ShortenForm';
import type { RouteProps } from '../types';

export function HomePage({ navigate }: RouteProps) {
  return (
    <Page>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '4rem 0 3.5rem' }}>
        <h1
          style={{
            fontFamily:   'var(--serif)',
            fontStyle:    'italic',
            fontSize:     'clamp(36px, 6vw, 56px)',
            fontWeight:   400,
            letterSpacing:'-2px',
            lineHeight:   1.1,
            marginBottom: '1rem',
          }}
        >
          short links,<br />zero friction
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '2.5rem' }}>
          paste a url. get a short one. track every click.
        </p>

        <ShortenForm
          onSuccess={() => navigate('dashboard')}
        />
      </div>

      {/* Feature strip */}
      <div
        style={{
          borderTop:    '1px solid var(--border)',
          paddingTop:   '2rem',
          display:      'flex',
          justifyContent:'center',
          gap:          '3rem',
        }}
      >
        {[
          ['01', 'instant shortening'],
          ['02', 'click analytics'],
          ['03', 'link management'],
        ].map(([num, label]) => (
          <div key={num} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily:  'var(--serif)',
                fontStyle:   'italic',
                fontSize:    '22px',
                color:       'var(--ink3)',
                lineHeight:  1,
              }}
            >
              {num}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}