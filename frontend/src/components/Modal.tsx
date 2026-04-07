import type { ReactNode } from 'react';

interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  width?:   number;
}

export function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.45)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         200,
        padding:        '1rem',
      }}
    >
      <div
        style={{
          background:   'var(--paper)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding:      '2rem',
          width:        '100%',
          maxWidth:     width,
          maxHeight:    '90vh',
          overflowY:    'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontFamily:   'var(--serif)',
              fontStyle:    'italic',
              fontSize:     '20px',
              letterSpacing:'-0.5px',
              fontWeight:   400,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background:   'none',
              border:       'none',
              fontSize:     '18px',
              color:        'var(--ink3)',
              cursor:       'pointer',
              lineHeight:   1,
              padding:      '0 0 0 12px',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}