import { useState } from 'react';
import { Page, Card } from '../components/layout/Page';
import { Button } from '../components/ui/Button';
import { Input, Field, Textarea } from '../components/ui/Input';
import { Badge, CopyButton, StatCard, Spinner, Tabs, Divider, ErrorMessage, Toggle } from '../components/ui/index';
import { DailyChart, DeviceChart, CountryChart } from '../components/charts/AnalyticsCharts';
import { urlsApi } from '../api';
import { useUrlDetail } from '../hooks/useUrlDetail';
import { fmt } from '../utils/format';
import type { RouteProps } from '../types';

interface DetailPageProps extends RouteProps {
  shortKey: string;
}

type ActiveTab = 'overview' | 'analytics' | 'settings';

export function DetailPage({ shortKey, navigate }: DetailPageProps) {
  const { url, analytics, loading, error, refetch } = useUrlDetail(shortKey);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  if (loading) return <Page wide><Spinner /></Page>;
  if (error || !url) return (
    <Page wide>
      <Button size="sm" onClick={() => navigate('dashboard')} style={{ marginBottom: '1rem' }}>
        ← back
      </Button>
      <p style={{ fontSize: '12px', color: 'var(--red)' }}>{error ?? 'URL not found'}</p>
    </Page>
  );

  const shortUrl = fmt.shortUrl(shortKey);

  return (
    <Page wide>
      {/* Back */}
      <button
        onClick={() => navigate('dashboard')}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
          fontSize:   '11px',
          color:      'var(--ink3)',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          fontFamily: 'var(--mono)',
          padding:    0,
          marginBottom:'1rem',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; }}
      >
        ← back to dashboard
      </button>

      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          marginBottom:   '2rem',
          gap:            '1rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1
              style={{
                fontFamily:   'var(--serif)',
                fontStyle:    'italic',
                fontSize:     '28px',
                fontWeight:   400,
                letterSpacing:'-0.5px',
              }}
            >
              /{shortKey}
            </h1>
            <Badge variant={url.is_active ? 'active' : 'inactive'}>
              {url.is_active ? 'active' : 'inactive'}
            </Badge>
          </div>
          <a
            href={url.long_url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize:     '12px',
              color:        'var(--ink3)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              maxWidth:     '500px',
              display:      'block',
            }}
          >
            {url.long_url}
          </a>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <CopyButton text={shortUrl} />
          <DeleteButton shortKey={shortKey} onDeleted={() => navigate('dashboard')} />
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:                 '12px',
          marginBottom:        '2rem',
        }}
      >
        <StatCard label="total clicks"  value={fmt.number(url.click_count)} />
        <StatCard label="device types"  value={analytics?.devices.length ?? 0} />
        <StatCard label="countries"     value={analytics?.countries.length ?? 0} />
        <StatCard label="created"       value={fmt.date(url.created_at)} />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={['overview', 'analytics', 'settings']}
        active={activeTab}
        onChange={t => setActiveTab(t as ActiveTab)}
      />

      {activeTab === 'overview'  && <OverviewTab  url={url} shortUrl={shortUrl} />}
      {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
      {activeTab === 'settings'  && <SettingsTab  url={url} shortKey={shortKey} onSaved={refetch} />}
    </Page>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ url, shortUrl }: { url: any; shortUrl: string }) {
  return (
    <Card>
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '1.5rem',
        }}
      >
        <MetaRow label="short url">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>{shortUrl}</span>
            <CopyButton text={shortUrl} />
          </div>
        </MetaRow>

        <MetaRow label="created">
          <span style={{ fontSize: '13px' }}>{fmt.datetime(url.created_at)}</span>
        </MetaRow>

        {url.title && (
          <MetaRow label="title">
            <span style={{ fontSize: '13px' }}>{url.title}</span>
          </MetaRow>
        )}

        {url.description && (
          <MetaRow label="description" span>
            <span style={{ fontSize: '13px' }}>{url.description}</span>
          </MetaRow>
        )}

        {url.expires_at && (
          <MetaRow label="expires">
            <span style={{ fontSize: '13px', color: 'var(--amber)' }}>
              {fmt.date(url.expires_at)}
            </span>
          </MetaRow>
        )}
      </div>

      {url.recent_clicks && url.recent_clicks.length > 0 && (
        <>
          <Divider />
          <p
            style={{
              fontSize:      '10px',
              color:         'var(--ink3)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom:  '10px',
            }}
          >
            recent clicks
          </p>
          {url.recent_clicks.slice(0, 5).map((c: any, i: number) => (
            <div
              key={i}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                padding:        '6px 0',
                borderBottom:   '1px solid var(--border)',
                fontSize:       '11px',
                color:          'var(--ink3)',
              }}
            >
              <span>{c.ip_address ?? 'unknown'}</span>
              <span>{c.device_type ?? 'unknown device'}</span>
              <span>{fmt.datetime(c.created_at)}</span>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ analytics }: { analytics: any }) {
  if (!analytics) return <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>loading analytics...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <p style={{ fontSize: '10px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
          clicks — last 30 days
        </p>
        <DailyChart data={analytics.daily} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card>
          <p style={{ fontSize: '10px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
            devices
          </p>
          <DeviceChart data={analytics.devices} />
        </Card>
        <Card>
          <p style={{ fontSize: '10px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
            countries
          </p>
          <CountryChart data={analytics.countries} />
        </Card>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ url, shortKey, onSaved }: { url: any; shortKey: string; onSaved: () => void }) {
  const [title,    setTitle]    = useState<string>(url.title ?? '');
  const [desc,     setDesc]     = useState<string>(url.description ?? '');
  const [isActive, setIsActive] = useState<boolean>(url.is_active);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [saved,    setSaved]    = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await urlsApi.update(shortKey, { title, description: desc, isActive });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Field label="title" htmlFor="settings-title">
        <Input
          id="settings-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="optional label for this link"
        />
      </Field>

      <Field label="description" htmlFor="settings-desc">
        <Textarea
          id="settings-desc"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="optional description"
          rows={3}
        />
      </Field>

      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '14px',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          active
        </span>
        <Toggle checked={isActive} onChange={setIsActive} />
      </div>

      <ErrorMessage message={error} />

      {saved && (
        <p style={{ fontSize: '11px', color: 'var(--green)', marginBottom: '8px' }}>
          changes saved
        </p>
      )}

      <Button
        variant="primary"
        loading={saving}
        onClick={save}
        style={{ width: '100%' }}
      >
        save changes →
      </Button>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetaRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <p style={{ fontSize: '10px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function DeleteButton({ shortKey, onDeleted }: { shortKey: string; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete /${shortKey} permanently?`)) return;
    setLoading(true);
    try {
      await urlsApi.delete(shortKey);
      onDeleted();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="danger" loading={loading} onClick={handleDelete}>
      delete
    </Button>
  );
}