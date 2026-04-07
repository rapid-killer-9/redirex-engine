import { useState } from 'react';
import { Page, Card } from '../components/layout/Page';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { ErrorMessage, Tabs } from '../components/ui/index';
import type { RouteProps } from '../types';

interface LoginPageProps extends RouteProps {
  onLogin:    (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

type Tab = 'login' | 'register';

export function LoginPage({ navigate, onLogin, onRegister }: LoginPageProps) {
  const [tab,      setTab]      = useState<Tab>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const switchTab = (t: string) => {
    setTab(t as Tab);
    setError(null);
  };

  const submit = async () => {
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
      navigate('dashboard');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <div style={{ maxWidth: '380px', margin: '4rem auto 0' }}>
        <h1
          style={{
            fontFamily:   'var(--serif)',
            fontStyle:    'italic',
            fontSize:     '28px',
            fontWeight:   400,
            letterSpacing:'-0.5px',
            marginBottom: '6px',
          }}
        >
          {tab === 'login' ? 'welcome back' : 'create account'}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '1.5rem' }}>
          {tab === 'login'
            ? 'sign in to manage your links'
            : 'start shortening in seconds'}
        </p>

        <Tabs tabs={['login', 'register']} active={tab} onChange={switchTab} />

        <Card>
          <Field label="email" htmlFor="auth-email">
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
          </Field>

          <Field label="password" htmlFor="auth-password">
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </Field>

          <ErrorMessage message={error} />

          <Button
            variant="primary"
            loading={loading}
            disabled={!email || !password}
            onClick={submit}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {tab === 'login' ? 'sign in →' : 'create account →'}
          </Button>
        </Card>
      </div>
    </Page>
  );
}