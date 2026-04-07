import type { JwtPayload, Route } from '../types';
import { Button } from '../components/ui/Button';

interface NavbarProps {
  user:     JwtPayload | null;
  route:    Route;
  navigate: (route: Route) => void;
  onLogout: () => void;
}

export function Navbar({ user, route, navigate, onLogout }: NavbarProps) {
  return (
    <nav
      style={{
        position:       'sticky',
        top:            0,
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        height:         '52px',
        padding:        '0 2rem',
        background:     'var(--paper)',
        borderBottom:   '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('home')}
        style={{
          fontFamily:   'var(--serif)',
          fontStyle:    'italic',
          fontSize:     '20px',
          letterSpacing:'-0.5px',
          background:   'none',
          border:       'none',
          color:        'var(--ink)',
          cursor:       'pointer',
          padding:      0,
        }}
      >
        redirex
      </button>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user ? (
          <>
            <span
              style={{
                fontSize:  '11px',
                color:     'var(--ink3)',
                maxWidth:  '160px',
                overflow:  'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:'nowrap',
              }}
            >
              {user.email}
            </span>
            {route !== 'dashboard' && (
              <Button size="sm" onClick={() => navigate('dashboard')}>
                dashboard
              </Button>
            )}
            <Button size="sm" onClick={onLogout}>
              sign out
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => navigate('login')}>
              sign in
            </Button>
            <Button size="sm" variant="primary" onClick={() => navigate('login')}>
              register
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}