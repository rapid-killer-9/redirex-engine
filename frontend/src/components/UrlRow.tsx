import { useState } from 'react';
import { urlsApi } from '../api';
import { Badge, CopyButton, Toggle } from '../components/ui/index';
import { Button } from '../components/ui/Button';
import type { UrlRecord, Route } from '../types';
import { fmt } from '../utils/format';

interface UrlRowProps {
  url:       UrlRecord;
  onRefresh: () => void;
  navigate:  (route: Route, params?: Record<string, string>) => void;
}

export function UrlRow({ url, onRefresh, navigate }: UrlRowProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const shortUrl = fmt.shortUrl(url.short_key);

  const handleToggle = async (active: boolean) => {
    setToggling(true);
    try {
      await urlsApi.update(url.short_key, { isActive: active });
      onRefresh();
    } catch {
      // silently fail — user sees no change
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete /${url.short_key}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await urlsApi.delete(url.short_key);
      onRefresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        display:       'grid',
        gridTemplateColumns: '1fr auto',
        gap:           '12px',
        alignItems:    'center',
        padding:       '14px 0',
        borderBottom:  '1px solid var(--border)',
      }}
    >
      {/* Left: URL info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ fontSize: '14px', fontFamily: 'var(--mono)' }}>
            /{url.short_key}
          </span>
          <Badge variant={url.is_active ? 'active' : 'inactive'}>
            {url.is_active ? 'active' : 'off'}
          </Badge>
          {url.title && (
            <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>
              {fmt.truncate(url.title, 40)}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize:     '11px',
            color:        'var(--ink3)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            maxWidth:     '480px',
            marginBottom: '5px',
          }}
        >
          {url.long_url}
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>
            {fmt.number(url.click_count)} clicks
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>
            {fmt.date(url.created_at)}
          </span>
          {url.expires_at && (
            <span style={{ fontSize: '11px', color: 'var(--amber)' }}>
              expires {fmt.date(url.expires_at)}
            </span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <CopyButton text={shortUrl} />
        <Toggle
          checked={url.is_active}
          onChange={handleToggle}
          disabled={toggling}
        />
        <Button
          size="sm"
          onClick={() => navigate('detail', { shortKey: url.short_key })}
        >
          view
        </Button>
        <Button
          size="sm"
          variant="danger"
          loading={deleting}
          onClick={handleDelete}
        >
          del
        </Button>
      </div>
    </div>
  );
}