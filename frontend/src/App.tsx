import './styles/globals.css';

import { useState } from 'react';
import { Navbar }        from './pages/Navbar';
import { HomePage }      from './pages/Homepage';
import { LoginPage }     from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DetailPage }    from './pages/DetailPage';
import { useAuth }       from './hooks/useAuth';
import type { Route }    from './types';

export default function App() {
  const { user, login, register, logout } = useAuth();

  const [route,  setRoute]  = useState<Route>('home');
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = (r: Route, p: Record<string, string> = {}) => {
    setRoute(r);
    setParams(p);
  };

  // Guard authenticated routes
  const requireAuth = (element: React.ReactNode) => {
    if (!user) {
      return (
        <LoginPage
          navigate={navigate}
          onLogin={login}
          onRegister={register}
        />
      );
    }
    return element;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        route={route}
        navigate={navigate}
        onLogout={logout}
      />

      {route === 'home' && (
        <HomePage navigate={navigate} />
      )}

      {route === 'login' && (
        <LoginPage
          navigate={navigate}
          onLogin={login}
          onRegister={register}
        />
      )}

      {route === 'dashboard' && requireAuth(
        <DashboardPage navigate={navigate} />
      )}

      {route === 'detail' && requireAuth(
        <DetailPage
          navigate={navigate}
          shortKey={params.shortKey ?? ''}
        />
      )}
    </div>
  );
}
