import { useState } from 'react';
import { urlsApi } from '../api';
import { Button } from './ui/Button';
import { Input, Field, Textarea } from './ui/Input';
import { ErrorMessage, CopyButton } from './ui/index';
import type { ShortenResponse } from '../types';
import { fmt } from '../utils/format';

interface ShortenFormProps {
  /** Called after a successful shorten — lets parent refresh list etc. */
  onSuccess?: (result: ShortenResponse) => void;
  /** Show extra fields (title, description, expiry) — false on hero */
  extended?: boolean;
}

export function ShortenForm({ onSuccess, extended = false }: ShortenFormProps) {
  const [url, setUrl]         = useState('');
  const [title, setTitle]     = useState('');
  const [desc, setDesc]       = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<ShortenResponse | null>(null);

  const submit = async () => {
    if (!url.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const data = await urlsApi.shorten({
        url,
        ...(title   ? { title }                                          : {}),
        ...(desc    ? { description: desc }                              : {}),
        ...(expires ? { expiresAt: new Date(expires).toISOString() }    : {}),
      });
      setResult(data);
      setUrl('');
      setTitle('');
      setDesc('');
      setExpires('');
      onSuccess?.(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setResult(null);

  if (result) {
    const shortUrl = fmt.shortUrl(result.shortKey);
    return (
      <div>
        <div
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'space-between',
            gap:           '12px',
            background:    'var(--surface)',
            borderRadius:  'var(--radius-md)',
            padding:       '12px 16px',
            marginBottom:  '12px',
          }}
        >
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '14px', color: 'var(--ink)' }}
          >
            {shortUrl}
          </a>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <CopyButton text={shortUrl} />
          </div>
        </div>
        <Button size="sm" onClick={reset} style={{ width: '100%' }}>
          shorten another →
        </Button>
      </div>
    );
  }

  return (
    <div>
      {extended ? (
        <>
          <Field label="url *" htmlFor="shorten-url" error={error ?? undefined}>
            <Input
              id="shorten-url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-long-url.com"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="title" htmlFor="shorten-title">
              <Input
                id="shorten-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="optional"
              />
            </Field>
            <Field label="expires" htmlFor="shorten-expires">
              <Input
                id="shorten-expires"
                type="date"
                value={expires}
                onChange={e => setExpires(e.target.value)}
              />
            </Field>
          </div>

          <Field label="description" htmlFor="shorten-desc">
            <Textarea
              id="shorten-desc"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="optional"
              rows={2}
            />
          </Field>
        </>
      ) : (
        /* ── Hero variant: single-row ── */
        <div style={{ display: 'flex', gap: '8px', maxWidth: '540px', margin: '0 auto' }}>
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="https://your-long-url.com/goes/here"
            style={{ fontSize: '13px' }}
          />
          <Button
            variant="primary"
            onClick={submit}
            loading={loading}
            disabled={!url.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            shorten →
          </Button>
        </div>
      )}

      {extended && (
        <Button
          variant="primary"
          onClick={submit}
          loading={loading}
          disabled={!url.trim()}
          style={{ width: '100%', marginTop: '4px' }}
        >
          shorten →
        </Button>
      )}

      {!extended && error && (
        <ErrorMessage message={error} />
      )}
    </div>
  );
}